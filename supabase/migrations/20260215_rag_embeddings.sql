-- =====================================================
-- RAG: pgvector + embeddings + conversation memory
-- =====================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding columns to help_articles
ALTER TABLE help_articles ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE help_articles ADD COLUMN IF NOT EXISTS needs_embedding BOOLEAN DEFAULT true;

-- 3. Vector similarity search index (IVFFlat for small datasets)
-- Note: IVFFlat needs at least lists*10 rows to build properly.
-- With 15 articles and lists=5, this is fine. Switch to HNSW if >1000 articles.
CREATE INDEX IF NOT EXISTS idx_help_articles_embedding
  ON help_articles USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 5);

-- 4. Semantic search function for help articles
CREATE OR REPLACE FUNCTION search_help_articles_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.45,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  summary text,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ha.id,
    ha.slug,
    ha.title,
    ha.summary,
    ha.content,
    ha.category,
    (1 - (ha.embedding <=> query_embedding))::float AS similarity
  FROM help_articles ha
  WHERE ha.published = true
    AND ha.embedding IS NOT NULL
    AND (1 - (ha.embedding <=> query_embedding)) > match_threshold
  ORDER BY ha.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- Conversation Summaries (cross-conversation memory)
-- =====================================================

CREATE TABLE IF NOT EXISTS conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT,
  summary TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  embedding vector(1536),
  message_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_summaries_user ON conversation_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_summaries_conv ON conversation_summaries(conversation_id);

-- Vector search index for conversation memories
CREATE INDEX IF NOT EXISTS idx_conv_summaries_embedding
  ON conversation_summaries USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

-- Search past conversation memories by semantic similarity
CREATE OR REPLACE FUNCTION search_conversation_memory(
  p_user_id uuid,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.6,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  summary text,
  topics text[],
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.conversation_id,
    cs.summary,
    cs.topics,
    (1 - (cs.embedding <=> query_embedding))::float AS similarity,
    cs.created_at
  FROM conversation_summaries cs
  WHERE cs.user_id = p_user_id
    AND cs.embedding IS NOT NULL
    AND (1 - (cs.embedding <=> query_embedding)) > match_threshold
  ORDER BY cs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- Row Level Security for conversation_summaries
-- =====================================================

ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries"
  ON conversation_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON conversation_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access summaries"
  ON conversation_summaries FOR ALL
  USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');
