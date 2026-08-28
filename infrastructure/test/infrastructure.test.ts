import * as cdk from "aws-cdk-lib/core";
import { Match, Template } from "aws-cdk-lib/assertions";
import {
  EventHorizonDevStack,
  TICKETMASTER_API_KEY_PARAMETER_NAME,
} from "../lib/event-horizon-dev-stack";
import { NovaTechDevStack } from "../lib/novatech-dev-stack";
import {
  HUBSPOT_ACCESS_TOKEN_PARAMETER_NAME,
  RESEND_API_KEY_PARAMETER_NAME,
  VERCEL_PROJECT_NAME,
  VERCEL_TEAM_SLUG,
} from "../lib/novatech-constants";
import { DEFAULT_REGION, infraConfig } from "../lib/config";
import { resourceName } from "../lib/naming";

jest.setTimeout(120_000);

const NOVATECH_FORBIDDEN_RESOURCE_TYPES = [
  "AWS::ECS::Cluster",
  "AWS::ECS::Service",
  "AWS::ECS::TaskDefinition",
  "AWS::ECR::Repository",
  "AWS::ApiGateway::RestApi",
  "AWS::ApiGatewayV2::Api",
  "AWS::EC2::VPC",
  "AWS::EC2::NatGateway",
  "AWS::ElasticLoadBalancingV2::LoadBalancer",
  "AWS::RDS::DBInstance",
  "AWS::RDS::DBCluster",
  "AWS::SecretsManager::Secret",
  "AWS::SSM::Parameter",
  "AWS::Events::Rule",
  "AWS::Scheduler::Schedule",
  "AWS::CloudWatch::Alarm",
] as const;

const EVENT_HORIZON_FORBIDDEN_RESOURCE_TYPES = [
  "AWS::StepFunctions::StateMachine",
  "AWS::ECS::Service",
  "AWS::ECR::Repository",
  "AWS::ApiGateway::RestApi",
  "AWS::ApiGatewayV2::Api",
  "AWS::EC2::NatGateway",
  "AWS::ElasticLoadBalancingV2::LoadBalancer",
  "AWS::RDS::DBInstance",
  "AWS::RDS::DBCluster",
  "AWS::SecretsManager::Secret",
  "AWS::SSM::Parameter",
  "AWS::CloudWatch::Alarm",
] as const;

function resourceTypes(template: Template): string[] {
  const resources = template.toJSON().Resources as
    | Record<string, { Type?: string }>
    | undefined;
  if (!resources) return [];
  return Object.values(resources)
    .map((resource) => resource.Type)
    .filter((type): type is string => Boolean(type));
}

function synthesizeDevStacks() {
  const app = new cdk.App();
  const env = { region: DEFAULT_REGION };
  const eventHorizon = new EventHorizonDevStack(app, "EventHorizonDevStack", {
    env,
  });
  const novatech = new NovaTechDevStack(app, "NovaTechDevStack", { env });
  return { eventHorizon, novatech };
}

