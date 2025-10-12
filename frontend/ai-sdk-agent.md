# Vercel AI SDK Chatbot - Incremental Implementation

## Implementation Strategy

Build and test in layers:

1. **Phase 1**: UI + Basic Chat (no tools, simple assistant)
2. **Phase 2**: Port Python Agent (tools, state, catalog pre-loading)
3. **Phase 3**: Database & Thread Management (tracing, persistence, timeouts)

This way we can verify each layer works before adding complexity.

---

## Phase 1: Frontend UI + Basic Chat

**Goal:** Get a working chat widget with simple AI responses (no tools yet)

### 1.1 Install Dependencies

```bash
cd frontend
npm install ai @ai-sdk/openai
```

### 1.2 Create Basic Chat API Route

File: `frontend/app/api/chat/route.ts`

**Simple version** - just OpenAI, no tools:

```typescript
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages,
    system: 'You are a helpful Herman Miller furniture sales assistant. Be friendly and concise.',
  })
  
  return result.toDataStreamResponse()
}
```

No state management, no tools, no database - just streaming chat.

### 1.3 Create Chat Widget Component

File: `frontend/app/components/ChatWidget.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'
import ChatMessage from './ChatMessage'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  })
  
  return (
    <>
      {/* Floating button (closed state) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-black text-white rounded-full shadow-xl hover:bg-gray-800 transition-colors z-50 flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
      
      {/* Chat panel (open state) */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-full md:w-[420px] max-w-[420px] h-[600px] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl">
            <div>
              <h3 className="font-semibold text-lg">Remark Studio</h3>
              <p className="text-xs text-gray-500">Ask about our furniture</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="4" x2="4" y2="12" />
                <line x1="4" y1="4" x2="12" y2="12" />
              </svg>
            </button>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                <p className="mb-2">👋 Hi! How can I help you today?</p>
                <p className="text-xs">Ask me about our chairs, pricing, or anything else.</p>
              </div>
            ) : (
              messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))
            )}
            {isLoading && (
              <div className="flex gap-2">
                <div className="bg-[#f5f1eb] px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about our chairs..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
```

### 1.4 Create Message Component

File: `frontend/app/components/ChatMessage.tsx`

```typescript
import { Message } from 'ai'

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>
      <div className={`
        max-w-[80%] px-4 py-3 text-sm
        ${isUser 
          ? 'bg-[#2b2b2b] text-white rounded-2xl rounded-br-md' 
          : 'bg-[#f5f1eb] text-gray-900 rounded-2xl rounded-bl-md'
        }
      `}>
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  )
}
```

### 1.5 Add ChatWidget to Main Page

File: `frontend/app/page.tsx`

Add the import at the top:

```typescript
import ChatWidget from './components/ChatWidget'
```

Add at the very end, right before the closing `</main>` tag:

```typescript
<ChatWidget />
```

### 1.6 Environment Variables

Add to `frontend/.env.local`:

```
OPENAI_API_KEY=sk-...
```

### 1.7 Test Phase 1

**What to test:**

- ✅ Chat widget button appears bottom-right
- ✅ Clicking opens chat panel
- ✅ Can send messages and get AI responses
- ✅ Messages display correctly (user right, assistant left)
- ✅ Loading indicator shows while AI responds
- ✅ Can close and reopen chat

**This phase has NO:**

- ❌ Tools/tool calling
- ❌ Product catalog pre-loading
- ❌ State management
- ❌ Database persistence
- ❌ Thread management

---

## Phase 2: Port Python Agent (Tools & State)

**Goal:** Replace basic chat with your sophisticated Python agent

### 2.1 Install Zod for Tool Schemas

```bash
npm install zod
```

### 2.2 Port Python Tools to TypeScript

File: `frontend/lib/agent-tools.ts`

Port from `backend/graph/search_tools/simplified_toolkit.py`:

