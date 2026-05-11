import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@paperclipai/adapter-utils";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function resolveOllamaUrl(config: Record<string, unknown>): string {
  const url = asString(config.ollamaUrl, asString(config.ollama_url, ""));
  if (url) return url;
  const host = asString(config.ollamaHost, asString(config.ollama_host, ""));
  if (host) {
    const port = typeof config.ollamaPort === "number" ? config.ollamaPort : typeof config.ollama_port === "number" ? config.ollama_port : 11434;
    return `http://${host}:${port}`;
  }
  return DEFAULT_OLLAMA_URL;
}

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((check) => check.level === "error")) return "fail";
  if (checks.some((check) => check.level === "warn")) return "warn";
  return "pass";
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = typeof ctx.config === "object" && ctx.config !== null && !Array.isArray(ctx.config)
    ? (ctx.config as Record<string, unknown>)
    : {};
  const ollamaUrl = resolveOllamaUrl(config);

  checks.push({
    code: "ollama_url_configured",
    level: "info",
    message: `Ollama URL configured: ${ollamaUrl}`,
  });

  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      method: "GET",
      headers: { "content-type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      checks.push({
        code: "ollama_api_unhealthy",
        level: "error",
        message: `Ollama API responded with HTTP ${res.status}.`,
        detail: text.slice(0, 240),
        hint: "Verify Ollama is running and accessible at the configured URL.",
      });
    } else {
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const models = Array.isArray(data.models) ? data.models : [];
      checks.push({
        code: "ollama_api_healthy",
        level: "info",
        message: `Ollama API is healthy. Available models: ${models.length}.`,
      });

      if (models.length === 0) {
        checks.push({
          code: "ollama_no_models",
          level: "warn",
          message: "No models found in Ollama. Pull a model first (e.g., 'ollama pull llama3.2').",
        });
      }

      // Check if configured model is available
      const configuredModel = asString(config.model, "").trim();
      if (configuredModel) {
        const found = models.some((m: unknown) => {
          const model = m && typeof m === "object" && !Array.isArray(m) ? (m as Record<string, unknown>) : {};
          const ollamaModelName = asString(model.name, asString(model.model, ""));
          const ollamaBaseName = ollamaModelName.split(":")[0];
          return ollamaBaseName === configuredModel;
        });
        if (found) {
          checks.push({
            code: "ollama_model_found",
            level: "info",
            message: `Configured model '${configuredModel}' is available.`,
          });
        } else {
          checks.push({
            code: "ollama_model_missing",
            level: "warn",
            message: `Configured model '${configuredModel}' is not pulled.`,
            hint: `Run 'ollama pull ${configuredModel}' to install it.`,
          });
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
      checks.push({
        code: "ollama_not_running",
        level: "error",
        message: `Cannot connect to Ollama at ${ollamaUrl}.`,
        detail: message,
        hint: "Start Ollama first: 'ollama serve' or ensure the Ollama desktop app is running.",
      });
    } else {
      checks.push({
        code: "ollama_probe_error",
        level: "error",
        message: `Unexpected error probing Ollama: ${message}`,
        hint: "Check network connectivity and Ollama configuration.",
      });
    }
  }

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
