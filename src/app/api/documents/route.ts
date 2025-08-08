import { NextRequest, NextResponse } from 'next/server';
import { 
  storeDocumentWithChunks, 
  getDocumentsByCategory, 
  deleteDocument,
  searchSimilarDocuments 
} from '@/lib/rag';

// GET: Retrieve documents by category or search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query = searchParams.get('query');

    if (query) {
      // Search for similar documents
      const results = await searchSimilarDocuments(query, 0.5, 10);
      return NextResponse.json({ documents: results });
    } else if (category) {
      // Get documents by category
      const documents = await getDocumentsByCategory(category);
      return NextResponse.json({ documents });
    } else {
      return NextResponse.json(
        { error: 'カテゴリまたは検索クエリが必要です。' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/documents:', error);
    return NextResponse.json(
      { error: 'ドキュメントの取得に失敗しました。' },
      { status: 500 }
    );
  }
}

// POST: Store new document
export async function POST(req: NextRequest) {
  try {
    const { title, content, category } = await req.json();

    // Validation
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'タイトル、内容、カテゴリは必須です。' },
        { status: 400 }
      );
    }

    // Store document with chunking
    await storeDocumentWithChunks(title, content, category);

    return NextResponse.json({ 
      message: 'ドキュメントが正常に保存されました。',
      success: true 
    });
  } catch (error) {
    console.error('Error in POST /api/documents:', error);
    return NextResponse.json(
      { error: 'ドキュメントの保存に失敗しました。' },
      { status: 500 }
    );
  }
}

// DELETE: Remove document by ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ドキュメントIDが必要です。' },
        { status: 400 }
      );
    }

    await deleteDocument(parseInt(id));

    return NextResponse.json({ 
      message: 'ドキュメントが正常に削除されました。',
      success: true 
    });
  } catch (error) {
    console.error('Error in DELETE /api/documents:', error);
    return NextResponse.json(
      { error: 'ドキュメントの削除に失敗しました。' },
      { status: 500 }
    );
  }
}