```typescript
import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const getProductCatalog = tool({
  description: 'Get complete product catalog with basic info and price ranges',
  parameters: z.object({}),
  execute: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('name, description, product_base_prices(base_price)')
    
    if (error) throw error
    
    // Format similar to Python version
    let catalog = "# Available Products\n\n"
    data?.forEach(product => {
      catalog += `## ${product.name}\n`
      catalog += `${product.description}\n`
      catalog += `Base Price: $${product.product_base_prices?.[0]?.base_price || 'N/A'}\n\n`
    })
    
    return catalog
  }
})

export const getProductDetails = tool({
  description: 'Get comprehensive details about a specific product including variants, colors, materials',
  parameters: z.object({
    product_name: z.string().describe('Name of the product to get details for')
  }),
  execute: async ({ product_name }) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_specifications(*), product_base_prices(*)')
      .ilike('name', `%${product_name}%`)
      .single()
    
    if (error || !data) return `Product "${product_name}" not found`
    
    // Format details
    let details = `# ${data.name}\n\n${data.description}\n\n`
    details += `## Specifications\n`
    data.product_specifications?.forEach((spec: any) => {
      details += `- ${spec.spec_name}: ${spec.spec_value}\n`
    })
    
    return details
  }
})

export const getAllBasePrices = tool({
  description: 'Get all products sorted by price from low to high',
  parameters: z.object({}),
  execute: async () => {
    const { data, error } = await supabase
      .from('product_base_prices')
      .select('base_price, products(name)')
      .order('base_price', { ascending: true })
    
    if (error) throw error
    
    let priceList = "# Products by Price\n\n"
    data?.forEach((item: any) => {
      priceList += `- ${item.products?.name}: $${item.base_price}\n`
    })
    
    return priceList
  }
})

export const getProductUniqueFeatures = tool({
  description: 'Get key differentiators and unique features for a specific product',
  parameters: z.object({
    product_name: z.string().describe('Product name to get unique features for')
  }),
  execute: async ({ product_name }) => {
    const { data, error } = await supabase
      .from('product_features')
      .select('*')
      .ilike('product_name', `%${product_name}%`)
    
    if (error || !data?.length) return `No unique features found for "${product_name}"`
    
    let features = `# Unique Features: ${product_name}\n\n`
    data.forEach((feature: any) => {
      features += `- ${feature.feature_name}: ${feature.feature_description}\n`
    })
    
    return features
  }
})
```

### 2.3 Create Agent State Management

File: `frontend/lib/agent-state.ts`

```typescript
export type AgentState = {
  threadId: string
  productCatalogContext: string | null
  discoveredPainPoints: string[]
  discoveredBudgetRange: string | null
  productsDiscussed: string[]
}

const threadStates = new Map<string, AgentState>()

export function getThreadState(threadId: string): AgentState {
  if (!threadStates.has(threadId)) {
    threadStates.set(threadId, {
      threadId,
      productCatalogContext: null,
      discoveredPainPoints: [],
      discoveredBudgetRange: null,
      productsDiscussed: []
    })
  }
  return threadStates.get(threadId)!
}