describe("infrastructure foundation", () => {
  it("uses the intended naming and configuration values", () => {
    expect(infraConfig.environment).toBe("dev");
    expect(infraConfig.prefix).toBe("portfolio");
    expect(infraConfig.region).toBe(DEFAULT_REGION);
    expect(resourceName("event-horizon", "ingestion-queue")).toBe(
      "portfolio-dev-event-horizon-ingestion-queue",
    );
    expect(resourceName("event-horizon", "ingestion-dlq")).toBe(
      "portfolio-dev-event-horizon-ingestion-dlq",
    );
    expect(resourceName("event-horizon", "external-events")).toBe(
      "portfolio-dev-event-horizon-external-events",
    );
    expect(resourceName("event-horizon", "external-events-reader")).toBe(
      "portfolio-dev-event-horizon-external-events-reader",
    );
    expect(resourceName("event-horizon", "ingestion-refresh")).toBe(
      "portfolio-dev-event-horizon-ingestion-refresh",
    );
    expect(resourceName("novatech", "inquiry-workflow")).toBe(
      "portfolio-dev-novatech-inquiry-workflow",
    );
    expect(resourceName("novatech", "inquiry-workflows")).toBe(
      "portfolio-dev-novatech-inquiry-workflows",
    );
    expect(resourceName("novatech", "hubspot-crm")).toBe(
      "portfolio-dev-novatech-hubspot-crm",
    );
    expect(resourceName("novatech", "notifications")).toBe(
      "portfolio-dev-novatech-notifications",
    );
    expect(resourceName("novatech", "notifications-dlq")).toBe(
      "portfolio-dev-novatech-notifications-dlq",
    );
    expect(resourceName("novatech", "notification-handler")).toBe(
      "portfolio-dev-novatech-notification-handler",
    );
  });

  it("synthesizes EventHorizonDevStack and NovaTechDevStack", () => {
    const { eventHorizon, novatech } = synthesizeDevStacks();
    expect(eventHorizon.stackName).toBe("EventHorizonDevStack");
    expect(novatech.stackName).toBe("NovaTechDevStack");
    expect(eventHorizon.region).toBe("us-east-2");
    expect(novatech.region).toBe("us-east-2");

    const eventHorizonTemplate = Template.fromStack(eventHorizon);
    const novatechTemplate = Template.fromStack(novatech);
    expect(eventHorizonTemplate.toJSON()).toBeDefined();
    expect(novatechTemplate.toJSON()).toBeDefined();
  });

  it("applies standard tags without PII or account identifiers", () => {
    const { eventHorizon, novatech } = synthesizeDevStacks();
    expect(eventHorizon.tags.tagValues()).toMatchObject({
      Environment: "dev",
      ManagedBy: "aws-cdk",
      Purpose: "portfolio-learning",
      Application: "event-horizon",
    });
    expect(novatech.tags.tagValues()).toMatchObject({
      Environment: "dev",
      ManagedBy: "aws-cdk",
      Purpose: "portfolio-learning",
      Application: "novatech",
    });

    const tagBlob = JSON.stringify([
      eventHorizon.tags.tagValues(),
      novatech.tags.tagValues(),
    ]);
    expect(tagBlob).not.toMatch(/@/);
    expect(tagBlob).not.toMatch(/\b\d{12}\b/);
  });
});

