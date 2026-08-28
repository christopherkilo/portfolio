import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { PermanentFailure } from "./errors";

let cachedToken: string | undefined;
const ssm = new SSMClient({});

export async function getHubSpotAccessToken(
  parameterName = process.env.HUBSPOT_ACCESS_TOKEN_PARAMETER_NAME,
): Promise<string> {
  if (cachedToken) return cachedToken;
  if (!parameterName) {
    throw new PermanentFailure("HubSpot access token parameter is not configured.");
  }
  const response = await ssm.send(
    new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    }),
  );
  const value = response.Parameter?.Value?.trim();
  if (!value) {
    throw new PermanentFailure("HubSpot access token parameter is empty.");
  }
  cachedToken = value;
  return cachedToken;
}

export function clearHubSpotTokenCache(): void {
  cachedToken = undefined;
}