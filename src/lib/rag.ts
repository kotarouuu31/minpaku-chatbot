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
    console.log('[RAG-LIB] Starting search for:', query);
    console.log('[RAG-LIB] Parameters:', { matchThreshold, matchCount });
    
    // Check environment variables
    console.log('[RAG-LIB] Environment check:');
    console.log('[RAG-LIB] SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('[RAG-LIB] SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
    console.log('[RAG-LIB] OPENAI_API_KEY_FOR_EMBEDDINGS:', process.env.OPENAI_API_KEY_FOR_EMBEDDINGS ? 'SET' : 'NOT SET');

    // Generate embedding for the query
    console.log('[RAG-LIB] Generating embedding...');
    const queryEmbedding = await generateEmbedding(query);
    console.log('[RAG-LIB] Embedding generated, length:', queryEmbedding.length);

    // Search for similar documents using the match_documents function
    console.log('[RAG-LIB] Calling match_documents function...');
    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('[RAG-LIB] Supabase RPC error:', error);
      throw new Error(`Failed to search documents: ${error.message}`);
    }

    console.log('[RAG-LIB] Search completed, results count:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('[RAG-LIB] First result:', {
        title: data[0].title,
        category: data[0].category,
        similarity: data[0].similarity
      });
    }

    return data || [];
  } catch (error) {
    console.error('[RAG-LIB] Error in searchSimilarDocuments:', error);
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
    console.log('Deleting document with ID:', id);
    
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }

    console.log('Document deleted successfully');
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    throw error;
  }
}

/**
 * Update document by ID (delete and recreate with new embedding)
 */
export async function updateDocument(
  id: number,
  title: string,
  content: string,
  category: string
): Promise<void> {
  try {
    console.log('Updating document with ID:', id);
    
    // Delete existing document
    await deleteDocument(id);
    
    // Create new document with updated content and new embedding
    await storeDocumentWithChunks(title, content, category);
    
    console.log('Document updated successfully');
  } catch (error) {
    console.error('Error in updateDocument:', error);
    throw error;
  }
}