export function updateThreadState(threadId: string, updates: Partial<AgentState>) {
  const state = getThreadState(threadId)
  threadStates.set(threadId, { ...state, ...updates })
}
```

### 2.4 Port Sales Agent Prompt

File: `frontend/lib/prompts.ts`

Copy from `backend/graph/prompts.py` lines 371-468:

```typescript
export const SALES_AGENT_PROMPT = `You are an expert Herman Miller sales consultant helping customers find the perfect office chair.

# Your Core Mission
Quickly understand the customer's **pain points** and **willingness to pay**, then guide them to the right product decision.

# Customer Psychology Framework
Every customer has:
1. **Pain Points** - Problems they need solved
   - Functional needs (back pain, long hours, adjustability)
   - Aesthetic wants (modern, classic, executive look)
   - Social validation (brand recognition, status)

2. **Budget Constraints** - Their willingness to pay
   - Maximum price range (explicit or implicit)
   - Value perception
   - ROI considerations

# Tool Usage Strategy

**Available Tools:**
- get_product_catalog() - All products with prices (AUTO-CALLED on first message)
- get_product_details(product_name) - Full features for specific product
- get_all_base_prices() - All products sorted by price
- get_product_unique_features(product_name) - Key differentiators

**When to Call Tools:**
- First message: Catalog is AUTO-LOADED into your context
- Specific product questions → get_product_details(product_name)
- Budget/price shopping → get_all_base_prices()
- Comparison/uniqueness → get_product_unique_features(product_name)

**Don't call tools when:**
- You can answer from the catalog context (product names, price tiers)
- Making general conversation
- Asking discovery questions

# Conversation Strategy

## Phase 1: Discovery (Messages 1-3)
**Goals:** Understand use case, surface needs, gauge budget

**Tactics:**
- Ask open-ended questions: "What brings you in today?"
- Listen for pain signals: "back pain", "uncomfortable", "long hours"
- Probe budget indirectly: "Have you looked at any chairs yet?"

## Phase 2: Guided Consideration (Messages 4-7)
**Goals:** Present 2-3 relevant options, differentiate clearly

**Tactics:**
- Narrow focus: "Based on your needs, I'd suggest..."
- Compare options head-to-head
- Anchor on value, not just price

## Phase 3: Decision Support (Messages 8+)
**Goals:** Address concerns, reinforce fit, handle objections

**Tactics:**
- Validate choice: "The [product] is perfect for..."
- Summarize fit: "Here's why this works for you..."
- Call to action when appropriate

# Key Principles
- Be conversational and consultative, not pushy
- Focus on their needs, not product features (until relevant)
- Use tools strategically, not excessively
- Build trust through expertise and empathy
`
```

### 2.5 Update API Route with Agent Logic

File: `frontend/app/api/chat/route.ts`

Replace the simple version with full agent:

```typescript
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { 
  getProductCatalog, 
  getProductDetails, 
  getAllBasePrices, 
  getProductUniqueFeatures 
} from '@/lib/agent-tools'
import { getThreadState, updateThreadState } from '@/lib/agent-state'
import { SALES_AGENT_PROMPT } from '@/lib/prompts'

export async function POST(req: Request) {
  const { messages, threadId } = await req.json()
  
  // Use threadId or create temporary one
  const activeThreadId = threadId || crypto.randomUUID()
  const state = getThreadState(activeThreadId)
  
  // Pre-load product catalog on first message (like Python agent)
  if (!state.productCatalogContext) {
    try {
      const catalog = await getProductCatalog.execute({})
      state.productCatalogContext = `\n\n# PRODUCT CATALOG (Your Context)\n\n${catalog}\n\n---\n\n`
      updateThreadState(activeThreadId, { productCatalogContext: state.productCatalogContext })
    } catch (error) {
      console.error('Failed to load catalog:', error)
      state.productCatalogContext = '\n\n# PRODUCT CATALOG\n\nError loading catalog\n\n---\n\n'
    }
  }
  
  // Build system prompt with catalog context (replicating Python)
  const systemPrompt = state.productCatalogContext + SALES_AGENT_PROMPT
  
  // Stream with tools (replicates Python's model_with_tools)
  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages,
    system: systemPrompt,
    tools: {
      get_product_catalog: getProductCatalog,
      get_product_details: getProductDetails,
      get_all_base_prices: getAllBasePrices,
      get_product_unique_features: getProductUniqueFeatures,
    },
    maxSteps: 5, // Multi-step tool calling like Python
    temperature: 0.7,
  })
  
  return result.toDataStreamResponse()
}
```

### 2.6 Update ChatWidget to Pass ThreadId

File: `frontend/app/components/ChatWidget.tsx`

Add threadId generation:

```typescript
const [threadId, setThreadId] = useState<string>()

useEffect(() => {
  // Generate thread ID on mount
  setThreadId(crypto.randomUUID())
}, [])