describe("EventHorizonDevStack Phase 1 ingestion", () => {
  const template = Template.fromStack(synthesizeDevStacks().eventHorizon);

  it("creates an on-demand DynamoDB table with provider + externalId and TTL", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      TableName: "portfolio-dev-event-horizon-external-events",
      BillingMode: "PAY_PER_REQUEST",
      KeySchema: [
        { AttributeName: "provider", KeyType: "HASH" },
        { AttributeName: "externalId", KeyType: "RANGE" },
      ],
      AttributeDefinitions: Match.arrayWith([
        { AttributeName: "provider", AttributeType: "S" },
        { AttributeName: "externalId", AttributeType: "S" },
      ]),
      TimeToLiveSpecification: {
        AttributeName: "expiresAt",
        Enabled: true,
      },
    });
    template.hasResource("AWS::DynamoDB::Table", {
      DeletionPolicy: "Delete",
      UpdateReplacePolicy: "Delete",
    });
  });

  it("creates the ingestion queue, DLQ, and redrive policy", () => {
    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "portfolio-dev-event-horizon-ingestion-queue",
      MessageRetentionPeriod: 4 * 24 * 60 * 60,
      VisibilityTimeout: 60,
      RedrivePolicy: {
        maxReceiveCount: 3,
      },
    });
    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "portfolio-dev-event-horizon-ingestion-dlq",
      MessageRetentionPeriod: 14 * 24 * 60 * 60,
    });
    expect(template.resourceCountIs("AWS::SQS::Queue", 2));
  });

  it("creates a Node.js 22 Lambda that reads the table name from the environment", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "portfolio-dev-event-horizon-ingestion-handler",
      Runtime: "nodejs22.x",
      MemorySize: 256,
      Timeout: 20,
      Environment: {
        Variables: {
          EXTERNAL_EVENTS_TABLE_NAME: "portfolio-dev-event-horizon-external-events",
        },
      },
    });
  });

  it("maps SQS to Lambda with partial batch failure reporting", () => {
    template.hasResourceProperties("AWS::Lambda::EventSourceMapping", {
      BatchSize: 10,
      FunctionResponseTypes: ["ReportBatchItemFailures"],
    });
  });

  it("grants the ingestion Lambda DynamoDB UpdateItem only", () => {
    const policies = Object.fromEntries(
      Object.entries(template.findResources("AWS::IAM::Policy")).filter(([id]) =>
        id.includes("IngestionHandler"),
      ),
    );
    const blob = JSON.stringify(policies);
    expect(blob).toContain("dynamodb:UpdateItem");
    expect(blob).not.toContain("dynamodb:Query");
    expect(blob).not.toContain("dynamodb:PutItem");
    expect(blob).not.toContain("dynamodb:Scan");
    expect(blob).not.toContain("dynamodb:*");
    expect(blob).not.toContain("Action\":\"*\"");
  });

  it("creates a read-only external-events reader Lambda with a public Function URL", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "portfolio-dev-event-horizon-external-events-reader",
      Runtime: "nodejs22.x",
      MemorySize: 256,
      Timeout: 10,
      Environment: {
        Variables: {
          EXTERNAL_EVENTS_TABLE_NAME: "portfolio-dev-event-horizon-external-events",
        },
      },
    });
    template.hasResourceProperties("AWS::Lambda::Url", {
      AuthType: "NONE",
      Cors: {
        AllowMethods: ["GET"],
        AllowOrigins: Match.arrayWith([
          "http://localhost:3000",
          "https://www.christopherkilo.com",
        ]),
      },
    });
    template.resourceCountIs("AWS::Lambda::Url", 1);
  });

  it("grants the reader Lambda DynamoDB Query only", () => {
    const policies = Object.fromEntries(
      Object.entries(template.findResources("AWS::IAM::Policy")).filter(([id]) =>
        id.includes("ExternalEventsReader"),
      ),
    );
    const blob = JSON.stringify(policies);
    expect(blob).toContain("dynamodb:Query");
    expect(blob).not.toContain("dynamodb:UpdateItem");
    expect(blob).not.toContain("dynamodb:PutItem");
    expect(blob).not.toContain("dynamodb:DeleteItem");
    expect(blob).not.toContain("dynamodb:Scan");
    expect(blob).not.toContain("dynamodb:*");
    expect(blob).not.toContain("sqs:");
    expect(blob).not.toContain("ssm:");
    expect(blob).not.toContain("ecs:");
  });

  it("does not add out-of-scope expensive Event Horizon resources", () => {
    const types = resourceTypes(template);
    for (const type of EVENT_HORIZON_FORBIDDEN_RESOURCE_TYPES) {
      expect(types).not.toContain(type);
    }
  });

  it("does not create a dedicated application ECR repository", () => {
    expect(resourceTypes(template)).not.toContain("AWS::ECR::Repository");
  });

  it("creates an ECS cluster and Fargate task definition without an ECS service", () => {
    template.hasResourceProperties("AWS::ECS::Cluster", {
      ClusterName: "portfolio-dev-event-horizon-cluster",
    });
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      Family: "portfolio-dev-event-horizon-ingestion-worker-task",
      Cpu: "256",
      Memory: "512",
      RequiresCompatibilities: ["FARGATE"],
      NetworkMode: "awsvpc",
      RuntimePlatform: {
        CpuArchitecture: "ARM64",
        OperatingSystemFamily: "LINUX",
      },
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "ingestion-worker",
          Environment: Match.arrayWith([
            Match.objectLike({ Name: "INGESTION_QUEUE_URL" }),
            { Name: "EVENT_PROVIDER", Value: "ticketmaster" },
            { Name: "EVENT_CITY", Value: "Dallas" },
            { Name: "EVENT_STATE_CODE", Value: "TX" },
            { Name: "EVENT_COUNTRY_CODE", Value: "US" },
            { Name: "EVENT_PAGE_SIZE", Value: "20" },
          ]),
          Secrets: Match.arrayWith([
            Match.objectLike({
              Name: "TICKETMASTER_API_KEY",
            }),
          ]),
        }),
      ]),
    });
    template.resourceCountIs("AWS::ECS::TaskDefinition", 1);
    expect(resourceTypes(template)).not.toContain("AWS::ECS::Service");
    expect(resourceTypes(template)).not.toContain("AWS::SSM::Parameter");
  });

  it("injects the existing Ticketmaster SSM SecureString and scopes retrieval to that parameter", () => {
    const taskDef = JSON.stringify(template.findResources("AWS::ECS::TaskDefinition"));
    expect(taskDef).toContain("TICKETMASTER_API_KEY");
    expect(taskDef).toContain(TICKETMASTER_API_KEY_PARAMETER_NAME);
    expect(taskDef).not.toMatch(/"Name":"TICKETMASTER_API_KEY","Value":/);

    const policies = template.findResources("AWS::IAM::Policy");
    const executionPolicies = Object.fromEntries(
      Object.entries(policies).filter(
        ([id, policy]) =>
          id.includes("ExecutionRole") || JSON.stringify(policy).includes("GetParameters"),
      ),
    );
    const executionBlob = JSON.stringify(executionPolicies);
    expect(executionBlob).toContain("ssm:GetParameters");
    expect(executionBlob).toContain(TICKETMASTER_API_KEY_PARAMETER_NAME);
    expect(executionBlob).not.toContain("ssm:GetParameter\"");
    expect(executionBlob).not.toContain("ssm:DescribeParameters");
    expect(executionBlob).not.toContain("ssm:GetParameterHistory");
    expect(executionBlob).not.toContain("ssm:*");
    expect(executionBlob).not.toContain("kms:*");
    expect(executionBlob).not.toContain("dynamodb");

    const outputs = JSON.stringify(template.toJSON().Outputs ?? {});
    expect(outputs).not.toContain("TICKETMASTER_API_KEY");
  });

  it("gives the worker task role SendMessage only and no DynamoDB or SSM access", () => {
    const policies = Object.fromEntries(
      Object.entries(template.findResources("AWS::IAM::Policy")).filter(
        ([id, policy]) =>
          id.includes("IngestionWorkerTask") &&
          !id.includes("ExecutionRole") &&
          JSON.stringify(policy).includes("sqs:SendMessage"),
      ),
    );
    const blob = JSON.stringify(policies);
    expect(blob).toContain("sqs:SendMessage");
    expect(blob).not.toContain("sqs:*");
    expect(blob).not.toContain("dynamodb");
    expect(blob).not.toContain("lambda:");
    expect(blob).not.toContain("ssm:");
    expect(blob).not.toContain("kms:");
  });

  it("uses a public-only VPC with no NAT Gateway", () => {
    template.resourceCountIs("AWS::EC2::VPC", 1);
    expect(resourceTypes(template)).not.toContain("AWS::EC2::NatGateway");
    const subnets = template.findResources("AWS::EC2::Subnet");
    expect(Object.keys(subnets).length).toBeGreaterThan(0);
    for (const subnet of Object.values(subnets)) {
      expect(subnet.Properties?.MapPublicIpOnLaunch).toBe(true);
    }
  });
});

