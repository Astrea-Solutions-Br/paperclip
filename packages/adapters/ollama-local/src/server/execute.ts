import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
} from "@paperclipai/adapter-utils";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_TIMEOUT_MS = 120_000;

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function resolveOllamaUrl(config: Record<string, unknown>): string {
  const url = asString(config.ollamaUrl, asString(config.ollama_url, ""));
  if (url) return url;
  const host = asString(config.ollamaHost, asString(config.ollama_host, ""));
  if (host) {
    const port = asNumber(config.ollamaPort, asNumber(config.ollama_port, 11434));
    return `http://${host}:${port}`;
  }
  return DEFAULT_OLLAMA_URL;
}

function readInstructions(config: Record<string, unknown>): string | null {
  // instructionsFilePath is handled by Paperclip before calling us; if it's set,
  // the system prompt is already in ctx.agent.adapterConfig or ctx.config.
  const tpl = asString(config.promptTemplate, asString(config.prompt_template, ""));
  if (tpl) return tpl;
  return null;
}

function buildPrompt(ctx: AdapterExecutionContext): string {
  const { agent, runtime } = ctx;
  const config = (agent.adapterConfig ?? {}) as Record<string, unknown>;

  const instructions = readInstructions(config);
  const taskKey = runtime.taskKey ?? "";

  const parts: string[] = [];

  if (instructions) {
    parts.push(instructions);
  }

  parts.push(`Run ID: ${ctx.runId}`);
  if (taskKey) {
    parts.push(`Task: ${taskKey}`);
  }

  // Paperclip context summary
  const ctxSummary = ctx.context ? JSON.stringify(ctx.context, null, 2) : "";
  if (ctxSummary) {
    parts.push(`Context:\n${ctxSummary}`);
  }

  parts.push("Execute the assigned task. Respond with your work summary.");

  return parts.join("\n\n");
}

export async function execute(
  ctx: AdapterExecutionContext,
): Promise<AdapterExecutionResult> {
  const { agent, config, onLog } = ctx;
  const mergedConfig = { ...((agent.adapterConfig ?? {}) as Record<string, unknown>), ...config };
  const ollamaUrl = resolveOllamaUrl(mergedConfig);
  const model = asString(mergedConfig.model, "llama3.2").trim();
  const temperature = asNumber(mergedConfig.temperature, asNumber(mergedConfig.temp, 0.7));
  const numCtx = asNumber(mergedConfig.numCtx, asNumber(mergedConfig.num_ctx, asNumber(mergedConfig.context, 4096)));
  const timeoutMs = asNumber(
    mergedConfig.timeoutMs,
    asNumber(mergedConfig.timeout_sec, asNumber(mergedConfig.timeoutSec, 0)) * 1000 || DEFAULT_TIMEOUT_MS,
  );

  const prompt = buildPrompt(ctx);

  // Log the request
  await onLog("stdout", `Ollama: POST ${ollamaUrl}/api/generate  model=${model}\n`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          num_ctx: numCtx,
          ...(typeof mergedConfig.options === "object" && mergedConfig.options !== null
            ? (mergedConfig.options as Record<string, unknown>)
            : {}),
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        errorMessage: `Ollama API returned ${res.status}: ${bodyText.slice(0, 500)}`,
        errorCode: `ollama_http_${res.status}`,
        summary: `Ollama request failed: HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as Record<string, unknown>;

    const responseText = typeof data.response === "string" ? data.response : "";
    const done = data.done === true;

    // Token usage if available
    const promptEvalCount = typeof data.prompt_eval_count === "number" ? data.prompt_eval_count : 0;
    const evalCount = typeof data.eval_count === "number" ? data.eval_count : 0;

    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      summary: done
        ? `Ollama ${model}: generated ${responseText.length} chars`
        : `Ollama ${model}: incomplete`,
      usage:
        promptEvalCount || evalCount
          ? {
              inputTokens: promptEvalCount,
              outputTokens: evalCount,
            }
          : undefined,
      resultJson: {
        ...data,
        content: responseText,
      },
    };
  } catch (err) {
    clearTimeout(timer);

    if (err instanceof Error && err.name === "AbortError") {
      return {
        exitCode: null,
        signal: null,
        timedOut: true,
        errorMessage: `Ollama request timed out after ${timeoutMs}ms`,
        errorCode: "timeout",
        summary: `Ollama ${model}: timed out`,
      };
    }

    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorCode: "ollama_error",
      summary: `Ollama ${model}: error - ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
