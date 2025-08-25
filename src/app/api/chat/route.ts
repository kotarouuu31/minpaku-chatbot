import axios from 'axios';
import { NextRequest } from 'next/server';
import { searchSimilarDocuments } from '@/lib/rag';
import { getMinpakuConfig } from '@/config/minpaku-config';
import { detectLanguage, getLanguageConfig } from '@/lib/language-detection';
import { SearchResult, DeepSeekResponse } from '@/types';

// 設定を取得（これで「サンプル民泊」問題を解決）
const config = getMinpakuConfig();

// 統合版ベースコンテキスト
const MINPAKU_CONTEXT = `
あなたは「ととのいヴィラ PAL」のカスタマーサポートAIです。

基本情報:
- 施設: ${config.propertyName}
- 住所: ${config.address}
- チェックイン: ${config.checkinTime} / チェックアウト: ${config.checkoutTime}
- Wi-Fi: ${config.wifiPassword}
- 緊急連絡: ${config.emergencyContact}
- アクセス: ${config.access.naviSetting}
`;

// DeepSeek API設定
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 段階的回答システム（改良版）
 * 長い回答を自動的に複数のパートに分割
 */
function generateMultilingualContext(language: string, enhancedContext: string): string {
  const langConfig = getLanguageConfig(language);
  
  const optimizedPrompts = {
    ja: `${langConfig.systemPrompt}

【回答ガイドライン】
- 質問に対して適切で十分な情報を提供してください
- 具体的で実用的な内容を含めてください
- 必要に応じて手順、方法、注意点を説明してください
- 読みやすい構成で回答してください
- 情報を出し惜しみせず、ユーザーが満足できる回答をしてください`,

    en: `${langConfig.systemPrompt}

【Response Guidelines】
- Provide appropriate and sufficient information for each question
- Include specific and practical content
- Explain steps, methods, and precautions as needed
- Structure responses for readability
- Provide complete information without holding back to ensure user satisfaction`,

    zh: `${langConfig.systemPrompt}

【回答指南】
- 为每个问题提供适当和充分的信息
- 包含具体实用的内容
- 根据需要解释步骤、方法和注意事项
- 结构化回答以便阅读
- 提供完整信息，确保用户满意`,

    ko: `${langConfig.systemPrompt}

【답변 가이드라인】
- 각 질문에 대해 적절하고 충분한 정보를 제공하세요
- 구체적이고 실용적인 내용을 포함하세요
- 필요에 따라 단계, 방법, 주의사항을 설명하세요
- 읽기 쉬운 구성으로 답변하세요
- 완전한 정보를 제공하여 사용자 만족을 보장하세요`
  };

  const multilingualContext = `
${enhancedContext}

${optimizedPrompts[language as keyof typeof optimizedPrompts] || optimizedPrompts.ja}

施設名: ${language === 'ja' ? 'ととのいヴィラ PAL' : 
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

    // 最新ユーザーメッセージを取得
    const userMessages = messages.filter((msg: Message) => msg.role === 'user');
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // 単一の適切な回答システム
    const responseSettings = {
      max: 1200,     // 適切な回答長（約800-1000文字相当）
      temp: 0.35,    // バランスの取れた温度設定
      description: '質問に応じた適切で十分な情報提供'
    };

    console.log(`[CHAT-API] Single response mode: ${responseSettings.description}, max_tokens: ${responseSettings.max}`);

    // RAG検索（エラーハンドリング追加）
    let searchResults: SearchResult[] = [];
    try {
      searchResults = await searchSimilarDocuments(
        latestUserMessage, 
        0.1, 
        8  // 適切な件数
      );
    } catch (ragError) {
      console.warn('[CHAT-API] RAG search failed, continuing without RAG:', ragError);
      // RAGが失敗してもチャットは継続
    }

    let ragContext = MINPAKU_CONTEXT;

    if (searchResults.length > 0) {
      const maxContentLength = 200; // 適切な長さ
      ragContext = `${MINPAKU_CONTEXT}

関連情報:
${searchResults.map((result: SearchResult, index: number) => 
  `${index + 1}. ${result.title}: ${result.content.substring(0, maxContentLength)}${result.content.length > maxContentLength ? '...' : ''}`
).join('\n')}`;
      
      console.log(`[CHAT-API] RAG context enhanced with ${searchResults.length} documents`);
    } else {
      console.log(`[CHAT-API] No RAG results found, using base context`);
    }

    // 統合多言語コンテキスト生成
    const multilingualContext = generateMultilingualContext(detectedLanguage, ragContext);

    // メッセージ配列構築
    const formattedMessages: Message[] = [
      { role: 'system', content: multilingualContext },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    // API設定
    const requestData = {
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: responseSettings.temp,
      max_tokens: responseSettings.max,
      stream: true,
      stop: ['<END>', '---', '\n\n\n'], // 自然な停止ポイント
      presence_penalty: 0.1, // 繰り返し防止
      frequency_penalty: 0.1  // 冗長性防止
    };

    console.log(`[CHAT-API] max_tokens: ${responseSettings.max}`);

    // デバッグログ追加
    console.log('[CHAT-API] Request details:', {
      maxTokens: requestData.max_tokens,
      systemPromptLength: multilingualContext.length,
      totalMessagesLength: formattedMessages.reduce((sum, msg) => sum + msg.content.length, 0)
    });

    // DeepSeek APIへのリクエスト
    const response = await axios.post(DEEPSEEK_API_URL, requestData, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      timeout: 30000, // 30秒タイムアウト
    });

    // ストリーミングレスポンスの設定（改善版）
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';
          let isComplete = false;
          let responseLength = 0;
          let responseText = '';
          
          response.data.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
                isComplete = true;
                continue;
              }

              if (trimmedLine.startsWith('data: ')) {
                try {
                  const jsonStr = trimmedLine.slice(6);
                  const data = JSON.parse(jsonStr);
                  
                  // finish_reasonのチェックを追加
                  if (data.choices && data.choices[0]) {
                    const choice = data.choices[0];
                    
                    // コンテンツがある場合
                    if (choice.delta && choice.delta.content) {
                      const content = choice.delta.content;
                      responseText += content;
                      responseLength += content.length;
                      
                      // 長さ監視（デバッグ用）
                      if (responseLength > 300) {
                        console.warn(`[CHAT-API] Response getting long: ${responseLength} chars`);
                      }
                      
                      const formattedChunk = `0:${JSON.stringify({ content })}\n`;
                      controller.enqueue(encoder.encode(formattedChunk));
                    }
                    
                    // 完了チェック
                    if (choice.finish_reason) {
                      console.log(`[CHAT-API] Final response: ${responseLength} chars, reason: ${choice.finish_reason}`);
                      
                      // length制限で切れた場合の警告
                      if (choice.finish_reason === 'length') {
                        console.warn('[CHAT-API] Response was truncated due to max_tokens limit');
                        // 必要に応じて「...続きがあります」的なメッセージを送信
                        const continueMsg = `0:${JSON.stringify({ content: '\n\n（回答が長くなったため一部省略されました）' })}\n`;
                        controller.enqueue(encoder.encode(continueMsg));
                      }
                      
                      isComplete = true;
                    }
                  }
                } catch (parseError) {
                  console.error('JSON parse error:', parseError);
                }
              }
            }
          });

          response.data.on('end', () => {
            console.log('[CHAT-API] Stream ended, complete:', isComplete);
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
