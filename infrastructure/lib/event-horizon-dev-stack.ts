import * as path from "node:path";
import * as cdk from "aws-cdk-lib/core";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { getCdkEnv } from "./config";
import { resourceName } from "./naming";
import { applyStandardTags, stackTags } from "./tags";

const LAMBDA_TIMEOUT = cdk.Duration.seconds(20);
const QUEUE_VISIBILITY = cdk.Duration.seconds(60);

/**
 * Event Horizon Phase 1: external-event ingestion backbone.
 * SQS → Lambda → DynamoDB. PostgreSQL/Prisma remains the transactional source of truth.
 */
export class EventHorizonDevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      description: "Event Horizon Phase 1: SQS to Lambda to DynamoDB external-event ingestion.",
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

    table.grant(ingestionHandler, "dynamodb:PutItem");
    ingestionHandler.addEventSource(
      new SqsEventSource(ingestionQueue, {
        batchSize: 10,
        reportBatchItemFailures: true,
      }),
    );

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
  }
}
