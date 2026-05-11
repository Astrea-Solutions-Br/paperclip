import type { AdapterConfigFieldsProps } from "../types";
import { DraftInput, Field } from "../../components/agent-config-primitives";
import { useMemo } from "react";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

export function OllamaLocalConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  return (
    <>
      <Field label="Ollama model" hint="Model name available in Ollama (e.g., llama3.2, codellama).">
        <DraftInput
          value={
            isCreate
              ? values?.model ?? ""
              : eff("adapterConfig", "model", String(config.model ?? "llama3.2"))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ model: v })
              : mark("adapterConfig", "model", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="llama3.2"
        />
      </Field>

      <Field label="Ollama URL" hint="Ollama API URL. Default: http://localhost:11434">
        <DraftInput
          value={
            isCreate
              ? values?.ollamaUrl ?? ""
              : eff(
                  "adapterConfig",
                  "ollamaUrl",
                  String(config.ollamaUrl ?? "http://localhost:11434"),
                )
          }
          onCommit={(v) =>
            isCreate
              ? set!({ ollamaUrl: v })
              : mark("adapterConfig", "ollamaUrl", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="http://localhost:11434"
        />
      </Field>

      <Field label="Temperature" hint="Sampling temperature (0.0 - 2.0). Default: 0.7">
        <DraftInput
          value={
            isCreate
              ? typeof values?.temperature === "number"
                ? String(values.temperature)
                : ""
              : eff(
                  "adapterConfig",
                  "temperature",
                  typeof config.temperature === "number"
                    ? String(config.temperature)
                    : "0.7",
                )
          }
          onCommit={(v) => {
            const num = parseFloat(v);
            if (isCreate) {
              set!({ temperature: Number.isFinite(num) ? num : 0.7 });
            } else {
              const final = v.trim() === "" ? undefined : Number.isFinite(num) ? num : 0.7;
              mark("adapterConfig", "temperature", final);
            }
          }}
          immediate
          className={inputClass}
          placeholder="0.7"
        />
      </Field>

      <Field label="Context window" hint="Number of context tokens (num_ctx). Default: 4096">
        <DraftInput
          value={
            isCreate
              ? typeof values?.numCtx === "number"
                ? String(values.numCtx)
                : ""
              : eff(
                  "adapterConfig",
                  "numCtx",
                  typeof config.num_ctx === "number"
                    ? String(config.num_ctx)
                    : typeof config.numCtx === "number"
                      ? String(config.numCtx)
                      : "4096",
                )
          }
          onCommit={(v) => {
            const num = parseInt(v, 10);
            if (isCreate) {
              set!({ numCtx: Number.isFinite(num) ? num : 4096 });
            } else {
              const final = v.trim() === "" ? undefined : Number.isFinite(num) ? num : 4096;
              mark("adapterConfig", "numCtx", final);
            }
          }}
          immediate
          className={inputClass}
          placeholder="4096"
        />
      </Field>
    </>
  );
}
