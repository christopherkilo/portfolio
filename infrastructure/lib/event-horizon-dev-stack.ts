import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { getCdkEnv } from "./config";
import { applyStandardTags, stackTags } from "./tags";

/**
 * Development foundation for Event Horizon AWS workloads.
 * No Lambda, DynamoDB, SQS, ECS, or other workload resources in this phase.
 */
export class EventHorizonDevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      description: "Event Horizon development foundation (no workload resources yet).",
      ...props,
      env: props?.env ?? getCdkEnv(),
      tags: {
        ...stackTags("event-horizon"),
        ...props?.tags,
      },
    });

    applyStandardTags(this, "event-horizon");
    cdk.Validations.of(this).acknowledge({
      id: "CloudFormation-Validate::F0001",
      reason: "Foundation phase intentionally defines no CloudFormation resources.",
    });
  }
}
