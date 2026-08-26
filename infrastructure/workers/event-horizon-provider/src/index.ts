import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { redactSecrets } from "./providers/ticketmaster";
import { runWorker } from "./run";

const sqs = new SQSClient({});

async function main(): Promise<void> {
  await runWorker(process.env, {
    async send(queueUrl, body) {
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: body,
        }),
      );
    },
  });
}

main().catch((error: unknown) => {
  const raw = error instanceof Error ? error.message : "Worker failed.";
  const message = redactSecrets(raw, process.env.TICKETMASTER_API_KEY);
  console.error(JSON.stringify({ msg: "worker-fatal", error: message }));
  process.exitCode = 1;
});