describe("EventHorizonDevStack Phase 5 scheduler", () => {
  const template = Template.fromStack(synthesizeDevStacks().eventHorizon);

  it("schedules the existing Fargate worker twice daily in America/Chicago", () => {
    template.hasResourceProperties("AWS::Scheduler::Schedule", {
      Name: "portfolio-dev-event-horizon-ingestion-refresh",
      State: "ENABLED",
      ScheduleExpression: "cron(0 8,20 * * ? *)",
      ScheduleExpressionTimezone: "America/Chicago",
      FlexibleTimeWindow: { Mode: "OFF" },
    });
    template.resourceCountIs("AWS::Scheduler::Schedule", 1);
  });

  it("targets the existing ECS cluster and worker task with public IP networking", () => {
    const schedules = template.findResources("AWS::Scheduler::Schedule");
    const schedule = Object.values(schedules)[0];
    const target = schedule?.Properties?.Target as {
      Arn?: unknown;
      EcsParameters?: {
        TaskDefinitionArn?: unknown;
        LaunchType?: string;
        NetworkConfiguration?: {
          AwsvpcConfiguration?: {
            AssignPublicIp?: string;
            Subnets?: unknown;
            SecurityGroups?: unknown;
          };
        };
      };
      RetryPolicy?: {
        MaximumRetryAttempts?: number;
        MaximumEventAgeInSeconds?: number;
      };
    };
    expect(target?.EcsParameters?.LaunchType).toBe("FARGATE");
    expect(target?.EcsParameters?.NetworkConfiguration?.AwsvpcConfiguration?.AssignPublicIp).toBe(
      "ENABLED",
    );
    expect(JSON.stringify(target?.Arn)).toContain("EventHorizonCluster");
    expect(JSON.stringify(target?.EcsParameters?.TaskDefinitionArn)).toContain(
      "IngestionWorkerTask",
    );
    expect(JSON.stringify(target?.EcsParameters?.NetworkConfiguration)).toContain("Subnet");
    expect(JSON.stringify(target?.EcsParameters?.NetworkConfiguration)).toContain(
      "IngestionWorkerSecurityGroup",
    );
    expect(target?.RetryPolicy?.MaximumRetryAttempts).toBe(2);
    expect(target?.RetryPolicy?.MaximumEventAgeInSeconds).toBe(3600);
  });

  it("grants the scheduler ecs:RunTask and narrowly scoped iam:PassRole only", () => {
    const policies = Object.fromEntries(
      Object.entries(template.findResources("AWS::IAM::Policy")).filter(([id, policy]) => {
        const blob = JSON.stringify(policy);
        return (
          id.includes("IngestionRefresh") ||
          blob.includes("ecs:RunTask")
        );
      }),
    );
    const blob = JSON.stringify(policies);
    expect(blob).toContain("ecs:RunTask");
    expect(blob).toContain("iam:PassRole");
    expect(blob).not.toContain("ecs:*");
    expect(blob).not.toContain("iam:*");
    expect(blob).not.toContain("AdministratorAccess");
    expect(blob).not.toContain("dynamodb");
    expect(blob).not.toContain("sqs:");
    expect(blob).not.toContain("lambda:");
    expect(blob).not.toContain("ssm:");
    expect(blob).not.toContain("Action\":\"*\"");

    const statements = Object.values(policies).flatMap((policy) => {
      const doc = (policy as { Properties?: { PolicyDocument?: { Statement?: unknown[] } } })
        .Properties?.PolicyDocument?.Statement;
      return Array.isArray(doc) ? doc : [];
    }) as Array<{ Action?: string | string[]; Resource?: unknown }>;
    const passRole = statements.find((statement) => {
      const action = statement.Action;
      return action === "iam:PassRole" || (Array.isArray(action) && action.includes("iam:PassRole"));
    });
    expect(passRole).toBeDefined();
    const resources = JSON.stringify(passRole?.Resource ?? []);
    expect(resources).toContain("IngestionWorkerTask");
    expect(resources.toLowerCase()).toMatch(/taskrole|executionrole/i);
  });

  it("does not create an ECS Service, NAT Gateway, scheduler DLQ, or extra Lambda", () => {
    const types = resourceTypes(template);
    expect(types).not.toContain("AWS::ECS::Service");
    expect(types).not.toContain("AWS::EC2::NatGateway");
    expect(types).not.toContain("AWS::StepFunctions::StateMachine");
    template.resourceCountIs("AWS::SQS::Queue", 2);
    template.resourceCountIs("AWS::Lambda::Function", 2);
    template.resourceCountIs("AWS::DynamoDB::Table", 1);
    template.resourceCountIs("AWS::ECS::Cluster", 1);
    template.resourceCountIs("AWS::ECS::TaskDefinition", 1);
  });
});

