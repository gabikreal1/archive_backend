# Executor Agents Reference

This document summarizes the executor agent data model, explains each configurable property with guidance for building V0 UI components, and documents the `/executor-agents` API exposed by the backend.

---

## 1. Entity Structure (`AgentEntity`)

| Field | Type | Required | Description / Guidance |
| --- | --- | --- | --- |
| `id` | `string` | auto | Stable identifier (`agent_<timestamp>` by default, customizable in seed files). |
| `name` | `string` | yes | Human-friendly label; 3–80 chars recommended. Displayed as the primary card title in V0. |
| `description` | `string \| null` | optional | Longer summary for tooltips or card subtitles. Encourage operators to state the niche and unique value. |
| `capabilities` | `string[] \| null` | optional | Tags used for filtering/matching. In UI, prefer a multi-select chips input; store `null` when empty. |
| `walletAddress` | `string \| null` | auto | Populated by `WalletService`. In dev it can be forced to the shared wallet derived from `WEB3_OPERATOR_PRIVATE_KEY` or `DEV_AGENT_WALLET_*` envs. |
| `pricePerExecution` | `number \| null` | optional | Flat fee for running a job (currency defined by business logic, currently USD-equivalent). Use a numeric input with min `0`. |
| `status` | `"ACTIVE"` (default) | optional | Future-proofing for soft-disable. In UI expose a toggle if/when pause/activate is required. |
| `llmConfig` | `jsonb \| null` | yes | See breakdown below. Stores the prompts and LLM model metadata that downstream automation uses. |

### 1.1 `llmConfig` breakdown

| Field | Type | Required | Notes / UI tips |
| --- | --- | --- | --- |
| `model` | `string` | yes | Name of the LLM to call (e.g., `gpt-4.1-mini`). Present a dropdown seeded from allowed models. |
| `systemPrompt` | `string` | yes (≥10 chars) | High-level persona definition. Provide a large textarea with helper text about tone & responsibilities. |
| `bidPrompt` | `string` | yes (≥10 chars) | How the agent decides whether to place a bid and what clarifying questions to ask. |
| `executionPrompt` | `string` | yes (≥10 chars) | Instructions for actually fulfilling an accepted job (structure, deliverables, QA steps). |
| `inputGuidelines` | `string \| undefined` | optional | Checklist shown to operators describing required inputs before the agent starts. |
| `refusalPolicy` | `string \| undefined` | optional | When the agent must reject or ask for more info. Display beneath the prompts so builders remember to document guardrails. |

> **Recommendation:** keep prompts concise but explicit. Encourage operators to save them in version control (the JSON seed file described below) so you can reapply them consistently across environments.

### 1.2 Example JSON object

```json
{
  "id": "agent_solidity_auditor",
  "name": "Solidity Auditor Lite",
  "description": "Static analysis for Solidity 0.8+ smart contracts.",
  "capabilities": ["solidity", "security", "audit"],
  "pricePerExecution": 15,
  "status": "ACTIVE",
  "llmConfig": {
    "model": "gpt-4.1-mini",
    "systemPrompt": "You are a pragmatic smart-contract auditor ...",
    "bidPrompt": "Accept jobs only when Solidity code is provided ...",
    "executionPrompt": "Report format: Summary → Critical → High → Medium ...",
    "inputGuidelines": "Need repo link, compiler version, libraries, test coverage expectation.",
    "refusalPolicy": "Reject non-Solidity or formal verification requests."
  }
}
```

---

## 2. V0 Component Recommendations

- **Stepper form (Basics → Prompts → Pricing):** Break creation into logical steps to prevent prompt fatigue.
- **Prompt helpers:** Provide expandable examples (e.g., “restaurant researcher”, “insight synthesizer”) so operators can reuse patterns quickly.
- **Capabilities input:** Use tag chips with autocomplete; store lowercased slugs to match `capabilities` filtering on the backend.
- **Validation hints:** Mirror backend constraints (`@MinLength(3)`, `@MinLength(10)` for prompts, `pricePerExecution >= 0`). Show inline errors before submission.
- **Preview pane:** Render a live summary card (name + description + price + key prompts) so operators see what downstream users will read.
- **JSON export/import:** Surface the underlying config (matching `backend/seeds/executor-agents.json`) to simplify bulk edits or sharing between environments.

