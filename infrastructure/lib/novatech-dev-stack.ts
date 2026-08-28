import * as path from "node:path";
import * as cdk from "aws-cdk-lib/core";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { getCdkEnv } from "./config";
import {
  HUBSPOT_ACCESS_TOKEN_PARAMETER_NAME,
  NOVATECH_APP_URL,
  NOVATECH_FROM_EMAIL,
  NOVATECH_STAFF_EMAIL,
  RESEND_API_KEY_PARAMETER_NAME,
  VERCEL_PROJECT_NAME,
  VERCEL_TEAM_SLUG,
  WORKFLOW_TTL_SECONDS,
} from "./novatech-constants";
import { resourceName } from "./naming";
import { applyStandardTags, stackTags } from "./tags";

const NOTIFICATION_LAMBDA_TIMEOUT = cdk.Duration.seconds(15);
const NOTIFICATION_VISIBILITY = cdk.Duration.seconds(45);

/**
 * NovaTech Phase 4: durable CRM workflow + public Next.js ingress via StartExecution.
 * The browser never talks to AWS. Vercel Production/Preview may assume a
 * StartExecution-only role through OIDC.
 */
export class NovaTechDevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      description:
        "NovaTech Phase 4: Step Functions inquiry workflow. Vercel OIDC may StartExecution only.",
      ...props,
      env: props?.env ?? getCdkEnv(),
      tags: {
        ...stackTags("novatech"),
        ...props?.tags,
      },
    });

    applyStandardTags(this, "novatech");

    const table = new dynamodb.Table(this, "InquiryWorkflows", {
      tableName: resourceName("novatech", "inquiry-workflows"),
      partitionKey: { name: "submissionId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      timeToLiveAttribute: "expiresAt",
    });

    const hubspotAccessToken = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      "HubSpotAccessToken",
      {
        parameterName: HUBSPOT_ACCESS_TOKEN_PARAMETER_NAME,
      },
    );

    const hubspotCrmName = resourceName("novatech", "hubspot-crm");
    const hubspotCrm = new NodejsFunction(this, "HubSpotCrm", {
      functionName: hubspotCrmName,
      description:
        "NovaTech Phase 2 HubSpot CRM task. Reads the HubSpot token from SSM. No Resend, Turnstile, or DynamoDB.",
      entry: path.join(__dirname, "../lambda/novatech-hubspot-crm/handler.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(20),
      environment: {
        HUBSPOT_ACCESS_TOKEN_PARAMETER_NAME,
        HUBSPOT_PIPELINE_ID: "default",
        HUBSPOT_DEAL_STAGE_ID: "appointmentscheduled",
      },
      logGroup: new logs.LogGroup(this, "HubSpotCrmLogs", {
        logGroupName: `/aws/lambda/${hubspotCrmName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      bundling: {
        minify: true,
        sourceMap: false,
        target: "node22",
        externalModules: ["@aws-sdk/*"],
      },
    });

    hubspotCrm.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "ReadHubSpotAccessToken",
        actions: ["ssm:GetParameter"],
        resources: [hubspotAccessToken.parameterArn],
      }),
    );

    const resendApiKey = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      "ResendApiKey",
      {
        parameterName: RESEND_API_KEY_PARAMETER_NAME,
      },
    );

    const notificationDlq = new sqs.Queue(this, "NotificationDlq", {
      queueName: resourceName("novatech", "notifications-dlq"),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const notificationQueue = new sqs.Queue(this, "NotificationQueue", {
      queueName: resourceName("novatech", "notifications"),
      retentionPeriod: cdk.Duration.days(4),
      visibilityTimeout: NOTIFICATION_VISIBILITY,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: notificationDlq,
      },
    });

    const notificationHandlerName = resourceName("novatech", "notification-handler");
    const notificationHandler = new NodejsFunction(this, "NotificationHandler", {
      functionName: notificationHandlerName,
      description:
        "NovaTech Phase 3 notification worker. Sends Resend email from SQS. Does not call HubSpot.",
      entry: path.join(__dirname, "../lambda/novatech-notification-handler/handler.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: NOTIFICATION_LAMBDA_TIMEOUT,
      environment: {
        RESEND_API_KEY_PARAMETER_NAME,
        INQUIRY_WORKFLOWS_TABLE_NAME: resourceName("novatech", "inquiry-workflows"),
        NOVATECH_FROM_EMAIL,
        NOVATECH_STAFF_EMAIL,
        NOVATECH_APP_URL,
      },
      logGroup: new logs.LogGroup(this, "NotificationHandlerLogs", {
        logGroupName: `/aws/lambda/${notificationHandlerName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      bundling: {
        minify: true,
        sourceMap: false,
        target: "node22",
        externalModules: ["@aws-sdk/*"],
      },
    });

    notificationHandler.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "ReadResendApiKey",
        actions: ["ssm:GetParameter"],
        resources: [resendApiKey.parameterArn],
      }),
    );
    table.grant(notificationHandler, "dynamodb:UpdateItem");
    notificationHandler.addEventSource(
      new SqsEventSource(notificationQueue, {
        batchSize: 5,
        reportBatchItemFailures: true,
      }),
    );

    const acquireExpiresAt = Math.floor(Date.now() / 1000) + WORKFLOW_TTL_SECONDS;

    const acquireSubmission = new tasks.DynamoPutItem(this, "AcquireSubmission", {
      table,
      item: {
        submissionId: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$.submissionId"),
        ),
        status: tasks.DynamoAttributeValue.fromString("IN_PROGRESS"),
        crmStatus: tasks.DynamoAttributeValue.fromString("PENDING"),
        executionName: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$$.Execution.Name"),
        ),
        requestId: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$.requestId"),
        ),
        createdAt: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$$.Execution.StartTime"),
        ),
        updatedAt: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$$.Execution.StartTime"),
        ),
        expiresAt: tasks.DynamoAttributeValue.fromNumber(acquireExpiresAt),
      },
      conditionExpression: "attribute_not_exists(submissionId)",
      resultPath: sfn.JsonPath.DISCARD,
    });

    const duplicateResult = new sfn.Pass(this, "DuplicateResult", {
      parameters: {
        duplicate: true,
        outcome: "duplicate",
        "submissionId.$": "$.submissionId",
        "requestId.$": "$.requestId",
      },
    });
    const duplicateSuccess = new sfn.Succeed(this, "DuplicateSuccess");
    duplicateResult.next(duplicateSuccess);

    acquireSubmission.addCatch(duplicateResult, {
      errors: [
        "DynamoDB.ConditionalCheckFailedException",
        "ConditionalCheckFailedException",
      ],
      resultPath: "$.duplicateError",
    });

    const hubspotCrmStep = new tasks.LambdaInvoke(this, "HubSpotCRM", {
      lambdaFunction: hubspotCrm,
      payload: sfn.TaskInput.fromObject({
        "submissionId.$": "$.submissionId",
        "requestId.$": "$.requestId",
        "inquiry.$": "$.inquiry",
      }),
      payloadResponseOnly: true,
      resultPath: "$.crm",
      retryOnServiceExceptions: false,
    });

    hubspotCrmStep.addRetry({
      errors: ["TransientFailure"],
      interval: cdk.Duration.seconds(1),
      backoffRate: 2,
      maxAttempts: 2,
    });

    const markCompleted = new tasks.DynamoUpdateItem(this, "MarkCompleted", {
      table,
      key: {
        submissionId: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$.submissionId"),
        ),
      },
      updateExpression:
        "SET #status = :completed, crmStatus = :crmStatus, contactId = :contactId, dealId = :dealId, notificationStatus = :notificationStatus, updatedAt = :updatedAt, expiresAt = :expiresAt",
      expressionAttributeNames: { "#status": "status" },
      expressionAttributeValues: {
        ":completed": tasks.DynamoAttributeValue.fromString("COMPLETED"),
        ":crmStatus": tasks.DynamoAttributeValue.fromString("CRM_COMPLETED"),
        ":contactId": tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$.crm.contactId"),
        ),
        ":dealId": tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$.crm.dealId"),
        ),
        ":notificationStatus": tasks.DynamoAttributeValue.fromString("QUEUED"),
        ":updatedAt": tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$$.State.EnteredTime"),
        ),
        ":expiresAt": tasks.DynamoAttributeValue.numberFromString(
          sfn.JsonPath.format("{}", sfn.JsonPath.numberAt("$.crm.expiresAt") as unknown as string),
        ),
      },
      conditionExpression: "attribute_exists(submissionId)",
      resultPath: sfn.JsonPath.DISCARD,
    });

    const completedSuccess = new sfn.Succeed(this, "CompletedSuccess");
    markCompleted.next(completedSuccess);

    const queueCustomer = new tasks.SqsSendMessage(this, "QueueCustomerNotification", {
      queue: notificationQueue,
      messageBody: sfn.TaskInput.fromObject({
        notificationId: sfn.JsonPath.format(
          "{}:customer",
          sfn.JsonPath.stringAt("$.submissionId"),
        ),
        submissionId: sfn.JsonPath.stringAt("$.submissionId"),
        requestId: sfn.JsonPath.stringAt("$.requestId"),
        type: "customer_confirmation",
        recipient: sfn.JsonPath.stringAt("$.inquiry.businessEmail"),
        name: sfn.JsonPath.stringAt("$.inquiry.name"),
        selectedService: sfn.JsonPath.stringAt("$.inquiry.selectedService"),
      }),
      resultPath: sfn.JsonPath.DISCARD,
    });

    const queueStaff = new tasks.SqsSendMessage(this, "QueueStaffNotification", {
      queue: notificationQueue,
      messageBody: sfn.TaskInput.fromObject({
        notificationId: sfn.JsonPath.format(
          "{}:staff",
          sfn.JsonPath.stringAt("$.submissionId"),
        ),
        submissionId: sfn.JsonPath.stringAt("$.submissionId"),
        requestId: sfn.JsonPath.stringAt("$.requestId"),
        type: "staff_notification",
        name: sfn.JsonPath.stringAt("$.inquiry.name"),
        company: sfn.JsonPath.stringAt("$.inquiry.company"),
        selectedService: sfn.JsonPath.stringAt("$.inquiry.selectedService"),
        companySize: sfn.JsonPath.stringAt("$.inquiry.companySize"),
        urgency: sfn.JsonPath.stringAt("$.inquiry.urgency"),
        preferredContactMethod: sfn.JsonPath.stringAt("$.inquiry.preferredContactMethod"),
        visitorEmail: sfn.JsonPath.stringAt("$.inquiry.businessEmail"),
        contactId: sfn.JsonPath.stringAt("$.crm.contactId"),
        dealId: sfn.JsonPath.stringAt("$.crm.dealId"),
      }),
      resultPath: sfn.JsonPath.DISCARD,
    });

    const queueNotifications = new sfn.Parallel(this, "QueueNotifications", {
      resultPath: sfn.JsonPath.DISCARD,
      comment: "Enqueue customer and staff jobs. Does not wait for Resend.",
    });
    queueNotifications.branch(queueCustomer);
    queueNotifications.branch(queueStaff);
    queueNotifications.addRetry({
      errors: ["SQS.AmazonSQSException", "SQS.SdkClientException", "States.TaskFailed"],
      interval: cdk.Duration.seconds(1),
      backoffRate: 2,
      maxAttempts: 2,
    });

    const markQueueFailed = new tasks.DynamoUpdateItem(this, "MarkQueueFailed", {
      table,
      key: {
        submissionId: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$.submissionId"),
        ),
      },
      updateExpression:
        "SET #status = :completed, crmStatus = :crmStatus, contactId = :contactId, dealId = :dealId, notificationStatus = :notificationStatus, updatedAt = :updatedAt, expiresAt = :expiresAt",
      expressionAttributeNames: { "#status": "status" },
      expressionAttributeValues: {
        ":completed": tasks.DynamoAttributeValue.fromString("COMPLETED"),
        ":crmStatus": tasks.DynamoAttributeValue.fromString("CRM_COMPLETED"),
        ":contactId": tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$.crm.contactId"),
        ),
        ":dealId": tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$.crm.dealId"),
        ),
        ":notificationStatus": tasks.DynamoAttributeValue.fromString("QUEUE_FAILED"),
        ":updatedAt": tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$$.State.EnteredTime"),
        ),
        ":expiresAt": tasks.DynamoAttributeValue.numberFromString(
          sfn.JsonPath.format("{}", sfn.JsonPath.numberAt("$.crm.expiresAt") as unknown as string),
        ),
      },
      conditionExpression: "attribute_exists(submissionId)",
      resultPath: sfn.JsonPath.DISCARD,
    });
    const partialSuccess = new sfn.Succeed(this, "PartialSuccess");
    markQueueFailed.next(partialSuccess);

    queueNotifications.addCatch(markQueueFailed, {
      errors: ["States.ALL"],
      resultPath: "$.queueError",
    });
    queueNotifications.next(markCompleted);

    const markFailed = new tasks.DynamoUpdateItem(this, "MarkFailed", {
      table,
      key: {
        submissionId: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$.submissionId"),
        ),
      },
      updateExpression: "SET #status = :failed, crmStatus = :crmStatus, updatedAt = :updatedAt",
      expressionAttributeNames: { "#status": "status" },
      expressionAttributeValues: {
        ":failed": tasks.DynamoAttributeValue.fromString("FAILED"),
        ":crmStatus": tasks.DynamoAttributeValue.fromString("FAILED"),
        ":updatedAt": tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$$.State.EnteredTime"),
        ),
      },
      conditionExpression: "attribute_exists(submissionId)",
      resultPath: sfn.JsonPath.DISCARD,
    });

    const workflowFailed = new sfn.Fail(this, "WorkflowFailed", {
      error: "InquiryWorkflowFailed",
      cause: "HubSpot CRM step failed after bounded retries or a permanent failure.",
    });
    markFailed.next(workflowFailed);

    hubspotCrmStep.addCatch(markFailed, {
      errors: ["States.ALL"],
      resultPath: "$.taskError",
    });

    acquireSubmission.next(hubspotCrmStep);
    hubspotCrmStep.next(queueNotifications);

    const stateMachine = new sfn.StateMachine(this, "InquiryWorkflow", {
      stateMachineName: resourceName("novatech", "inquiry-workflow"),
      stateMachineType: sfn.StateMachineType.STANDARD,
      definitionBody: sfn.DefinitionBody.fromChainable(acquireSubmission),
      timeout: cdk.Duration.minutes(5),
    });

    const vercelOidc = new iam.OpenIdConnectProvider(this, "VercelOidcProvider", {
      url: `https://oidc.vercel.com/${VERCEL_TEAM_SLUG}`,
      clientIds: [`https://vercel.com/${VERCEL_TEAM_SLUG}`],
    });

    const vercelIngress = new iam.Role(this, "VercelIngress", {
      roleName: resourceName("novatech", "vercel-ingress"),
      description:
        "Vercel Production and Preview may start the NovaTech inquiry state machine. No other AWS APIs.",
      assumedBy: new iam.OpenIdConnectPrincipal(vercelOidc, {
        StringEquals: {
          [`oidc.vercel.com/${VERCEL_TEAM_SLUG}:aud`]: `https://vercel.com/${VERCEL_TEAM_SLUG}`,
          [`oidc.vercel.com/${VERCEL_TEAM_SLUG}:sub`]: [
            `owner:${VERCEL_TEAM_SLUG}:project:${VERCEL_PROJECT_NAME}:environment:production`,
            `owner:${VERCEL_TEAM_SLUG}:project:${VERCEL_PROJECT_NAME}:environment:preview`,
          ],
        },
      }),
    });
    vercelIngress.addToPolicy(
      new iam.PolicyStatement({
        sid: "StartNovaTechInquiryWorkflow",
        actions: ["states:StartExecution"],
        resources: [stateMachine.stateMachineArn],
      }),
    );

    new cdk.CfnOutput(this, "InquiryWorkflowsTableName", {
      value: table.tableName,
      description: "NovaTech workflow / idempotency table",
    });
    new cdk.CfnOutput(this, "InquiryWorkflowStateMachineName", {
      value: resourceName("novatech", "inquiry-workflow"),
      description: "NovaTech inquiry Step Functions state machine",
    });
    new cdk.CfnOutput(this, "HubSpotCrmFunctionName", {
      value: hubspotCrm.functionName,
      description: "NovaTech HubSpot CRM Lambda",
    });
    new cdk.CfnOutput(this, "NotificationQueueName", {
      value: notificationQueue.queueName,
      description: "NovaTech notification SQS queue",
    });
    new cdk.CfnOutput(this, "NotificationDlqName", {
      value: notificationDlq.queueName,
      description: "NovaTech notification DLQ",
    });
    new cdk.CfnOutput(this, "NotificationHandlerFunctionName", {
      value: notificationHandler.functionName,
      description: "NovaTech notification Lambda",
    });
    new cdk.CfnOutput(this, "InquiryWorkflowStateMachineArn", {
      value: stateMachine.stateMachineArn,
      description: "NovaTech inquiry state machine ARN for Next.js StartExecution",
    });
    new cdk.CfnOutput(this, "VercelIngressRoleArn", {
      value: vercelIngress.roleArn,
      description: "IAM role ARN for Vercel OIDC (states:StartExecution only)",
    });
  }
}