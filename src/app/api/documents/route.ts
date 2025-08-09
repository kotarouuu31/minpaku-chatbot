import { NextRequest, NextResponse } from 'next/server';
import { 
  storeDocumentWithChunks, 
  getDocumentsByCategory, 
  deleteDocument,
  searchSimilarDocuments,
  updateDocument
} from '@/lib/rag';

// GET: Retrieve documents by category or search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query = searchParams.get('query');

    if (query) {
      // Search for similar documents with lower threshold for debugging
      console.log('Searching for query:', query);
      const results = await searchSimilarDocuments(query, 0.1, 10);
      console.log('Search results count:', results.length);
      console.log('Search results:', results);
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

// PUT: Update document by ID
export async function PUT(req: NextRequest) {
  try {
    const { id, title, content, category } = await req.json();
    
    // Validation
    if (!id || !title || !content || !category) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています。' },
        { status: 400 }
      );
    }

    // Update document (delete and recreate with new embedding)
    await updateDocument(parseInt(id), title, content, category);
    
    return NextResponse.json({
      message: 'ドキュメントが正常に更新されました。',
      success: true
    });
  } catch (error) {
    console.error('Error in PUT /api/documents:', error);
    return NextResponse.json(
      { error: 'ドキュメントの更新に失敗しました。' },
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
