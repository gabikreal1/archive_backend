# Front-End Product Requirements Document (PRD)
# PWA Application — LLM Task Execution Platform with ARC/Circle Integration (Final Version)

---

## 1. Overview
This document defines the **final, consolidated PRD** for the **front-end (TypeScript) PWA** that enables users to create tasks, interact with an LLM dialog agent, select execution bids, confirm payment, track execution, and view results. The app integrates with **Circle Auth** and **ARC/Circle Wallet (testnet)** for blockchain-backed payments.

---

## 2. Primary Goals
- Provide a clean, responsive **PWA front-end** written in **TypeScript**.
- Deliver an intuitive, chat-based LLM interaction flow.
- Let users create tasks and immediately receive **bid-spread suggestions** for Economy / Balanced / Premium.
- Allow users to select a bid tier and confirm payment through ARC wallet.
- Provide full transparency on agent trust levels and status updates.
- Display results on a separate **Result Page** independent of the chat.

---

## 3. High-Level User Flow
1. **Open PWA → Sign in with Circle Auth**.
2. **Connect ARC/Circle Testnet Wallet**.
3. **Enter task prompt** into chat UI.
4. Backend creates a new task and immediately returns:
   - `task_id`
   - `summary` (LLM understanding)
   - `bid_spread` containing: 
     - `economy.price`
     - `balanced.price`
     - `premium.price`
5. LLM displays bid options via UI slider.
6. User selects bid.
7. User confirms task → opens bottom-sheet payment confirmation.
8. User pays via ARC wallet.
9. Execution begins — ChatGPT-like thinking and streaming progress.
10. Upon completion → User gets link to **Result Page**.
11. Result Page displays the final output (any format allowed).

---

## 4. Detailed Front-End Flows

### 4.1. Onboarding
- Circle Auth login screen.
- Wallet connection panel in header.
- Wallet shows: USDC balance, connection status, testnet indicator.

### 4.2. Chat & Message Interaction
- Chat-like UI similar to ChatGPT.
- Every LLM message may expose actions using **emoji-based radio buttons**:
  - 📌 Use as Task Definition
  - ➕ Add as Additional Context
  - 🔁 Regenerate
  - ❓ Clarify

### 4.3. Bid-Spread UI (Updated: Marketplace-Derived Bids)
After the user creates a task, the agent **automatically submits the task as a request to an on-chain marketplace**.

### Bid Collection Flow
1. Marketplace receives the task request.
2. Multiple agents submit bids on-chain.
3. Backend collects all finished bids (N bids).
4. System sorts bids by:
   - price
   - agent trust rating (1–5 stars)
   - estimated execution time (optional)
5. System splits the bids into **3 ranges**:
   - **Economy** — lowest-cost range
   - **Balanced** — median range
   - **Premium** — highest-quality / highest-trust range
6. System selects **1 representative bid** from each range:
   - `economy_bid`
   - `balanced_bid`
   - `premium_bid`
7. These 3 representative bids are returned to the front-end as the **tiered widget options**.

### Tier Selection UI
Instead of a slider, the user sees **3 bid cards**:
- Economy (price + agent star rating)
- Balanced (price + agent star rating)
- Premium (price + agent star rating)

Each card contains:
- `price_usdc`
- `agent_trust_stars`
- `agent_id` (optional, hidden internally)
- "See Additional Info" button (opens bottom sheet)
- "Select This Bid" button

### Additional Information Step
Clicking a bid opens:
- bid description
- required additional details (questions from agent’s bid template)
- expected execution style
- acceptable inputs / requirements

User answers required fields.
When the agent determines it has enough information to execute:
- The UI enables **Proceed to Payment**.

### Execution-Ready State
Once inputs are complete:
- Payment bottom sheet appears
- User pays
- Task enters `executing` state
After creating a task, backend returns suggested bids:
- Economy: `{ price, time_estimate, trust_stars }`
- Balanced: `{ price, time_estimate, trust_stars }`
- Premium: `{ price, time_estimate, trust_stars }`

UI element for choosing tier:
- **Horizontal slider**
- Left icon: ⭐ (quality)
- Right icon: 💲 (budget)
- Values: Economy → Balanced → Premium

### 4.4. Payment UI
Payment is confirmed through **bottom-sheet**:
- Task summary
- Selected tier
- Price (locked_price_usdc)
- Agent trust level (⭐ rating)
- "Pay with ARC/Circle Wallet" button

### 4.5. Execution Progress
During execution:
- Display ChatGPT-style streaming updates:
  - "Thinking…"
  - "Analyzing task…"
  - "Executing…"
  - "Preparing result…"
- Intermediate outputs may appear in chat.
- No progress bars, timelines, or pinned context.

### 4.6. Result Page
After `result_ready` event:
- Navigate to `/result/:task_id`
- Page must support generic result structure:
  - text
  - markdown
  - HTML snippet
  - structured JSON
  - link
  - file bundle
- Offer export/download where applicable.

---

## 5. TypeScript Architecture
### 5.1. Tech Stack
- **Next.js / React** (or React SPA, depending on decision)
- **TypeScript** everywhere
- **Zustand** or **Recoil** for client state
- **SWR** or **React Query** for API requests
- **WebSockets** for all LLM & task streaming events
- **Service Worker** for PWA installability

### 5.2. Folder Structure
```
src/
  api/
    client.ts
    dialog.ts
    tasks.ts
    wallet.ts
  components/
    chat/
    sliders/
    result/
    shared/
  pages/
    index.tsx
    result/[task_id].tsx
  state/
    user.ts
    wallet.ts
    chat.ts
  types/
    task.ts
    dialog.ts
    wallet.ts
    result.ts
```

---

## 6. UI Components

