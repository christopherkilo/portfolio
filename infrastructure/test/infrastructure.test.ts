import * as cdk from "aws-cdk-lib/core";
import { Match, Template } from "aws-cdk-lib/assertions";
import { EventHorizonDevStack } from "../lib/event-horizon-dev-stack";
import { NovaTechDevStack } from "../lib/novatech-dev-stack";
import { DEFAULT_REGION, infraConfig } from "../lib/config";
import { resourceName } from "../lib/naming";

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

  it("grants the Lambda DynamoDB PutItem and not a wildcard table policy", () => {
    const policies = template.findResources("AWS::IAM::Policy");
    const blob = JSON.stringify(policies);
    expect(blob).toContain("dynamodb:PutItem");
    expect(blob).not.toContain("dynamodb:*");
    expect(blob).not.toContain("Action\":\"*\"");
  });

  it("does not add out-of-scope expensive Event Horizon resources", () => {
    const types = resourceTypes(template);
    for (const type of EVENT_HORIZON_FORBIDDEN_RESOURCE_TYPES) {
      expect(types).not.toContain(type);
    }
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
