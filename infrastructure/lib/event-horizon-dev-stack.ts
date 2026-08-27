import * as path from "node:path";
import * as cdk from "aws-cdk-lib/core";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as scheduler from "aws-cdk-lib/aws-scheduler";
import { EcsRunFargateTask } from "aws-cdk-lib/aws-scheduler-targets";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { getCdkEnv } from "./config";
import { resourceName } from "./naming";
import { applyStandardTags, stackTags } from "./tags";

/** Existing SecureString. Imported by name so stack deletion does not delete it. */
export const TICKETMASTER_API_KEY_PARAMETER_NAME =
  "/portfolio/dev/event-horizon/ticketmaster-api-key";

const LAMBDA_TIMEOUT = cdk.Duration.seconds(20);
const QUEUE_VISIBILITY = cdk.Duration.seconds(60);

/**
 * Event Horizon Phase 5: EventBridge Scheduler starts the existing
 * Fargate worker twice daily. PostgreSQL/Prisma remains transactional SoT.
 */
export class EventHorizonDevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      description:
        "Event Horizon Phase 5: twice-daily EventBridge Scheduler refresh of the existing Ticketmaster Fargate worker.",
      ...props,
      env: props?.env ?? getCdkEnv(),
      tags: {
        ...stackTags("event-horizon"),
        ...props?.tags,
      },
    });

    applyStandardTags(this, "event-horizon");

    const table = new dynamodb.Table(this, "ExternalEvents", {
      tableName: resourceName("event-horizon", "external-events"),
      partitionKey: { name: "provider", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "externalId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      timeToLiveAttribute: "expiresAt",
    });

    const deadLetterQueue = new sqs.Queue(this, "IngestionDlq", {
      queueName: resourceName("event-horizon", "ingestion-dlq"),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const ingestionQueue = new sqs.Queue(this, "IngestionQueue", {
      queueName: resourceName("event-horizon", "ingestion-queue"),
      retentionPeriod: cdk.Duration.days(4),
      visibilityTimeout: QUEUE_VISIBILITY,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: deadLetterQueue,
      },
    });

    const functionName = resourceName("event-horizon", "ingestion-handler");
    const ingestionHandler = new NodejsFunction(this, "IngestionHandler", {
      functionName,
      description: "Consumes Event Horizon external-event SQS messages and upserts DynamoDB records.",
      entry: path.join(__dirname, "../lambda/event-horizon-ingestion/handler.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: LAMBDA_TIMEOUT,
      logGroup: new logs.LogGroup(this, "IngestionHandlerLogs", {
        logGroupName: `/aws/lambda/${functionName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: {
        EXTERNAL_EVENTS_TABLE_NAME: resourceName("event-horizon", "external-events"),
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: "node22",
        externalModules: ["@aws-sdk/*"],
      },
    });

    table.grant(ingestionHandler, "dynamodb:UpdateItem");
    ingestionHandler.addEventSource(
      new SqsEventSource(ingestionQueue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      }),
    );

    const readerName = resourceName("event-horizon", "external-events-reader");
    const externalEventsReader = new NodejsFunction(this, "ExternalEventsReader", {
      functionName: readerName,
      description: "Public read-only listing of Event Horizon external discovery events.",
      entry: path.join(__dirname, "../lambda/event-horizon-external-events-reader/handler.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      logGroup: new logs.LogGroup(this, "ExternalEventsReaderLogs", {
        logGroupName: `/aws/lambda/${readerName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: {
        EXTERNAL_EVENTS_TABLE_NAME: resourceName("event-horizon", "external-events"),
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: "node22",
        externalModules: ["@aws-sdk/*"],
      },
    });

    // Query the provider partition only. No Scan, and no write actions.
    table.grant(externalEventsReader, "dynamodb:Query");

    const readerUrl = externalEventsReader.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "https://www.christopherkilo.com",
          "https://christopherkilo.com",
        ],
        allowedMethods: [lambda.HttpMethod.GET],
        allowedHeaders: ["content-type"],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Fargate requires VPC networking. Public subnets + no NAT keeps this cheap:
    // the short-lived task can use a public IP to reach SQS (and later provider APIs).
    const vpc = new ec2.Vpc(this, "EventHorizonVpc", {
      vpcName: resourceName("event-horizon", "vpc"),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    const workerSecurityGroup = new ec2.SecurityGroup(this, "IngestionWorkerSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Egress for the Event Horizon ingestion worker to reach SQS.",
    });

    const cluster = new ecs.Cluster(this, "EventHorizonCluster", {
      clusterName: resourceName("event-horizon", "cluster"),
      vpc,
      containerInsightsV2: ecs.ContainerInsights.DISABLED,
    });

    const workerLogGroup = new logs.LogGroup(this, "IngestionWorkerLogs", {
      logGroupName: `/ecs/${resourceName("event-horizon", "ingestion-worker")}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const workerTask = new ecs.FargateTaskDefinition(this, "IngestionWorkerTask", {
      family: resourceName("event-horizon", "ingestion-worker-task"),
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Import the existing SecureString. Do not create or own the parameter.
    const ticketmasterApiKey = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      "TicketmasterApiKey",
      {
        parameterName: TICKETMASTER_API_KEY_PARAMETER_NAME,
      },
    );

    workerTask.addContainer("ingestion-worker", {
      containerName: "ingestion-worker",
      image: ecs.ContainerImage.fromAsset(
        path.join(__dirname, "../workers/event-horizon-provider"),
        {
          platform: Platform.LINUX_ARM64,
          file: "Dockerfile",
        },
      ),
      essential: true,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "ingestion-worker",
        logGroup: workerLogGroup,
      }),
      environment: {
        INGESTION_QUEUE_URL: ingestionQueue.queueUrl,
        EVENT_PROVIDER: "ticketmaster",
        EVENT_CITY: "Dallas",
        EVENT_STATE_CODE: "TX",
        EVENT_COUNTRY_CODE: "US",
        EVENT_PAGE_SIZE: "20",
      },
      // ECS injects this at runtime via the execution role, not the task role.
      secrets: {
        TICKETMASTER_API_KEY: new TicketmasterApiKeySecret(ticketmasterApiKey),
      },
    });

    workerTask.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        sid: "SendIngestionMessages",
        actions: ["sqs:SendMessage"],
        resources: [ingestionQueue.queueArn],
      }),
    );

    // EventBridge Scheduler invokes ecs:RunTask on this same short-lived
    // Fargate task. There is still no ECS Service and no extra Lambda.
    const refreshScheduleName = resourceName("event-horizon", "ingestion-refresh");
    const refreshTarget = new EcsRunFargateTask(cluster, {
      taskDefinition: workerTask,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [workerSecurityGroup],
      assignPublicIp: true,
      retryAttempts: 2,
      maxEventAge: cdk.Duration.hours(1),
    });
    const refreshSchedule = new scheduler.Schedule(this, "IngestionRefreshSchedule", {
      scheduleName: refreshScheduleName,
      description:
        "Starts the existing Event Horizon Ticketmaster Fargate worker at 8:00 AM and 8:00 PM America/Chicago.",
      schedule: scheduler.ScheduleExpression.cron({
        minute: "0",
        hour: "8,20",
        timeZone: cdk.TimeZone.AMERICA_CHICAGO,
      }),
      target: refreshTarget,
      enabled: true,
    });

    new cdk.CfnOutput(this, "IngestionQueueUrl", {
      description: "Event Horizon ingestion queue URL",
      value: ingestionQueue.queueUrl,
    });
    new cdk.CfnOutput(this, "ExternalEventsTableName", {
      description: "Event Horizon external-events table name",
      value: table.tableName,
    });
    new cdk.CfnOutput(this, "IngestionFunctionName", {
      description: "Event Horizon ingestion Lambda function name",
      value: ingestionHandler.functionName,
    });
    new cdk.CfnOutput(this, "EventHorizonClusterName", {
      description: "Event Horizon ECS cluster name",
      value: cluster.clusterName,
    });
    new cdk.CfnOutput(this, "IngestionWorkerTaskDefinitionFamily", {
      description: "Event Horizon ingestion worker Fargate task family",
      value: workerTask.family,
    });
    new cdk.CfnOutput(this, "IngestionWorkerSecurityGroupId", {
      description: "Security group for a manual Fargate run-task",
      value: workerSecurityGroup.securityGroupId,
    });
    new cdk.CfnOutput(this, "ExternalEventsReaderUrl", {
      description: "Public HTTPS Function URL for read-only external events",
      value: readerUrl.url,
    });
    new cdk.CfnOutput(this, "ExternalEventsReaderFunctionName", {
      description: "Event Horizon external-events reader Lambda name",
      value: externalEventsReader.functionName,
    });
    new cdk.CfnOutput(this, "IngestionRefreshScheduleName", {
      description: "EventBridge Scheduler name for twice-daily Ticketmaster refresh",
      value: refreshSchedule.scheduleName,
    });
    new cdk.CfnOutput(this, "IngestionRefreshScheduleArn", {
      description: "EventBridge Scheduler ARN for twice-daily Ticketmaster refresh",
      value: refreshSchedule.scheduleArn,
    });
  }
}

/**
 * ECS secret injection only needs ssm:GetParameters on the existing parameter.
 * Avoid parameter.grantRead(), which also adds DescribeParameters / history.
 */
class TicketmasterApiKeySecret extends ecs.Secret {
  readonly hasField = false;

  constructor(private readonly parameter: ssm.IParameter) {
    super();
  }

  get arn(): string {
    return this.parameter.parameterArn;
  }

  grantRead(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipal({
      grantee,
      actions: ["ssm:GetParameters"],
      resourceArns: [this.parameter.parameterArn],
    });
  }
}
