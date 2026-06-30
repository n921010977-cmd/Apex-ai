import { createClient } from "@/lib/supabase/server";

export interface MemoryChunk {
  id: string;
  content: string;
  similarity: number;
}

export async function searchMemory({
  organizationId,
  query,
  topK = 5,
}: {
  organizationId: string;
  query: string;
  topK?: number;
}): Promise<MemoryChunk[]> {
  const embedding = await getEmbedding(query);
  if (!embedding) return [];

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // pgvector similarity search
  const { data, error } = await db.rpc("search_memory", {
    query_embedding: embedding,
    org_id: organizationId,
    match_count: topK,
  });

  if (error || !data) return [];
  return data.map((row: { id: string; content: string; similarity: number }) => ({
    id: row.id,
    content: row.content,
    similarity: row.similarity,
  }));
}

export async function saveMemory({
  organizationId,
  userId,
  conversationId,
  content,
  agentId,
}: {
  organizationId: string;
  userId: string;
  conversationId: string;
  content: string;
  agentId?: string;
}): Promise<void> {
  const embedding = await getEmbedding(content);
  if (!embedding) return;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  await db.from("agent_memory_chunks").insert({
    organization_id: organizationId,
    agent_id: agentId ?? null,
    user_id: userId,
    conversation_id: conversationId,
    content,
    embedding,
    metadata: { source: "conversation" },
  });
}

export async function clearMemory({
  organizationId,
  conversationId,
}: {
  organizationId: string;
  conversationId?: string;
}): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db.from("agent_memory_chunks").delete().eq("organization_id", organizationId);
  if (conversationId) query = query.eq("conversation_id", conversationId);
  await query;
}

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    // Use OpenAI embeddings if available, otherwise skip
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return null;

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ input: text.slice(0, 8000), model: "text-embedding-3-small" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}
