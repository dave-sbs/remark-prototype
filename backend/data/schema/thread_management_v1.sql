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
