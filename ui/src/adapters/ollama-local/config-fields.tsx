import type { AdapterConfigFieldsProps } from "../types";
import { DraftInput, Field } from "../../components/agent-config-primitives";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

function valueOrConfig(
  key: string,
  config: Record<string, unknown>,
  values: Record<string, unknown> | null,
  isCreate: boolean,
  fallback = "",
): string {
  if (isCreate && values?.[key] != null) return String(values[key]);
  if (config[key] != null) return String(config[key]);
  return fallback;
}

export function OllamaLocalConfigFields({
  isCreate,
  values,
  config,
  set,
  mark,
}: AdapterConfigFieldsProps) {
  const cfg = (config ?? {}) as Record<string, unknown>;
  const vals = (values ?? {}) as Record<string, unknown>;

  return (
    <>
      <Field label="Ollama model" hint="Model name available in Ollama (e.g., llama3.2, codellama).">
        <DraftInput
          value={valueOrConfig("model", cfg, vals, isCreate, "llama3.2")}
          onCommit={(v) => {
            if (isCreate) set?.({ model: v } as Record<string, unknown>);
            else mark("adapterConfig", "model", v || undefined);
          }}
          immediate
          className={inputClass}
          placeholder="llama3.2"
        />
      </Field>

      <Field label="Ollama URL" hint="Ollama API URL. Default: http://localhost:11434">
        <DraftInput
          value={valueOrConfig("ollamaUrl", cfg, vals, isCreate, "http://localhost:11434")}
          onCommit={(v) => {
            if (isCreate) set?.({ ollamaUrl: v } as Record<string, unknown>);
            else mark("adapterConfig", "ollamaUrl", v || undefined);
          }}
          immediate
          className={inputClass}
          placeholder="http://localhost:11434"
        />
      </Field>

      <Field label="Temperature" hint="Sampling temperature (0.0 - 2.0). Default: 0.7">
        <DraftInput
          value={valueOrConfig("temperature", cfg, vals, isCreate, "0.7")}
          onCommit={(v) => {
            const num = parseFloat(v);
            const final = v.trim() === "" ? undefined : Number.isFinite(num) ? num : 0.7;
            if (isCreate) set?.({ temperature: final } as Record<string, unknown>);
            else mark("adapterConfig", "temperature", final);
          }}
          immediate
          className={inputClass}
          placeholder="0.7"
        />
      </Field>

      <Field label="Context window" hint="Number of context tokens (num_ctx). Default: 4096">
        <DraftInput
          value={valueOrConfig("numCtx", cfg, vals, isCreate, "4096")}
          onCommit={(v) => {
            const num = parseInt(v, 10);
            const final = v.trim() === "" ? undefined : Number.isFinite(num) ? num : 4096;
            if (isCreate) set?.({ numCtx: final } as Record<string, unknown>);
            else mark("adapterConfig", "numCtx", final);
          }}
          immediate
          className={inputClass}
          placeholder="4096"
        />
      </Field>
    </>
  );
}