### 6.1. Chat Components
- `ChatInput`
- `MessageBubble`
- `MessageActions` (emoji radio buttons)
- `ThinkingIndicator` (ChatGPT-style)

### 6.2. Task & Bid Components
- `BidTierCard` (Economy / Balanced / Premium)
- `BidTierSelection`
- `BidAdditionalInfoSheet`
- `TrustStars`

### 6.3. Payment Components
- `PaymentSheet`
- `PriceBreakdown`
- `WalletPanel`

### 6.4. Result Components
- `ResultContainer`
- `ResultRenderer` (text/markdown/json/files/links)
- `DownloadButton`
- **`FeedbackSection` (NEW)**:
  - 1–5 star slider or horizontal star selector.
  - Inline thank‑you message for ratings 3–5.
  - Automatic dispute suggestion for ratings 1–2.

### 6.5. Dispute Components (NEW)
- `DisputePromptSheet`
- `DisputeReasonForm`
- `SubmitDisputeButton`
 (Required)
### 6.1. Chat Components
- `ChatInput`
- `MessageBubble`
- `MessageActions` (emoji radio buttons)
- `ThinkingIndicator` (ChatGPT-style)

### 6.2. Task & Bid Components
- `BidSlider`
- `TierCard`
- `TrustStars`

### 6.3. Payment Components
- `PaymentSheet`
- `PriceBreakdown`
- `WalletPanel`

### 6.4. Result Components
- `ResultContainer`
- `ResultRenderer` (auto-detect type)
- `DownloadButton`

---

## 7. Front-End API

Below is the consolidated **TypeScript-oriented API spec** including the new **feedback** and **dispute** structures.
 (TypeScript Contracts)
Below is the final consolidated API matching the new requirement:  
**After creating a task, the backend immediately returns suggested bids for all tiers**.

---

### 7.1. Types
```ts
export interface BidTierSuggestion {
  id: "economy" | "balanced" | "premium";
  price_usdc: string;
  time_estimate_min: number;
  agent_trust_stars: number; // 0-5
}

export interface CreatedTaskResponse {
  task_id: string;
  summary: string;
  bid_spread: BidTierSuggestion[];
}
```

---

### 7.2. API Endpoints

---

## 🔥 Feedback & Dispute Additions (NEW)
All tasks now support **optional feedback attributes**:
```ts
interface TaskFeedback {
  rating: number;          // 1–5 stars
  comment?: string;        // optional free-text
}

interface TaskDispute {
  opened: boolean;
  reason?: string;         // user text
  created_at?: string;
}
```
Both are persisted as attributes of a task and can be retrieved via `/api/tasks/{task_id}`.

### POST `/api/tasks/{task_id}/feedback`
User submits rating & optional comment.

**Request:**
```json
{
  "rating": 1,
  "comment": "Work does not match my requirements"
}
```

**Response:**
```json
{
  "task_id": "uuid",
  "feedback": {
    "rating": 1,
    "comment": "Work does not match my requirements"
  }
}
```

If rating is **1–2**, frontend triggers dispute suggestion.

---

### POST `/api/tasks/{task_id}/dispute`
Opens a dispute, requires an explanation message.

**Request:**
```json
{
  "reason": "The result is incorrect and incomplete."
}
```

**Response:**
```json
{
  "task_id": "uuid",
  "dispute": {
    "opened": true,
    "reason": "The result is incorrect and incomplete.",
    "created_at": "2025-01-01T12:00:00Z"
  }
}
```

---

### NOTE
- Feedback can exist **without** a dispute.
- A dispute **always** requires a `reason`.
- Once dispute is opened, task moves to status: `on_review`.

---


#### POST `/api/tasks`
Creates a task and returns immediate bid suggestions.

**Request:**
```json
{
  "initial_prompt": "string"
}
```

**Response:**
```json
{
  "task_id": "uuid",
  "summary": "LLM-understood summary",
  "bid_spread": [
    {
      "id": "economy",
      "price_usdc": "5.00",
      "time_estimate_min": 5,
      "agent_trust_stars": 3.2
    },
    {
      "id": "balanced",
      "price_usdc": "12.50",
      "time_estimate_min": 10,
      "agent_trust_stars": 4.1
    },
    {
      "id": "premium",
      "price_usdc": "25.00",
      "time_estimate_min": 15,
      "agent_trust_stars": 4.8
    }
  ]
}
```

---

#### POST `/api/tasks/{task_id}/select-tier`
Selects the chosen tier.

**Request:**
```json
{
  "tier_id": "economy|balanced|premium"
}
```

**Response:**
```json
{
  "task_id": "uuid",
  "tier_id": "balanced",
  "locked_price_usdc": "12.50"
}
```

---

#### POST `/api/tasks/{task_id}/confirm`
Moves task to pending payment.

---

### 7.3. Payment API
#### POST `/api/wallet/pay`
Executes payment.

---

### 7.4. Dialog API
#### POST `/api/dialog/messages`
Send user message.

#### WebSocket `/api/dialog/stream`
Stream: `thinking`, `token`, `message_complete`.

---

### 7.5. Execution API
#### WebSocket `/api/tasks/{task_id}/stream`
Stream execution updates.

#### GET `/api/tasks/{task_id}/result`
Fetch final result.

---

## 8. Non-Functional Requirements
- Latency target < 150ms per UI action
- Full PWA installability
- Offline support for session + chat history
- Local IndexedDB caching of message history
- WebSocket reconnection logic
- Strong error boundaries

---

## 9. Success Metrics
- Task → Paid Task conversion rate
- Result delivery success rate
- User satisfaction rating
- Average execution duration
- Returning sessions

---

## 10. Appendix
This PRD is the **final consolidated version** intended for the front-end TypeScript implementation.

---

End of PRD.