// Update useChat hook
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: { threadId }, // Pass threadId to API
})
```

### 2.7 Add Supabase Environment Variables

Update `frontend/.env.local`:

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2.8 Test Phase 2

**What to test:**

- ✅ Product catalog loads automatically on first message
- ✅ Agent uses tools when appropriate (e.g., "Tell me about Aeron")
- ✅ Agent follows sales strategy (discovery → recommendation)
- ✅ Tool calls work and return Supabase data
- ✅ State persists across messages in same thread

---

## Phase 3: Database Tracing & Thread Management

**Goal:** Add conversation persistence and lifecycle management

### 3.1 Create Supabase Migration

File: `backend/supabase/migrations/20250111_chat_threads.sql`

```sql
-- Chat threads (metadata)
CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_chat_threads_ip ON chat_threads(ip_address);
CREATE INDEX idx_chat_threads_status ON chat_threads(status);
CREATE INDEX idx_chat_threads_last_activity ON chat_threads(last_activity_at);

-- Chat messages (full conversation history for tracing)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL REFERENCES chat_threads(thread_id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tool call tracking
  tool_calls JSONB,
  tool_results JSONB,
  
  -- Agent state snapshot
  agent_state JSONB,
  
  -- Token usage
  tokens_used INTEGER,
  model_used TEXT,
  
  sequence_number INTEGER
);

CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id, sequence_number);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- View for LangGraph export
CREATE VIEW langraph_export_format AS
SELECT 
  t.thread_id,
  t.created_at as thread_created_at,
  t.status,
  jsonb_agg(
    jsonb_build_object(
      'type', m.role,
      'content', m.content,
      'tool_calls', m.tool_calls,
      'timestamp', m.created_at,
      'tokens', m.tokens_used
    ) ORDER BY m.sequence_number
  ) as messages
FROM chat_threads t
LEFT JOIN chat_messages m ON t.thread_id = m.thread_id
GROUP BY t.thread_id, t.created_at, t.status;
```

### 3.2 Update API Route to Log Messages

Add to `frontend/app/api/chat/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// After streaming starts, log to database
const clientIP = req.headers.get('x-forwarded-for') || 'unknown'

await supabase.from('chat_threads').upsert({
  thread_id: activeThreadId,
  ip_address: clientIP,
  last_activity_at: new Date().toISOString(),
  status: 'active'
})

// Log each message
let sequenceNum = messages.length
for (const msg of messages) {
  await supabase.from('chat_messages').insert({
    thread_id: activeThreadId,
    message_id: msg.id,
    role: msg.role,
    content: msg.content,
    sequence_number: sequenceNum++,
    agent_state: state,
  })
}
```

### 3.3 Add Thread Timeout Logic

Update `ChatWidget.tsx`:

```typescript
const [lastActivity, setLastActivity] = useState(Date.now())

useEffect(() => {
  // Load from localStorage
  const stored = localStorage.getItem('remark_chat_thread')
  const activity = localStorage.getItem('remark_last_activity')
  
  if (stored && activity) {
    const timeSince = Date.now() - parseInt(activity)
    if (timeSince < 5 * 60 * 1000) {
      setThreadId(stored)
    } else {
      startNewThread()
    }
  } else {
    startNewThread()
  }
}, [])

// Check for timeout every minute
useEffect(() => {
  const interval = setInterval(() => {
    const activity = localStorage.getItem('remark_last_activity')
    if (activity && Date.now() - parseInt(activity) >= 5 * 60 * 1000) {
      startNewThread()
    }
  }, 60000)
  
  return () => clearInterval(interval)
}, [])

const startNewThread = () => {
  const newId = crypto.randomUUID()
  setThreadId(newId)
  localStorage.setItem('remark_chat_thread', newId)
  localStorage.setItem('remark_last_activity', Date.now().toString())
}

// Update activity on message
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: { threadId },
  onFinish: () => {
    localStorage.setItem('remark_last_activity', Date.now().toString())
  }
})
```

### 3.4 Test Phase 3

**What to test:**

- ✅ Conversations logged to Supabase
- ✅ Thread persists across page refreshes (< 5 min)
- ✅ Thread expires after 5 minutes of inactivity
- ✅ Can export conversation data via `langraph_export_format` view
- ✅ Tool calls traced in database

---

## Summary

**Phase 1** (Start here): Basic UI + simple chat

**Phase 2**: Add Python agent capabilities

**Phase 3**: Add persistence + lifecycle

Each phase builds on the previous and can be tested independently!