# aicamp — LLM tool calling & MCP experiments

Small, readable examples of the patterns behind AI agents.

- `agent.ts` — the minimal tool-calling loop: model picks a tool → code runs it → result goes back to the model → final answer
- `tools.ts` — Zod-validated tools over a Supabase projects table (`list_projects`, project details, percentage maths), with strict JSON schemas
- `my-mcp-server/` — a Model Context Protocol server exposing tools to MCP clients

## Stack
TypeScript · OpenAI SDK · Zod · Supabase · MCP

## Run
```bash
npm install
echo "OPENAI_API_KEY=sk-..." > .env
npx tsx agent.ts
```
