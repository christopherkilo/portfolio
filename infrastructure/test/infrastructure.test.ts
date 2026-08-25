import * as cdk from "aws-cdk-lib/core";
import { Template } from "aws-cdk-lib/assertions";
import { EventHorizonDevStack } from "../lib/event-horizon-dev-stack";
import { NovaTechDevStack } from "../lib/novatech-dev-stack";
import { DEFAULT_REGION, infraConfig } from "../lib/config";
import { resourceName } from "../lib/naming";

const FORBIDDEN_RESOURCE_TYPES = [
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

  it("does not introduce workload AWS resources in this phase", () => {
    const { eventHorizon, novatech } = synthesizeDevStacks();
    const types = [
      ...resourceTypes(Template.fromStack(eventHorizon)),
      ...resourceTypes(Template.fromStack(novatech)),
    ];

    for (const type of FORBIDDEN_RESOURCE_TYPES) {
      expect(types).not.toContain(type);
    }
  });
});
