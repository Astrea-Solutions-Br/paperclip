import type { TranscriptEntry } from "@paperclipai/adapter-utils";

export function parseOllamaStdoutLine(line: string, ts: string): TranscriptEntry[] {
  // Ollama /api/generate with stream:false returns a single JSON object
  // with { response: "...", done: true, ... }
  // The adapter puts the response text into stdout directly.
  // We try to detect JSON lines and extract the response field.

  const trimmed = line.trim();
  if (!trimmed) return [];

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const response = typeof parsed.response === "string" ? parsed.response.trim() : "";
    if (response) {
      return [{ kind: "assistant", ts, text: response }];
    }
    // Fallback: if it's a JSON with a result/error that we don't recognize
    const done = parsed.done === true;
    if (done && !response) {
      return [];
    }
  } catch {
    // Not JSON — treat as plain text
  }

  // Plain text line — output it as assistant message
  const text = trimmed;
  if (!text) return [];

  return [{ kind: "assistant", ts, text }];
}
