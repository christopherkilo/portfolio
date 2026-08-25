import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { getCdkEnv } from "./config";
import { applyStandardTags, stackTags } from "./tags";

/**
 * Development foundation for NovaTech AWS workloads.
 * No Lambda, Step Functions, DynamoDB, SQS, or other workload resources in this phase.
 */
export class NovaTechDevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      description: "NovaTech development foundation (no workload resources yet).",
      ...props,
      env: props?.env ?? getCdkEnv(),
      tags: {
        ...stackTags("novatech"),
        ...props?.tags,
      },
    });

    applyStandardTags(this, "novatech");
    cdk.Validations.of(this).acknowledge({
      id: "CloudFormation-Validate::F0001",
      reason: "Foundation phase intentionally defines no CloudFormation resources.",
    });
  }
}
