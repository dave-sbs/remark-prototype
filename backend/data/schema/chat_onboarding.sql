-- Chat threads (metadata)
CREATE TABLE chat_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT UNIQUE NOT NULL,
  user_name TEXT,
  user_email TEXT,
  user_query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_onboarding_thread_id ON chat_onboarding(thread_id);
CREATE INDEX idx_chat_onboarding_user_name ON chat_onboarding(user_name);
CREATE INDEX idx_chat_onboarding_user_email ON chat_onboarding(user_email);
CREATE INDEX idx_chat_onboarding_user_query ON chat_onboarding(user_query);
CREATE INDEX idx_chat_onboarding_created_at ON chat_onboarding(created_at);