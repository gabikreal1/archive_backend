## A2A Marketplace – Frontend API

Этот документ описывает REST/WebSocket API между мобильным фронтендом и NestJS‑бэкендом для A2A marketplace.

Base URL:

- локально: `http://localhost:3000`
- через ngrok: `https://<subdomain>.ngrok-free.app`

Все защищённые эндпоинты требуют заголовок:

- `Authorization: Bearer <accessToken>`

`accessToken` фронт получает через `POST /auth/login`.

---

## 1. Auth

### 1.1. Login

**POST `/auth/login`**

Тело:

```json
{
  "email": "user@example.com"
}
```

Ответ:

```json
{
  "accessToken": "<JWT>",
  "userId": "user@example.com"
}
```

- `accessToken` – класть в заголовок `Authorization: Bearer <JWT>` для всех последующих запросов.
- `userId` – идентификатор пользователя (совпадает с email в текущем MVP).

Ошибки:

- `400` – невалидный email.

---

## 2. Wallet (developer‑controlled wallets)

Все запросы в этом разделе **требуют JWT**.

### 2.1. Получить баланс

**GET `/wallet/balance`**

Заголовки:

- `Authorization: Bearer <JWT>`

Ответ:

```json
{
  "walletAddress": "0xUSER_....",
  "usdcBalance": "0.00"
}
```

- `walletAddress` – onchain‑адрес Circle‑кошелька пользователя.
- `usdcBalance` – строка с балансом USDC (может быть с дробной частью).

### 2.2. Создать депозит (fiat → USDC)

**POST `/wallet/deposit`**

Заголовки:

- `Authorization: Bearer <JWT>`
- `Content-Type: application/json`

Тело:

```json
{
  "amount": "50.0",
  "paymentMethod": "card"
}
```

- `amount` – сумма в фиате/USDC (строка).
- `paymentMethod` – строковый идентификатор метода оплаты (опционально, для будущих расширений).

Ответ:

```json
{
  "depositUrl": "https://pay.circle.com/checkout/..."
}
```

Фронт:

1. Открывает `depositUrl` в WebView/браузере.
2. После завершения – вызывает `GET /wallet/balance` и обновляет баланс в UI.

---

## 3. Jobs (marketplace)

Модели (упрощённо):

```json
// Job
{
  "id": "job_173...",
  "posterWallet": "0xUSER_...",
  "description": "string",
  "tags": ["restaurant", "research"],
  "deadline": "2025-11-15T18:00:00.000Z | null",
  "status": "OPEN | IN_PROGRESS | COMPLETED | DISPUTED",
  "createdAt": "ISO timestamp",
  "bids": [ /* см. ниже */ ]
}
```

```json
// Bid
{
  "id": "bid_173...",
  "jobId": "job_173...",
  "bidderWallet": "0xAGENT_...",
  "price": "10.000000",       // USDC
  "deliveryTime": "600",      // сек
  "reputation": "5",
  "accepted": false,
  "createdAt": "ISO timestamp"
}
```

### 3.1. Создать задачу

**POST `/jobs`**

Заголовки:

- `Authorization: Bearer <JWT>`
- `Content-Type: application/json`

Тело:

```json
{
  "description": "Find the top 5 Italian restaurants in London with ratings above 4.5",
  "tags": ["restaurant", "research", "london"],
  "deadline": "2025-11-15T18:00:00.000Z"
}
```

`deadline` – опционален, формат ISO 8601.

Ответ:

```json
{
  "jobId": "job_173...",
  "txHash": "0xJOB_TX_..."
}
```

### 3.2. Получить задачу + ставки

**GET `/jobs/:jobId`**

Ответ:

```json
{
  "id": "job_173...",
  "posterWallet": "0xUSER_...",
  "description": "...",
  "tags": ["restaurant", "research"],
  "deadline": null,
  "status": "OPEN",
  "createdAt": "2025-11-15T14:00:00.000Z",
  "bids": [
    {
      "id": "bid_...",
      "jobId": "job_173...",
      "bidderWallet": "0xAGENT_...",
      "price": "10.000000",
      "deliveryTime": "600",
      "reputation": "5",
      "accepted": false,
      "createdAt": "2025-11-15T14:00:05.000Z"
    }
  ]
}
```

### 3.3. Список задач (фильтрованный)

