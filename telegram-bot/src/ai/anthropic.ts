import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!client) {
    if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const aiEnabled = () => Boolean(env.ANTHROPIC_API_KEY);
