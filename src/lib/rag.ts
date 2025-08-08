import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Supabase client for RAG operations (with service role key for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS!,
});

// Document interface
export interface Document {
  id?: number;
  title: string;
  content: string;
  category: string;
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
}

// Search result interface
export interface SearchResult {
  id: number;
  title: string;
  content: string;
  category: string;
  similarity: number;
}

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' '),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Split text into chunks for better embedding
 */
export function splitTextIntoChunks(text: string, maxChunkSize: number = 500): string[] {
  const sentences = text.split(/[.!?。！？]\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter(chunk => chunk.trim().length > 0);
}

/**
 * Store document with embedding in Supabase
 */
export async function storeDocument(document: Document): Promise<void> {
  try {
    // Generate embedding for the content
    const embedding = await generateEmbedding(document.content);

    // Store in Supabase
    const { error } = await supabaseAdmin
      .from('documents')
      .insert({
        title: document.title,
        content: document.content,
        category: document.category,
        embedding: embedding,
      });

    if (error) {
      console.error('Error storing document:', error);
      throw new Error(`Failed to store document: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in storeDocument:', error);
    throw error;
  }
}

/**
 * Store multiple documents with chunking
 */
export async function storeDocumentWithChunks(
  title: string,
  content: string,
  category: string
): Promise<void> {
  try {
    const chunks = splitTextIntoChunks(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkTitle = chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title;
      await storeDocument({
        title: chunkTitle,
        content: chunks[i],
        category: category,
      });
    }
  } catch (error) {
    console.error('Error storing document with chunks:', error);
    throw error;
  }
}

/**
 * Search for similar documents
 */
export async function searchSimilarDocuments(
  query: string,
  matchThreshold: number = 0.7,
  matchCount: number = 3
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar documents using the match_documents function
    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('Error searching documents:', error);
      throw new Error(`Failed to search documents: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchSimilarDocuments:', error);
    throw error;
  }
}

/**
 * Get all documents by category
 */
export async function getDocumentsByCategory(category: string): Promise<Document[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents by category:', error);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDocumentsByCategory:', error);
    throw error;
  }
}

/**
 * Delete document by ID
 */
export async function deleteDocument(id: number): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    throw error;
  }
}