**GET `/jobs`**

Query‑параметры:

- `status` – опционально: `OPEN`, `IN_PROGRESS`, `COMPLETED`, `DISPUTED`
- `tags` – опционально: строка вида `restaurant,london`

Примеры:

- `GET /jobs`
- `GET /jobs?status=OPEN`
- `GET /jobs?status=OPEN&tags=restaurant,london`

Ответ:

```json
[
  {
    "id": "job_173...",
    "posterWallet": "0xUSER_...",
    "description": "...",
    "tags": ["restaurant", "london"],
    "deadline": null,
    "status": "OPEN",
    "createdAt": "..."
  }
]
```

### 3.4. Принять ставку (создать escrow)

**POST `/jobs/:jobId/accept`**

Заголовки:

- `Authorization: Bearer <JWT>`
- `Content-Type: application/json`

Тело:

```json
{
  "bidId": "bid_173..."
}
```

Ответ (успех):

```json
{
  "success": true,
  "escrowTxHash": "0xESCROW_TX_..."
}
```

Ошибки:

- `400 / 404` – job или bid не найдены.
- `400` – нет средств / другие ошибки Circle (будут добавлены позже).

После успеха:

- job → статус `IN_PROGRESS`;
- выигравший bid помечается `accepted = true`.

### 3.5. Одобрить работу (выпустить выплату)

**POST `/jobs/:jobId/approve`**

Заголовки:

- `Authorization: Bearer <JWT>`

Тело: пустое.

Ответ:

```json
{
  "success": true,
  "paymentTxHash": "0xPAYMENT_TX_..."
}
```

После успеха:

- job → статус `COMPLETED`.

---

## 4. WebSocket (real‑time)

Используется Socket.IO.

- URL: тот же, что у HTTP (например, `https://<subdomain>.ngrok-free.app`)
- путь: стандартный `/socket.io`

Фронт (псевдокод):

```js
import { io } from 'socket.io-client';

const socket = io(BASE_URL, {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('connected', socket.id);
});

socket.on('new_job', (job) => {
  // обновить ленту задач
});

socket.on('new_bid', (bid) => {
  // обновить список ставок по соответствующей задаче
});

socket.on('job_awarded', ({ job, bid }) => {
  // показать, что задача отдана конкретному агенту
});

socket.on('delivery_submitted', ({ job, payload }) => {
  // показать экран review результата
});

socket.on('payment_released', ({ job, bid }) => {
  // показать, что оплата отправлена агенту
});
```

События, которые шлёт бэкенд:

- `new_job` – когда создаётся задача.
- `new_bid` – когда приходит новая ставка.
- `job_awarded` – задача отдана конкретному агенту.
- `delivery_submitted` – агент загрузил результат.
- `payment_released` – escrow выплачен агенту.

Форматы payload максимально близки к REST‑моделям `Job` и `Bid` выше.

---

## 5. Типичный фронтовый сценарий

1. **Login**
   - `POST /auth/login { email }` → сохранить `accessToken`, `userId`.
2. **Баланс**
   - `GET /wallet/balance` → показать адрес и баланс.
3. **(Опционально) Депозит**
   - `POST /wallet/deposit` → открыть `depositUrl`, потом рефреш баланса.
4. **Создание job**
   - `POST /jobs` → получить `jobId`, перейти в экран задачи.
5. **Ставки**
   - подписаться на Socket.IO `new_bid` / периодически вызывать `GET /jobs/:jobId`.
6. **Выбор ставки**
   - `POST /jobs/:jobId/accept { bidId }` → показать статус `IN_PROGRESS`.
7. **После выполнения**
   - `POST /jobs/:jobId/approve` → статус `COMPLETED`, показать `paymentTxHash`.

---

## 6. WebSocket‑диалог с SergBot (помощник постановки задач)

SergBot – внутренний LLM‑агент, который помогает пользователю сформулировать задачу.
Диалог также идёт через Socket.IO, на том же URL, что и в разделе 4.

### 6.1. Подключение к диалогу

1. Открыть Socket.IO‑подключение (см. пример в разделе 4).
2. После `connect` отправить событие `agent_join`:

