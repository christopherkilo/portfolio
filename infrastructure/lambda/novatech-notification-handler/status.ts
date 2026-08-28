import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export type EmailStatus = "SENT" | "FAILED" | "FAILED_PERMANENT";

export interface WorkflowStatusWriter {
  markEmailResult(input: {
    submissionId: string;
    type: "customer_confirmation" | "staff_notification";
    status: EmailStatus;
  }): Promise<void>;
}

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function tableName(): string {
  const name = process.env.INQUIRY_WORKFLOWS_TABLE_NAME;
  if (!name) {
    throw new Error("INQUIRY_WORKFLOWS_TABLE_NAME is not set.");
  }
  return name;
}

function fieldForType(type: "customer_confirmation" | "staff_notification"): string {
  return type === "customer_confirmation" ? "customerEmailStatus" : "staffEmailStatus";
}

export async function markEmailResult(input: {
  submissionId: string;
  type: "customer_confirmation" | "staff_notification";
  status: EmailStatus;
  nowIso?: string;
}): Promise<void> {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const field = fieldForType(input.type);

  await documentClient.send(
    new UpdateCommand({
      TableName: tableName(),
      Key: { submissionId: input.submissionId },
      UpdateExpression: `SET ${field} = :status, updatedAt = :updatedAt`,
      ExpressionAttributeValues: {
        ":status": input.status,
        ":updatedAt": nowIso,
      },
      ConditionExpression: "attribute_exists(submissionId)",
    }),
  );

  const values: Record<string, string> = {
    ":notificationStatus": input.status === "SENT" ? "SENT" : "FAILED",
    ":updatedAt": nowIso,
  };
  let condition = "attribute_exists(submissionId)";
  if (input.status === "SENT") {
    values[":sent"] = "SENT";
    condition = "customerEmailStatus = :sent AND staffEmailStatus = :sent";
  }

  try {
    await documentClient.send(
      new UpdateCommand({
        TableName: tableName(),
        Key: { submissionId: input.submissionId },
        UpdateExpression: "SET notificationStatus = :notificationStatus, updatedAt = :updatedAt",
        ExpressionAttributeValues: values,
        ConditionExpression: condition,
      }),
    );
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException && input.status === "SENT") {
      return;
    }
    throw error;
  }
}

export const dynamoStatusWriter: WorkflowStatusWriter = {
  markEmailResult,
};
