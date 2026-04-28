import { processMessageJob, type MessageJobData } from "./processMessage.job";
import { logger } from "../lib/logger";

export const messageQueue = {
  add: async (_name: string, data: MessageJobData) => {
    // Fire-and-forget: processa inline sem bloquear o webhook
    setImmediate(() => {
      processMessageJob(data).catch((err) =>
        logger.error({ err, conversationId: data.conversationId }, "Job failed"),
      );
    });
    return { id: "inline" };
  },
};
