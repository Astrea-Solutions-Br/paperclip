import type { AdapterModelProfileDefinition } from "@paperclipai/adapter-utils";

// Re-export server functions for direct consumption
const type = "ollama_local";
const label = "Ollama (local)";

export { type, label };

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.2";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_NUM_CTX = 4096;

export const models = [
  { id: DEFAULT_OLLAMA_MODEL, label: "Llama 3.2" },
  { id: "deepseek-coder", label: "DeepSeek Coder" },
  { id: "qwen2.5", label: "Qwen 2.5" },
  { id: "codellama", label: "Code Llama" },
  { id: "mistral", label: "Mistral" },
  { id: "phi4", label: "Phi 4" },
  { id: "gemma2", label: "Gemma 2" },
  { id: "deepseek-llm", label: "DeepSeek LLM" },
  { id: "neural-chat", label: "Neural Chat" },
  { id: "starling-lm", label: "Starling LM" },
];

export const modelProfiles: AdapterModelProfileDefinition[] = [
  {
    key: "cheap",
    label: "Cheap",
    description: "Use a smaller quantized model for budget-friendly inference.",
    adapterConfig: {
      model: "llama3.2",
      options: {
        num_ctx: 2048,
        temperature: 0.3,
      },
    },
    source: "adapter_default",
  },
];

export const agentConfigurationDoc = `# ollama_local agent configuration

Adapter: ollama_local

Use when:
- You want Paperclip to invoke models via the local Ollama API
- You need a fully local LLM without cloud dependency
- You want models that are small enough to run on your hardware
- You need code completion or reasoning through quantized local models

Don't use when:
- You need stateful conversation sessions (Ollama is stateless for /api/generate)
- Your machine doesn't have enough RAM/VRAM for the selected model
- You need guaranteed uptime SLA (local inference depends on your hardware)
- You need a specific model not supported by Ollama

Core fields:
- model (string, required): Ollama model name (e.g., 'llama3.2', 'codellama')
- ollamaUrl (string, optional): Ollama API URL. Defaults to 'http://localhost:11434'
- temperature (number, optional): Sampling temperature. Default 0.7
- num_ctx (number, optional): Context window size in tokens. Default 4096
- instructionsFilePath (string, optional): absolute path to a markdown instructions file prepended to the run prompt
- promptTemplate (string, optional): run prompt template
- timeoutSec (number, optional): request timeout in seconds. Default 120
- options (object, optional): additional Ollama generate options passed directly to the API

Operational fields:
- timeoutSec (number, optional): run timeout in seconds

Notes:
- Ollama API runs locally on port 11434 by default. Do NOT expose it publicly.
- The adapter sends non-streaming requests (stream: false) for simpler parsing.
- Ollama does not have a built-in skills system like Claude/Gemini CLI.
- Make sure the requested model is already pulled: 'ollama pull <model>'
`;
