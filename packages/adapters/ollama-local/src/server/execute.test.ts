import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execute } from "./execute.js";
import type { AdapterExecutionContext } from "@paperclipai/adapter-utils";

const makeCtx = (overrides: Partial<AdapterExecutionContext> = {}): AdapterExecutionContext => ({
  runId: "test-run-1",
  agent: {
    id: "agent-1",
    companyId: "company-1",
    name: "Test Agent",
    adapterType: "ollama_local",
    adapterConfig: {
      model: "llama3.2",
      ollamaUrl: "http://localhost:11434",
    },
  },
  runtime: {
    sessionId: null,
    sessionParams: null,
    sessionDisplayId: null,
    taskKey: null,
  },
  config: {},
  context: {},
  onLog: vi.fn(),
  onMeta: vi.fn(),
  onSpawn: vi.fn(),
  authToken: "test-jwt",
  ...overrides,
});

describe("execute", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns success when Ollama responds correctly", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        response: "Hello, world!",
        done: true,
        prompt_eval_count: 10,
        eval_count: 5,
      }),
    });

    const ctx = makeCtx();
    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.resultJson).toBeDefined();
    expect(result.resultJson?.response).toBe("Hello, world!");
    expect(result.timedOut).toBe(false);
    expect(result.summary).toContain("generated");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/generate",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("llama3.2"),
      }),
    );
  });

  it("returns error when Ollama returns non-OK", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue("model not found"),
    });

    const ctx = makeCtx();
    const result = await execute(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.errorCode).toBe("ollama_http_404");
    expect(result.errorMessage).toContain("404");
  });

  it("returns timeout when fetch is aborted", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        if (opts?.signal) {
          opts.signal.addEventListener("abort", () => {
            const err = new Error("AbortError");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    });

    const ctx = makeCtx({ config: { timeoutSec: 0.001 } });
    const result = await execute(ctx);

    expect(result.timedOut).toBe(true);
    expect(result.exitCode).toBeNull();
    expect(result.errorCode).toBe("timeout");
  });

  it("uses custom ollamaUrl from config", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ response: "OK", done: true }),
    });

    const ctx = makeCtx({
      agent: {
        ...makeCtx().agent,
        adapterConfig: { ollamaUrl: "http://192.168.1.10:11434", model: "mistral" },
      },
    });

    await execute(ctx);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://192.168.1.10:11434/api/generate",
      expect.anything(),
    );
  });
});