---

## 3. API: Create Executor Agent

| Property | Value |
| --- | --- |
| Method & Path | `POST /executor-agents` |
| Auth | `Authorization: Bearer <agent-admin JWT>` from `/agent-auth/login` |
| Content-Type | `application/json` |

### 3.1 Request body schema

| Field | Type | Required | Validation / Notes |
| --- | --- | --- | --- |
| `name` | `string` | yes | Min length 3. |
| `description` | `string` | yes | Min length 3 (per DTO). |
| `capabilities` | `string[]` | optional | If omitted, stored as `null`. |
| `model` | `string` | yes | Min length 3. |
| `systemPrompt` | `string` | yes | Min length 10. |
| `bidPrompt` | `string` | yes | Min length 10. |
| `executionPrompt` | `string` | yes | Min length 10. |
| `pricePerExecution` | `number` | yes | `@Min(0)`; decimals allowed. |
| `inputGuidelines` | `string` | optional | Additional operator guidance. |
| `refusalPolicy` | `string` | optional | When to decline jobs. |

#### Example request

```http
POST /executor-agents
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "name": "Insight Synthesizer",
  "description": "Summarizes large research dumps into executive briefs.",
  "capabilities": ["summarization", "analysis"],
  "model": "gpt-4.1",
  "systemPrompt": "...",
  "bidPrompt": "...",
  "executionPrompt": "...",
  "pricePerExecution": 5,
  "inputGuidelines": "Need raw notes and target audience.",
  "refusalPolicy": "Reject coding requests."
}
```

### 3.2 Successful response

```json
{
  "id": "agent_1731600000000",
  "name": "Insight Synthesizer",
  "capabilities": ["summarization", "analysis"],
  "description": "Summarizes large research dumps into executive briefs.",
  "llmConfig": {
    "model": "gpt-4.1",
    "systemPrompt": "...",
    "inputGuidelines": "Need raw notes and target audience.",
    "refusalPolicy": "Reject coding requests.",
    "bidPrompt": "...",
    "executionPrompt": "..."
  },
  "status": "ACTIVE"
}
```

### 3.3 Error responses

- `401 Unauthorized` – missing/invalid JWT.
- `400 Bad Request` – DTO validation failed (see `message` array returned by Nest validation pipe).
- `500 Internal Server Error` – unexpected DB/Circle issues.

---

## 4. Seeding & Environment Tips

- Script: `npm run seed:executor-agents` → executes `backend/src/seed-executor-agents.ts`, which reads `backend/seeds/executor-agents.json` by default or `EXECUTOR_AGENTS_CONFIG=/abs/path/file.json`.
- Config schema matches the table above; the script upserts by `id`.
- Dev wallet override: set `DEV_AGENT_WALLET_ADDRESS`, `DEV_AGENT_WALLET_PRIVATE_KEY`, or rely on `WEB3_OPERATOR_PRIVATE_KEY` to force every executor to share the same Circle dev wallet (`DEV_AGENT_CIRCLE_WALLET_ID` defaults to `dev-agent-circle-wallet`). This keeps hackathon flows simple while still satisfying the backend requirement that each agent has a wallet mapping.
- Recommended workflow for V0 builders:
  1. Prototype agents in the UI.
  2. Export to JSON and commit to `backend/seeds/executor-agents.json`.
  3. Rerun the seed script for local/preview/prod environments.

---

Need more fields or behaviors? Ping the backend team if you plan to extend `llmConfig`, add scheduling info, or require per-agent rate limits so the DTO/entity can evolve in lockstep with the UI.

