import type { CreateConfigValues } from "@paperclipai/adapter-utils";

export function buildOllamaLocalConfig(v: CreateConfigValues): Record<string, unknown> {
  const values = v as CreateConfigValues & Record<string, unknown>;
  const ac: Record<string, unknown> = {};

  ac.model = values.model || "llama3.2";

  if (values.ollamaUrl) ac.ollamaUrl = values.ollamaUrl;
  if (values.temperature !== undefined) ac.temperature = values.temperature;
  if (values.numCtx !== undefined) ac.num_ctx = values.numCtx;
  if (values.instructionsFilePath) ac.instructionsFilePath = values.instructionsFilePath;
  if (values.promptTemplate) ac.promptTemplate = values.promptTemplate;
  if (values.timeoutSec !== undefined) ac.timeoutSec = values.timeoutSec;

  return ac;
}