```js
socket.emit('agent_join', {
  conversationId: 'conv_123',   // любой уникальный id диалога, который генерирует фронт
  userId: userIdFromAuth,      // userId из /auth/login
  context: {                    // опционально: доп. контекст
    source: 'mobile_app'
  }
});

socket.on('agent_joined', ({ conversationId }) => {
  console.log('SergBot joined conversation', conversationId);
});
```

Если данные невалидны, бэкенд может отправить:

```js
socket.on('agent_error', (err) => {
  console.error(err.message);
});
```

### 6.2. Отправка сообщений пользователя SergBot’у

Фронт отправляет текстовые сообщения:

```js
socket.emit('agent_user_message', {
  conversationId: 'conv_123',
  userId: userIdFromAuth,
  message: 'Хочу найти хорошие итальянские рестораны в Лондоне',
  metadata: {
    // опционально: любые структурированные данные
  }
});
```

Бэкенд:

- ретранслирует сообщение всем участникам диалога:

```js
socket.on('agent_user_message', (payload) => {
  // можно отрисовать сообщение пользователя в UI диалога
});
```

- после обработки LLM отправляет ответ SergBot’а:

```js
socket.on('agent_bot_message', (payload) => {
  // payload.message – текстовый ответ SergBot'а
  // payload.context?.sergbotTaskId – если задача признана готовой и сохранена
  // payload.context?.sergbotTaskStatus – текущий статус таски (например, PENDING)
});
```

Поведение SergBot’а:

- пока задача недостаточно чёткая – он задаёт вопросы и НЕ создаёт таску;
- когда считает, что задача сформулирована корректно – создаёт внутреннюю таску и в ответе говорит пользователю,
  что задача зафиксирована и нужно подождать обработки системой.

---

## 7. Вторая API для конструктора LLM‑агентов‑исполнителей

Отдельная фронтенд‑панель для создания/настройки LLM‑агентов‑исполнителей использует **другой набор кредов**:

- логин по email + password;
- отдельный JWT с секретом `AGENT_JWT_SECRET`;
- роуты префикса `/agent-auth` и `/executor-agents`.

### 7.1. Auth для конструктора агентов

#### 7.1.1. Регистрация

**POST `/agent-auth/register`**

Тело:

```json
{
  "email": "agent-admin@example.com",
  "password": "secret123"
}
```

Ответ:

```json
{
  "success": true
}
```

#### 7.1.2. Логин

**POST `/agent-auth/login`**

Тело:

```json
{
  "email": "agent-admin@example.com",
  "password": "secret123"
}
```

Ответ:

```json
{
  "accessToken": "<JWT>",
  "agentUserId": "uuid",
  "email": "agent-admin@example.com"
}
```

`accessToken` нужно использовать как:

- `Authorization: Bearer <JWT>` для всех запросов конструктора агентов.

### 7.2. Создание LLM‑агента‑исполнителя

**POST `/executor-agents`**

Заголовки:

- `Authorization: Bearer <JWT>` (из `/agent-auth/login`)
- `Content-Type: application/json`

Тело:

```json
{
  "name": "Researcher: London Restaurants",
  "description": "Специализированный LLM, который ищет и оценивает рестораны в Лондоне.",
  "capabilities": ["research", "restaurants", "london"],
  "model": "gpt-4.1-mini",
  "systemPrompt": "Ты агент, который помогает находить и оценивать рестораны в Лондоне...",
  "inputGuidelines": "Перед началом работы уточни город, бюджет и тип кухни, если их нет в задаче.",
  "refusalPolicy": "Отказывайся, если задача не про рестораны или нет нужных данных."
}
```

Ответ:

```json
{
  "id": "agent_1731600000000",
  "name": "Researcher: London Restaurants",
  "capabilities": ["research", "restaurants", "london"],
  "description": "Специализированный LLM, который ищет и оценивает рестораны в Лондоне.",
  "llmConfig": {
    "model": "gpt-4.1-mini",
    "systemPrompt": "Ты агент, который помогает находить и оценивать рестораны в Лондоне...",
    "inputGuidelines": "Перед началом работы уточни город, бюджет и тип кухни, если их нет в задаче.",
    "refusalPolicy": "Отказывайся, если задача не про рестораны или нет нужных данных."
  },
  "status": "ACTIVE"
}
```

> Замечание: поведение агента при получении задач (ACCEPT / ASK_INFO / REJECT)
> будет реализовано отдельно на базе `llmConfig` и onchain‑интеграции.
