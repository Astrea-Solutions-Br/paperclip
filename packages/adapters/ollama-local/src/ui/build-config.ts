export function buildOllamaLocalConfig(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const model = typeof values.model === "string" ? values.model.trim() : "";
  if (model) out.model = model;

  const ollamaUrl = typeof values.ollamaUrl === "string" ? values.ollamaUrl.trim() : "";
  if (ollamaUrl) out.ollamaUrl = ollamaUrl;

  const temperature = typeof values.temperature === "number" ? values.temperature : undefined;
  if (temperature !== undefined) out.temperature = temperature;

  const numCtx = typeof values.numCtx === "number" ? values.numCtx : undefined;
  if (numCtx !== undefined) out.num_ctx = numCtx; // snake_case in API payload

  const instructionsFilePath = typeof values.instructionsFilePath === "string" ? values.instructionsFilePath.trim() : "";
  if (instructionsFilePath) out.instructionsFilePath = instructionsFilePath;

  const promptTemplate = typeof values.promptTemplate === "string" ? values.promptTemplate : "";
  if (promptTemplate) out.promptTemplate = promptTemplate;

  const timeoutSec = typeof values.timeoutSec === "number" ? values.timeoutSec : undefined;
  if (timeoutSec !== undefined) out.timeoutSec = timeoutSec;

  const extraOptions = typeof values.options === "object" && values.options !== null && !Array.isArray(values.options)
    ? values.options
    : undefined;
  if (extraOptions) out.options = extraOptions;

  return out;
}
