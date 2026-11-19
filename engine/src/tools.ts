export const AI_TOOLS = ["chatgpt", "claude", "gemini", "copilot", "deepseek", "perplexity", "grok", "mistral"] as const;
export type AiTool = (typeof AI_TOOLS)[number];

export const TOOL_HOSTS: Record<string, AiTool> = {
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "claude.ai": "claude",
  "gemini.google.com": "gemini",
  "copilot.microsoft.com": "copilot",
  "m365.cloud.microsoft": "copilot",
  "chat.deepseek.com": "deepseek",
  "www.perplexity.ai": "perplexity",
  "perplexity.ai": "perplexity",
  "grok.com": "grok",
  "chat.mistral.ai": "mistral",
};

export function toolForHost(host: string): AiTool | null {
  return TOOL_HOSTS[host.toLowerCase()] ?? null;
}
