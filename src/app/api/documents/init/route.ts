import { NextRequest, NextResponse } from 'next/server';
import { storeDocumentWithChunks } from '@/lib/rag';
import { minpakuDocuments } from '@/data/minpaku-documents';

// POST: Initialize database with sample documents
export async function POST(req: NextRequest) {
  try {
    const { reset } = await req.json();

    if (reset) {
      // TODO: Add function to clear existing documents if needed
      console.log('Reset flag detected - would clear existing documents');
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
