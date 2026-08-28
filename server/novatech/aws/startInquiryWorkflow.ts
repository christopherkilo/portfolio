import "server-only";

import {
  ExecutionAlreadyExists,
  SFNClient,
  StartExecutionCommand,
} from "@aws-sdk/client-sfn";
import type { InquirySchemaInput } from "@/lib/demos/novatech/inquiry/schema";
import {
  EnvMissingError,
  getNovaTechWorkflowConfig,
  type NovaTechWorkflowConfig,
} from "@/server/novatech/env";
import {
  ConfigurationError,
  WorkflowUnavailableError,
} from "@/server/novatech/errors";

export type NovaTechWorkflowInput = {
  submissionId: string;
  requestId: string;
  inquiry: InquirySchemaInput;
};

export type WorkflowStartResult = {
  outcome: "started" | "already_exists";
};

export type SfnStartClient = {
  send(command: StartExecutionCommand): Promise<unknown>;
};

let clientOverride: SfnStartClient | undefined;

export function __setSfnClientForTests(client: SfnStartClient | undefined) {
  clientOverride = client;
}

export function novatechInquiryExecutionName(submissionId: string): string {
  return `nt-${submissionId}`;
}

/**
 * Start the NovaTech inquiry Standard Workflow.
 *
 * Deterministic execution names make browser retries collide on
 * ExecutionAlreadyExists. DynamoDB remains the canonical business
 * idempotency authority inside the workflow.
 *
 * Never accepts or forwards a Turnstile token.
 */
export async function startNovaTechInquiryWorkflow(
  input: NovaTechWorkflowInput,
): Promise<WorkflowStartResult> {
  let config: NovaTechWorkflowConfig;
  try {
    config = getNovaTechWorkflowConfig();
  } catch (error) {
    if (error instanceof EnvMissingError) {
      throw new ConfigurationError(undefined, { cause: error });
    }
    throw error;
  }

  const command = new StartExecutionCommand({
    stateMachineArn: config.stateMachineArn,
    name: novatechInquiryExecutionName(input.submissionId),
    input: JSON.stringify({
      submissionId: input.submissionId,
      requestId: input.requestId,
      inquiry: input.inquiry,
    }),
  });

  const client = clientOverride ?? (await createSfnClient(config));

  try {
    await client.send(command);
    return { outcome: "started" };
  } catch (error) {
    if (isExecutionAlreadyExists(error)) {
      return { outcome: "already_exists" };
    }
    throw classifyStartExecutionError(error);
  }
}

async function createSfnClient(
  config: NovaTechWorkflowConfig,
): Promise<SFNClient> {
  if (shouldUseVercelOidc(config.roleArn)) {
    const [{ getVercelOidcToken }, { fromWebToken }] = await Promise.all([
      import("@vercel/oidc"),
      import("@aws-sdk/credential-providers"),
    ]);
    const webIdentityToken = await getVercelOidcToken();
    return new SFNClient({
      region: config.region,
      credentials: fromWebToken({
        roleArn: config.roleArn!,
        webIdentityToken,
        clientConfig: { region: config.region },
      }),
    });
  }

  return new SFNClient({ region: config.region });
}

function shouldUseVercelOidc(roleArn: string | undefined): boolean {
  if (!roleArn) return false;
  const vercelEnv = (process.env.VERCEL_ENV ?? "").trim();
  return vercelEnv === "production" || vercelEnv === "preview";
}

function isExecutionAlreadyExists(error: unknown): boolean {
  if (error instanceof ExecutionAlreadyExists) return true;
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "ExecutionAlreadyExists"
  );
}

function classifyStartExecutionError(error: unknown): Error {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";

  if (
    name === "AccessDeniedException" ||
    name === "UnrecognizedClientException" ||
    name === "InvalidArn" ||
    name === "StateMachineDoesNotExist" ||
    name === "InvalidName"
  ) {
    return new ConfigurationError(undefined, { cause: error });
  }

  return new WorkflowUnavailableError(undefined, { cause: error });
}
