## AI‑агент и интеграция со смарт‑контрактами (план интеграции)

Этот документ описывает, **в каких местах кода** и **по какому протоколу** внутренний LLM‑агент должен вызывать onchain‑логику (смарт‑контракты) через существующие сервисы блокчейна.

На момент текущей реализации **никаких прямых вызовов смарт‑контрактов из агента нет** – они будут добавлены в отдельной ветке.

---

### 1. Точка входа: `AgentsService.handleUserMessage`

Файл: `backend/src/agents/agents/agents.service.ts`

Метод:

```startLine:endLine:backend/src/agents/agents/agents.service.ts
async handleUserMessage(
  payload: AgentUserMessagePayload,
): Promise<AgentBotMessagePayload> {
  // ...
}
```

Именно здесь происходит оркестрация диалога:

- вход: `AgentUserMessagePayload` c полями:
  - `conversationId` – идентификатор диалоговой сессии;
  - `userId?` – идентификатор пользователя;
  - `message` – текст запроса пользователя;
  - `metadata?` – произвольный JSON, который фронт/другие сервисы могут использовать для передачи структурированных команд.
- выход: `AgentBotMessagePayload` – то, что улетает по WebSocket обратно в комнату `conversation:<conversationId>`.

**Здесь и должен находиться основной роутинг “LLM → смарт‑контракты”:**

1. LLM (OpenAI) формирует ответ пользователю и, при необходимости, “tool‑call”/инструкцию для onchain‑действия.
2. `handleUserMessage` решает, какие сервисы блокчейна дергать.
3. Результаты onchain‑вызовов упаковываются в `context` ответа (поле `AgentBotMessagePayload.context`), чтобы фронт мог их отобразить.

---

### 2. Формат metadata / протокол команд от LLM к onchain‑слою

Поле `payload.metadata` можно использовать как **канал команд** от LLM‑агента к onchain‑сервисам.

Предлагаемый формат:

```ts
interface AgentCommandMetadata {
  action: string; // тип действия, например: 'create_escrow', 'release_payment', 'update_reputation', ...
  params?: Record<string, unknown>; // параметры действия
}
```

#### Примеры команд

- **Создать escrow при принятии ставки:**

```json
{
  "action": "create_escrow",
  "params": {
    "jobId": "job_123",
    "poster": "0xUSER...",
    "agent": "0xAGENT...",
    "amount": "10.000000"
  }
}
```

- **Выпустить выплату после approve результата:**

```json
{
  "action": "release_payment",
  "params": {
    "jobId": "job_123",
    "agent": "0xAGENT..."
  }
}
```

В будущем LLM может сам формировать такие структуры (через tool calling / JSON‑режим), либо они могут приходить с фронта, а агент только объясняет пользователю, что происходит.

---

### 3. Где вызывать конкретные блокчейн‑сервисы

После добавления onchain‑интеграции планируется использовать модули из `backend/src/blockchain`:

- `EscrowService` – создание и релиз escrow;
- `OrderBookService` – создание/обновление задач и ставок (если нужно что‑то делать напрямую onchain);
- `ReputationService` – обновление репутации агентов.

#### 3.1. Escrow

- Файл сервиса: `backend/src/blockchain/escrow/escrow.service.ts`
- Предполагаемые методы:
  - `createEscrow({ jobId, poster, agent, amount })`
  - `releasePayment({ jobId, agent, amount? })` (см. фактический интерфейс).

**Где вызывать:**

Внутри `AgentsService.handleUserMessage`:

```ts
switch (metadata.action) {
  case 'create_escrow':
    // вызвать EscrowService.createEscrow(...)
    break;
  case 'release_payment':
    // вызвать EscrowService.releasePayment(...)
    break;
}
```

Результат (`escrowTxHash`, `paymentTxHash`) положить в `context`:

```ts
return {
  conversationId: payload.conversationId,
  messageId: `agent-msg-${Date.now()}`,
  role: 'assistant',
  message: llmText,
  context: {
    escrowTxHash,
    jobId,
  },
};
```

#### 3.2. Order book / reputation

Аналогично, для действий:

- `action: "create_job"` / `action: "update_job"` → `OrderBookService`;
- `action: "update_reputation"` → `ReputationService`.

---

### 4. WebSocket‑слой и связь с агентом

Файл: `backend/src/websocket/websocket.gateway.ts`

Ключевой метод:

```startLine:endLine:backend/src/websocket/websocket.gateway.ts
@SubscribeMessage('agent_user_message')
async handleAgentUserMessage(
  @ConnectedSocket() client: Socket,
  @MessageBody() payload: AgentUserMessagePayload,
) {
  // ...
  const botReply = await this.agentsService.handleUserMessage(payload);
  this.server.to(room).emit('agent_bot_message', botReply);
}
```

Gateway:

- принимает от фронта `agent_user_message` (вместе с `metadata`);
- передаёт всё в `AgentsService.handleUserMessage`;
- отдаёт `agent_bot_message` в комнату `conversation:<conversationId>`.

**Важно:** WebSocket‑слой не должен напрямую работать со смарт‑контрактами. Всю onchain‑логика должна быть инкапсулирована в `AgentsService` и связанных с ним блокчейн‑сервисах.

---

### 5. План для разработчика onchain‑интеграции

1. **Вернуть зависимость от блокчейн‑модулей в `AgentsModule`:**
   - импортировать `BlockchainModule` и инжектить нужные сервисы (`EscrowService`, `OrderBookService`, `ReputationService`) в `AgentsService`.
2. **Расширить `AgentsService.handleUserMessage`:**
   - распарсить `payload.metadata` (либо результат tool‑calling от LLM);
   - в зависимости от `action` вызывать нужные методы onchain‑сервисов;
   - складывать результаты в `context` ответа.
3. **(Опционально) Добавить поддержку tool calling в OpenAI:**
   - описать функции (`create_escrow`, `release_payment`, ...),
   - дать модели право вызывать эти функции,
   - на бэкенде обрабатывать `tool_calls` и маршрутизировать их на блокчейн‑сервисы.

До тех пор, пока это не реализовано, агент работает только как LLM‑чат (диалог и объяснения), без реальных onchain‑действий.