describe("NovaTechDevStack Phase 2 HubSpot CRM", () => {
  const template = Template.fromStack(synthesizeDevStacks().novatech);

  function stateMachineDefinition(): string {
    const machines = template.findResources("AWS::StepFunctions::StateMachine");
    const machine = Object.values(machines)[0] as {
      Properties?: { DefinitionString?: unknown };
    };
    const definition = machine?.Properties?.DefinitionString;
    return typeof definition === "string" ? definition : JSON.stringify(definition ?? {});
  }

  it("creates an on-demand workflow table keyed by submissionId with TTL", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      TableName: "portfolio-dev-novatech-inquiry-workflows",
      BillingMode: "PAY_PER_REQUEST",
      KeySchema: [{ AttributeName: "submissionId", KeyType: "HASH" }],
      AttributeDefinitions: [{ AttributeName: "submissionId", AttributeType: "S" }],
      TimeToLiveSpecification: {
        AttributeName: "expiresAt",
        Enabled: true,
      },
      SSESpecification: { SSEEnabled: true },
    });
    template.hasResource("AWS::DynamoDB::Table", {
      DeletionPolicy: "Delete",
      UpdateReplacePolicy: "Delete",
    });
    template.resourceCountIs("AWS::DynamoDB::Table", 1);

    const tables = template.findResources("AWS::DynamoDB::Table");
    const table = Object.values(tables)[0] as {
      Properties?: { GlobalSecondaryIndexes?: unknown; LocalSecondaryIndexes?: unknown };
    };
    expect(table.Properties?.GlobalSecondaryIndexes).toBeUndefined();
    expect(table.Properties?.LocalSecondaryIndexes).toBeUndefined();
  });

  it("creates a Standard inquiry workflow with HubSpot CRM, duplicate, and bounded retry paths", () => {
    template.hasResourceProperties("AWS::StepFunctions::StateMachine", {
      StateMachineName: "portfolio-dev-novatech-inquiry-workflow",
      StateMachineType: "STANDARD",
    });
    template.resourceCountIs("AWS::StepFunctions::StateMachine", 1);

    const definition = stateMachineDefinition();
    expect(definition).toContain("AcquireSubmission");
    expect(definition).toContain("attribute_not_exists(submissionId)");
    expect(definition).toContain("InquiryWorkflows");
    expect(definition).toContain("DuplicateResult");
    expect(definition).toContain("DynamoDB.ConditionalCheckFailedException");
    expect(definition).toContain("HubSpotCRM");
    expect(definition).toContain("QueueNotifications");
    expect(definition).toContain("QueueCustomerNotification");
    expect(definition).toContain("QueueStaffNotification");
    expect(definition).toContain("MarkCompleted");
    expect(definition).toContain("COMPLETED");
    expect(definition).toContain("CRM_COMPLETED");
    expect(definition).toContain("QUEUED");
    expect(definition).toContain("QUEUE_FAILED");
    expect(definition).toContain("PartialSuccess");
    expect(definition).toContain("MarkFailed");
    expect(definition).toContain("FAILED");
    expect(definition).toContain("TransientFailure");
    expect(definition).toMatch(/MaxAttempts\\":2/);
    expect(definition).toContain("states:::dynamodb:putItem");
    expect(definition).toContain("states:::dynamodb:updateItem");
    expect(definition).toContain("states:::sqs:sendMessage");
    expect(definition).not.toContain("MockBusinessStep");
    expect(definition).not.toMatch(/turnstile/i);
    expect(definition).not.toContain("api.resend.com");
  });

  it("creates the HubSpot CRM Lambda and does not keep the Phase 1 mock task", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "portfolio-dev-novatech-hubspot-crm",
      Runtime: "nodejs22.x",
      MemorySize: 256,
      Timeout: 20,
      Environment: {
        Variables: {
          HUBSPOT_ACCESS_TOKEN_PARAMETER_NAME,
          HUBSPOT_PIPELINE_ID: "default",
          HUBSPOT_DEAL_STAGE_ID: "appointmentscheduled",
        },
      },
    });
    template.resourceCountIs("AWS::Lambda::Function", 3);
    const blob = JSON.stringify(template.toJSON());
    expect(blob).not.toContain("portfolio-dev-novatech-workflow-demo-step");
  });

  it("imports the HubSpot SSM parameter instead of creating one", () => {
    expect(resourceTypes(template)).not.toContain("AWS::SSM::Parameter");
    const policies = JSON.stringify(template.findResources("AWS::IAM::Policy"));
    expect(policies).toContain(HUBSPOT_ACCESS_TOKEN_PARAMETER_NAME.replace(/^\//, ""));
    expect(policies).toContain("ssm:GetParameter");
    expect(policies).not.toContain("ssm:GetParameters");
    expect(policies).not.toContain("ssm:DescribeParameters");
    expect(policies).not.toContain("ssm:GetParameterHistory");
    expect(policies).not.toContain("ssm:*");
  });

  it("scopes HubSpot Lambda IAM to that SSM parameter and not DynamoDB", () => {
    const lambdaPolicies = Object.fromEntries(
      Object.entries(template.findResources("AWS::IAM::Policy")).filter(([id]) =>
        id.includes("HubSpotCrm"),
      ),
    );
    const lambdaBlob = JSON.stringify(lambdaPolicies);
    expect(lambdaBlob).toContain("ssm:GetParameter");
    expect(lambdaBlob).toContain("hubspot-access-token");
    expect(lambdaBlob).not.toContain("dynamodb");
    expect(lambdaBlob).not.toContain("sqs:");
    expect(lambdaBlob).not.toContain("ecs:");
    expect(lambdaBlob).not.toContain("event-horizon");
  });

  it("scopes the state machine to the workflow table, HubSpot invoke, and notification queue send", () => {
    const sfnPolicies = Object.fromEntries(
      Object.entries(template.findResources("AWS::IAM::Policy")).filter(([id]) =>
        id.includes("InquiryWorkflow"),
      ),
    );
    const blob = JSON.stringify(sfnPolicies);
    expect(blob).toContain("dynamodb:PutItem");
    expect(blob).toContain("dynamodb:UpdateItem");
    expect(blob).toContain("lambda:InvokeFunction");
    expect(blob).toContain("sqs:SendMessage");
    expect(blob).toContain("NotificationQueue");
    expect(blob).not.toContain("sqs:*");
    expect(blob).not.toContain("event-horizon");
    expect(blob).not.toContain("dynamodb:*");
    expect(blob).not.toContain("lambda:*");
    expect(blob).not.toContain("states:*");
    expect(blob).not.toContain("ecs:");
    expect(blob).not.toContain("ssm:");
    expect(blob).not.toContain("AdministratorAccess");
    expect(blob).not.toMatch(/Action":"\*"/);

    const statements = Object.values(sfnPolicies).flatMap((policy) => {
      const doc = (policy as { Properties?: { PolicyDocument?: { Statement?: unknown[] } } })
        .Properties?.PolicyDocument?.Statement;
      return Array.isArray(doc) ? doc : [];
    }) as Array<{ Action?: string | string[] }>;
    const dynamoActions = statements.flatMap((statement) => {
      const action = statement.Action;
      const actions = Array.isArray(action) ? action : action ? [action] : [];
      return actions.filter((item) => item.startsWith("dynamodb:"));
    });
    expect(new Set(dynamoActions)).toEqual(new Set(["dynamodb:PutItem", "dynamodb:UpdateItem"]));
    const sqsActions = statements.flatMap((statement) => {
      const action = statement.Action;
      const actions = Array.isArray(action) ? action : action ? [action] : [];
      return actions.filter((item) => item.startsWith("sqs:"));
    });
    expect(sqsActions.every((action) => action === "sqs:SendMessage")).toBe(true);
  });

  it("does not add ECS, EventBridge, API Gateway, RDS, or VPC resources", () => {
    const types = resourceTypes(template);
    for (const type of NOVATECH_FORBIDDEN_RESOURCE_TYPES) {
      expect(types).not.toContain(type);
    }
    expect(types).not.toContain("AWS::StepFunctions::Activity");
    expect(types).not.toContain("AWS::SNS::Topic");
  });
});

describe("NovaTechDevStack Phase 3 notifications", () => {
  const template = Template.fromStack(synthesizeDevStacks().novatech);

  it("creates an encrypted notification queue and DLQ with redrive", () => {
    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "portfolio-dev-novatech-notifications",
      MessageRetentionPeriod: 4 * 24 * 60 * 60,
      VisibilityTimeout: 45,
      RedrivePolicy: { maxReceiveCount: 3 },
      SqsManagedSseEnabled: true,
    });
    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "portfolio-dev-novatech-notifications-dlq",
      MessageRetentionPeriod: 14 * 24 * 60 * 60,
      SqsManagedSseEnabled: true,
    });
    template.resourceCountIs("AWS::SQS::Queue", 2);
  });

  it("creates the notification Lambda with Resend config and no HubSpot token env", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "portfolio-dev-novatech-notification-handler",
      Runtime: "nodejs22.x",
      MemorySize: 256,
      Timeout: 15,
      Environment: {
        Variables: {
          RESEND_API_KEY_PARAMETER_NAME,
          INQUIRY_WORKFLOWS_TABLE_NAME: "portfolio-dev-novatech-inquiry-workflows",
          NOVATECH_FROM_EMAIL: "onboarding@resend.dev",
          NOVATECH_STAFF_EMAIL: "onboarding@resend.dev",
          NOVATECH_APP_URL: "https://www.christopherkilo.com",
        },
      },
    });
    const notification = JSON.stringify(
      Object.fromEntries(
        Object.entries(template.findResources("AWS::Lambda::Function")).filter(([, resource]) =>
          JSON.stringify(resource).includes("portfolio-dev-novatech-notification-handler"),
        ),
      ),
    );
    expect(notification).not.toContain("HUBSPOT");
    expect(notification).not.toContain("re_");
  });

  it("maps SQS to the notification Lambda with partial batch failure reporting", () => {
    template.hasResourceProperties("AWS::Lambda::EventSourceMapping", {
      BatchSize: 5,
      FunctionResponseTypes: ["ReportBatchItemFailures"],
    });
  });

  it("scopes notification Lambda IAM to Resend SSM GetParameter and DynamoDB UpdateItem", () => {
    const policies = Object.fromEntries(
      Object.entries(template.findResources("AWS::IAM::Policy")).filter(([id]) =>
        id.includes("NotificationHandler"),
      ),
    );
    const blob = JSON.stringify(policies);
    expect(blob).toContain("ssm:GetParameter");
    expect(blob).toContain("resend-api-key");
    expect(blob).not.toContain("hubspot-access-token");
    expect(blob).toContain("dynamodb:UpdateItem");
    expect(blob).not.toContain("dynamodb:PutItem");
    expect(blob).not.toContain("dynamodb:Query");
    expect(blob).not.toContain("dynamodb:Scan");
    expect(blob).not.toContain("dynamodb:*");
    expect(blob).not.toContain("ssm:*");
    expect(blob).not.toContain("lambda:InvokeFunction");
    expect(blob).not.toContain("states:StartExecution");
    expect(blob).not.toContain("event-horizon");
    expect(blob).not.toContain("ecs:");
  });
});

