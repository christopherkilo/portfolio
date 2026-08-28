import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { PermanentNotificationError } from "./errors";

let cachedKey: string | undefined;
const ssm = new SSMClient({});

export async function getResendApiKey(
  parameterName = process.env.RESEND_API_KEY_PARAMETER_NAME,
): Promise<string> {
  if (cachedKey) return cachedKey;
  if (!parameterName) {
    throw new PermanentNotificationError("Resend API key parameter is not configured.");
  }
  const response = await ssm.send(
    new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    }),
  );
  const value = response.Parameter?.Value?.trim();
  if (!value) {
    throw new PermanentNotificationError("Resend API key parameter is empty.");
  }
  cachedKey = value;
  return cachedKey;
}

export function clearResendApiKeyCache(): void {
  cachedKey = undefined;
}
