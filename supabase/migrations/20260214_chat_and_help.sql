-- =====================================================
-- Chat Conversations & Messages
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  account_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_updated ON chat_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(conversation_id, created_at);

-- =====================================================
-- Knowledge Base Articles
-- =====================================================

CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'getting-started',
    'copy-script',
    'audio',
    'video',
    'render',
    'troubleshooting',
    'account',
    'remotion'
  )),
  tags TEXT[] DEFAULT '{}',
  sort_order INT DEFAULT 0,
  published BOOLEAN DEFAULT true,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_help_articles_category ON help_articles(category) WHERE published = true;
CREATE INDEX idx_help_articles_slug ON help_articles(slug);

-- Full-text search index (Spanish)
CREATE INDEX idx_help_articles_search ON help_articles
  USING GIN (to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,'')));

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

-- Conversations: users see only their own
CREATE POLICY "Users can view own conversations"
  ON chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON chat_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages: users see messages in their own conversations
CREATE POLICY "Users can view own messages"
  ON chat_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM chat_conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM chat_conversations WHERE user_id = auth.uid()
  ));

-- Help articles: readable by all authenticated users
CREATE POLICY "Authenticated users can read published articles"
  ON help_articles FOR SELECT
  USING (auth.role() = 'authenticated' AND published = true);

-- Service role: full access (for API routes using service role key)
CREATE POLICY "Service role full access conversations"
  ON chat_conversations FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Service role full access messages"
  ON chat_messages FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Service role full access articles"
  ON help_articles FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');