describe("NovaTechDevStack Phase 4 Vercel ingress identity", () => {
  const template = Template.fromStack(synthesizeDevStacks().novatech);

  it("creates a Vercel OIDC provider and StartExecution-only ingress role", () => {
    template.hasResourceProperties("Custom::AWSCDKOpenIdConnectProvider", {
      Url: `https://oidc.vercel.com/${VERCEL_TEAM_SLUG}`,
      ClientIDList: [`https://vercel.com/${VERCEL_TEAM_SLUG}`],
    });
    template.hasResourceProperties("AWS::IAM::Role", {
      RoleName: "portfolio-dev-novatech-vercel-ingress",
    });
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "portfolio-dev-novatech-hubspot-crm",
    });
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "portfolio-dev-novatech-notification-handler",
    });
    template.resourceCountIs("AWS::Lambda::Function", 3);
  });

  it("trusts only Vercel Production and Preview for the portfolio project", () => {
    const roles = template.findResources("AWS::IAM::Role");
    const ingress = Object.values(roles).find((resource) =>
      JSON.stringify(resource).includes("portfolio-dev-novatech-vercel-ingress"),
    ) as { Properties?: { AssumeRolePolicyDocument?: unknown } } | undefined;
    const trust = JSON.stringify(ingress?.Properties?.AssumeRolePolicyDocument ?? {});
    expect(trust).toContain("sts:AssumeRoleWithWebIdentity");
    expect(trust).toContain(
      `owner:${VERCEL_TEAM_SLUG}:project:${VERCEL_PROJECT_NAME}:environment:production`,
    );
    expect(trust).toContain(
      `owner:${VERCEL_TEAM_SLUG}:project:${VERCEL_PROJECT_NAME}:environment:preview`,
    );
    expect(trust).not.toContain("environment:development");
    expect(trust).not.toContain("event-horizon");
  });

  it("grants the ingress role only states:StartExecution on the inquiry state machine", () => {
    const policies = Object.fromEntries(
      Object.entries(template.findResources("AWS::IAM::Policy")).filter(([id]) =>
        id.includes("VercelIngress"),
      ),
    );
    const blob = JSON.stringify(policies);
    expect(blob).toContain("states:StartExecution");
    expect(blob).not.toContain("states:*");
    expect(blob).not.toContain("states:DescribeExecution");
    expect(blob).not.toContain("dynamodb:");
    expect(blob).not.toContain("sqs:");
    expect(blob).not.toContain("lambda:");
    expect(blob).not.toContain("ssm:");
    expect(blob).not.toContain("event-horizon");
    expect(blob).not.toContain("AdministratorAccess");

    const statements = Object.values(policies).flatMap((policy) => {
      const doc = (policy as { Properties?: { PolicyDocument?: { Statement?: unknown[] } } })
        .Properties?.PolicyDocument?.Statement;
      return Array.isArray(doc) ? doc : [];
    }) as Array<{ Action?: string | string[] }>;
    const actions = statements.flatMap((statement) => {
      const action = statement.Action;
      return Array.isArray(action) ? action : action ? [action] : [];
    });
    expect(actions).toEqual(["states:StartExecution"]);
  });
});
