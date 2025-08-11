import axios from 'axios';
import { NextRequest } from 'next/server';
import { searchSimilarDocuments } from '@/lib/rag';
import { getMinpakuConfig } from '@/config/minpaku-config';
import { detectLanguage, getLanguageConfig } from '@/lib/language-detection';
import { SearchResult, DeepSeekResponse } from '@/types';

// 設定を取得（これで「サンプル民泊」問題を解決）
const config = getMinpakuConfig();

// ととのいヴィラ PAL の基本情報
const MINPAKU_CONTEXT = `
あなたは「ととのいヴィラ PAL」のカスタマーサポートAIアシスタントです。以下の情報を参考にして、ゲストの質問に親切で丁寧に回答してください。

基本情報:
- 施設名: ${config.propertyName}
- 住所: ${config.address}
- 施設タイプ: ${config.propertyType}
- チェックイン時間: ${config.checkinTime}
- チェックアウト時間: ${config.checkoutTime}
- Wi-Fiパスワード: ${config.wifiPassword}
- 緊急連絡先: ${config.emergencyContact}

アクセス情報:
- ナビ設定: ${config.access.naviSetting}
- 経由地推奨: ${config.access.viaPoint}
- 注意事項: ${config.access.notes}

BBQ・お買い物情報:
- ${config.bbqInfo.preparation}
- ${config.bbqInfo.shoppingArea}

おすすめショップ:
1. スーパーあおき 函南店（車15分）- 地元食材が豊富
2. 杉山鮮魚店（車10分）- 沼津港直送の新鮮魚介、鯵の干物が名物
3. 良酒倉庫 宮内酒店（車10分）- 伊豆の地酒・クラフトビール

回答の際の注意点:
1. 常に丁寧で親切な日本語で回答してください
2. BBQや自然を楽しむ滞在をサポートしてください
3. 地元の新鮮な食材やお店の情報を積極的に案内してください
4. アクセスの質問には経由地設定をおすすめしてください
5. 不明な点は「確認いたします」と答え、緊急連絡先をお伝えください
`;

// DeepSeek API設定
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Generate multilingual context with language-specific instructions
 */
function generateMultilingualContext(language: string, enhancedContext: string): string {
  const langConfig = getLanguageConfig(language);
  
  const multilingualContext = `
${enhancedContext}

重要な言語指示:
${langConfig.systemPrompt}

${langConfig.name}での追加ガイドライン:
- 必ず${langConfig.name}で回答してください
- 自然で会話的なトーンを使用してください
- 役立つ場合は文化的コンテキストを含めてください
- 日本語以外の方には、関連する日本の習慣も説明してください
- 通貨: 価格はJPY（¥）で表示し、必要に応じてUSD/EUR/CNY換算も提供
- 日付: 適切な現地フォーマットを使用
- 時間: 24時間制を使用し、関連する場合は日本標準時（JST）と記載

施設名（${langConfig.name}）:
${language === 'ja' ? 'ととのいヴィラ PAL' : 
  language === 'en' ? 'Totonoiii Villa PAL' :
  language === 'zh' ? '整备别墅PAL' : 
  language === 'ko' ? '토토노이 빌라 PAL' : 'ととのいヴィラ PAL'}
`;

  return multilingualContext;
}

/**
 * Generate enhanced context using RAG search
 */
async function generateRAGContext(userQuery: string): Promise<string> {
  try {
    // Search for relevant documents
    const searchResults = await searchSimilarDocuments(userQuery, 0.1, 10);
    
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

    const { messages, language } = await req.json();

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

    // 言語検出または指定された言語を使用
    let detectedLanguage = language || 'ja';
    if (!language && messages.length > 0) {
      const userMessages = messages.filter((msg: Message) => msg.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
      detectedLanguage = detectLanguage(lastUserMessage);
    }

    // 最新のユーザーメッセージを取得してRAGコンテキストを生成
    const userMessages = messages.filter((msg: Message) => msg.role === 'user');
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // RAG検索を使用して拡張コンテキストを生成
    const enhancedContext = await generateRAGContext(latestUserMessage);
    
    // 多言語コンテキストを生成
    const multilingualContext = generateMultilingualContext(detectedLanguage, enhancedContext);

    // システムメッセージを含むメッセージ配列を構築（多言語対応）
    const formattedMessages: Message[] = [
      { role: 'system', content: multilingualContext },
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
