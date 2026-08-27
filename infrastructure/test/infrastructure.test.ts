import * as cdk from "aws-cdk-lib/core";
import { Match, Template } from "aws-cdk-lib/assertions";
import {
  EventHorizonDevStack,
  TICKETMASTER_API_KEY_PARAMETER_NAME,
} from "../lib/event-horizon-dev-stack";
import { NovaTechDevStack } from "../lib/novatech-dev-stack";
import { DEFAULT_REGION, infraConfig } from "../lib/config";
import { resourceName } from "../lib/naming";

jest.setTimeout(120_000);

const NOVATECH_FORBIDDEN_RESOURCE_TYPES = [
  "AWS::Lambda::Function",
  "AWS::DynamoDB::Table",
  "AWS::SQS::Queue",
  "AWS::StepFunctions::StateMachine",
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

describe("NovaTechDevStack", () => {
  it("still has no workload AWS resources", () => {
    const template = Template.fromStack(synthesizeDevStacks().novatech);
    const types = resourceTypes(template);
    for (const type of NOVATECH_FORBIDDEN_RESOURCE_TYPES) {
      expect(types).not.toContain(type);
    }
  });
});
