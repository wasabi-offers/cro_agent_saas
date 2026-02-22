import Anthropic from "@anthropic-ai/sdk";
import { wrapAnthropic, initLogger, traced } from "braintrust";

export const anthropic = wrapAnthropic(
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
);

export const logger = initLogger({
  projectName: "CRO Agent",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

export { traced };
