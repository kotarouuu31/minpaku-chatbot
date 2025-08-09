import { NextRequest, NextResponse } from 'next/server';
import { storeDocumentWithChunks, supabaseAdmin } from '@/lib/rag';
import { minpakuDocuments } from '@/data/minpaku-documents';

// POST: Initialize database with sample documents
export async function POST(req: NextRequest) {
  try {
    // Debug: Check environment variables
    console.log('Environment variables check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    console.log('OPENAI_API_KEY_FOR_EMBEDDINGS:', process.env.OPENAI_API_KEY_FOR_EMBEDDINGS ? 'SET' : 'NOT SET');

    const { reset } = await req.json();

    if (reset) {
      console.log('Reset flag detected - clearing existing documents');
      try {
        // Delete all existing documents
        const { error: deleteError } = await supabaseAdmin
          .from('documents')
          .delete()
          .neq('id', 0); // Delete all rows
        
        if (deleteError) {
          console.error('Error deleting documents:', deleteError);
        } else {
          console.log('All existing documents deleted successfully');
        }
      } catch (error) {
        console.error('Error during reset:', error);
      }
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Store all sample documents
    for (const doc of minpakuDocuments) {
      try {
        await storeDocumentWithChunks(doc.title, doc.content, doc.category);
        successCount++;
        console.log(`✓ Stored: ${doc.title}`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to store "${doc.title}": ${error}`;
        errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    return NextResponse.json({
      message: `ドキュメントの初期化が完了しました。`,
      success: true,
      stats: {
        total: minpakuDocuments.length,
        success: successCount,
        errors: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in POST /api/documents/init:', error);
    return NextResponse.json(
      { 
        error: 'ドキュメントの初期化に失敗しました。',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET: Check initialization status
export async function GET() {
  try {
    return NextResponse.json({
      message: 'ドキュメント初期化APIが利用可能です。',
      availableDocuments: minpakuDocuments.length,
      categories: [...new Set(minpakuDocuments.map(doc => doc.category))],
      usage: {
        init: 'POST /api/documents/init - ドキュメントを初期化',
        reset: 'POST /api/documents/init with {"reset": true} - リセット後初期化'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/documents/init:', error);
    return NextResponse.json(
      { error: 'APIステータスの取得に失敗しました。' },
      { status: 500 }
    );
  }
}
