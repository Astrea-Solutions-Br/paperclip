import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { testEnvironment } from "./test.js";
import type {
  AdapterEnvironmentTestContext,
  AdapterEnvironmentCheck,
} from "@paperclipai/adapter-utils";

const makeCtx = (overrides: Partial<AdapterEnvironmentTestContext> = {}): AdapterEnvironmentTestContext => ({
  companyId: "company-1",
  adapterType: "ollama_local",
  config: {},
  environmentName: null,
  executionTarget: null,
  ...overrides,
});

describe("testEnvironment", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns pass when Ollama is healthy and model available", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        models: [
          { name: "llama3.2:latest", model: "llama3.2:latest" },
          { name: "mistral:latest" },
        ],
      }),
    });

    const ctx = makeCtx({ config: { model: "llama3.2" } });
    const result = await testEnvironment(ctx);

    expect(result.status).toBe("pass");
    expect(result.checks.some((c) => c.code === "ollama_api_healthy")).toBe(true);
    expect(result.checks.some((c) => c.code === "ollama_model_found")).toBe(true);
  });

  it("returns warn when model is missing", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        models: [{ name: "llama3.2:latest" }],
      }),
    });

    const ctx = makeCtx({ config: { model: "codellama" } });
    const result = await testEnvironment(ctx);

    expect(result.status).toBe("warn");
    expect(result.checks.some((c) => c.code === "ollama_model_missing")).toBe(true);
  });

  it("returns fail when Ollama is not running", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("fetch failed: ECONNREFUSED"),
    );

    const ctx = makeCtx();
    const result = await testEnvironment(ctx);

    expect(result.status).toBe("fail");
    expect(result.checks.some((c) => c.code === "ollama_not_running")).toBe(true);
  });

  it("returns warn when no models are present", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ models: [] }),
    });

    const ctx = makeCtx();
    const result = await testEnvironment(ctx);

    expect(result.status).toBe("warn");
    expect(result.checks.some((c) => c.code === "ollama_no_models")).toBe(true);
  });
});
