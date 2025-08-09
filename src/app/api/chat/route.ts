import axios from 'axios';
import { NextRequest } from 'next/server';
import { searchSimilarDocuments, SearchResult } from '@/lib/rag';

// 民泊に関する基本情報（実際の運用では環境変数やデータベースから取得）
const MINPAKU_CONTEXT = `
あなたは民泊のカスタマーサポートAIアシスタントです。以下の情報を参考にして、ゲストの質問に親切で丁寧に回答してください。

基本情報:
- 物件名: ${process.env.MINPAKU_PROPERTY_NAME || 'サンプル民泊'}
- 住所: ${process.env.MINPAKU_ADDRESS || '東京都渋谷区'}
- チェックイン時間: ${process.env.MINPAKU_CHECKIN_TIME || '15:00'}
- チェックアウト時間: ${process.env.MINPAKU_CHECKOUT_TIME || '11:00'}
- Wi-Fiパスワード: ${process.env.MINPAKU_WIFI_PASSWORD || 'sample_wifi_password'}
- 緊急連絡先: ${process.env.MINPAKU_EMERGENCY_CONTACT || '090-1234-5678'}

回答の際の注意点:
1. 常に丁寧で親切な日本語で回答してください
2. 民泊のゲストとして滞在を楽しんでもらえるよう心がけてください
3. 不明な点は「確認いたします」と答え、緊急連絡先をお伝えください
4. 安全に関わる重要な情報は必ず正確にお伝えください
`;

// DeepSeek API設定
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Generate enhanced context using RAG search
 */
async function generateRAGContext(userQuery: string): Promise<string> {
  try {
    // Search for relevant documents
    const searchResults = await searchSimilarDocuments(userQuery, 0.7, 3);
    
    if (searchResults.length === 0) {
      return MINPAKU_CONTEXT;
    }

    // Build enhanced context with search results
    const ragContext = `${MINPAKU_CONTEXT}

関連する情報:
${searchResults.map((result: SearchResult, index: number) => 
  `${index + 1}. 【${result.category}】${result.title}
   ${result.content}
   (関連度: ${(result.similarity * 100).toFixed(1)}%)`
).join('\n\n')}

上記の関連情報を参考にして、より具体的で正確な回答を提供してください。`;

    return ragContext;
  } catch (error) {
    console.error('RAG search error:', error);
    // Fallback to basic context if RAG fails
    return MINPAKU_CONTEXT;
  }
}

export async function POST(req: NextRequest) {
  try {
    // APIキーの確認
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'APIキーが設定されていません。管理者にお問い合わせください。' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { messages } = await req.json();

    // メッセージの検証
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: '無効なメッセージ形式です。' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 最新のユーザーメッセージを取得してRAGコンテキストを生成
    const userMessages = messages.filter((msg: any) => msg.role === 'user');
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // RAG検索を使用して拡張コンテキストを生成
    const enhancedContext = await generateRAGContext(latestUserMessage);

    // システムメッセージを含むメッセージ配列を構築
    const formattedMessages: Message[] = [
      { role: 'system', content: enhancedContext },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    // DeepSeek APIリクエスト設定
    const requestData = {
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true
    };

    // DeepSeek APIへのリクエスト
    const response = await axios.post(DEEPSEEK_API_URL, requestData, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      timeout: 30000, // 30秒タイムアウト
    });

    // ストリーミングレスポンスの設定
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';
          
          response.data.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
                continue;
              }

              if (trimmedLine.startsWith('data: ')) {
                try {
                  const jsonStr = trimmedLine.slice(6);
                  const data = JSON.parse(jsonStr);
                  
                  if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                    const content = data.choices[0].delta.content;
                    const formattedChunk = `0:${JSON.stringify({ content })}\n`;
                    controller.enqueue(encoder.encode(formattedChunk));
                  }
                } catch (parseError) {
                  console.error('JSON parse error:', parseError);
                }
              }
            }
          });

          response.data.on('end', () => {
            controller.close();
          });

          response.data.on('error', (error: Error) => {
            console.error('Stream error:', error);
            controller.error(error);
          });

        } catch (error: unknown) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('DeepSeek API error:', error);
    
    // エラーの詳細な処理
    let errorMessage = 'チャットサービスに一時的な問題が発生しています。しばらくしてからもう一度お試しください。';
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage = 'APIキーが無効です。管理者にお問い合わせください。';
      } else if (error.response?.status === 429) {
        errorMessage = 'リクエストが多すぎます。しばらく待ってからもう一度お試しください。';
      } else if (error.response?.status === 500) {
        errorMessage = 'DeepSeekサービスに問題が発生しています。しばらくしてからもう一度お試しください。';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'リクエストがタイムアウトしました。もう一度お試しください。';
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
