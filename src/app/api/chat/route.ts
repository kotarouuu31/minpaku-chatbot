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

【最適化2段階回答システム】

■ 基本回答モード（デフォルト）:
- 最大300文字以内で回答
- 重要な情報を3-5文で分かりやすく説明
- 具体的で実用的な情報を含める
- 簡潔でありながら満足度の高い回答
- 末尾に「📋 詳しく知りたい場合は『詳細を教えて』とお聞きください」を必ず追加

■ 詳細回答モード（「詳細」「詳しく」「もっと教えて」等の要求時）:
- 最大1500文字以内で包括的に回答
- 前回の基本回答を徹底的に詳しく説明
- 手順、方法、注意点、周辺情報を網羅的に提供
- 具体例、時間、場所、連絡先なども含める
- 箇条書きや段落を使って読みやすく構成
- ユーザーが完全に満足できる詳細レベルで回答
- 「他にご質問がございましたらお聞かせください」で終了

重要: 
- 基本モードは300文字、詳細モードは1500文字を最大限活用
- 各モードで適切な情報量を提供し、中途半端に終わらないこと
- 情報を出し惜しみせず、ユーザーが求める全ての情報を提供すること`,

    en: `${langConfig.systemPrompt}

【OPTIMIZED 2-STAGE RESPONSE SYSTEM】

■ Basic Mode (Default):
- Maximum 200 words
- 3-5 sentences with clear, practical information
- Concise but satisfying answers
- Include specific, useful details
- End with "📋 Ask 'tell me more' for detailed information"

■ Detailed Mode ("more details", "tell me more", "explain more", etc.):
- Maximum 1000 words for comprehensive coverage
- Thoroughly elaborate on the basic response
- Include comprehensive steps, methods, tips, and context
- Provide specific examples, times, locations, contacts
- Use bullet points and paragraphs for readability
- Give complete satisfaction with detailed information
- End with "Please let me know if you have any other questions"

Important: 
- Fully utilize the word limits for each mode
- Provide complete information without holding back
- Ensure responses don't end abruptly`,

    zh: `${langConfig.systemPrompt}

【优化两阶段回答系统】

■ 基础模式（默认）:
- 最多300字
- 3-5句话提供清晰实用的信息
- 简洁但令人满意的答案
- 包含具体有用的细节
- 结尾"📋 如需详细信息请说'告诉我更多'"

■ 详细模式（"详细"、"更多"、"详细说明"等）:
- 最多1500字全面覆盖
- 彻底详细解释基础回答
- 包含全面的步骤、方法、注意事项和背景
- 提供具体例子、时间、地点、联系方式
- 使用要点和段落便于阅读
- 提供完全满意的详细信息
- 以"如有其他问题请告诉我"结束

重要: 
- 充分利用各模式的字数限制
- 提供完整信息不保留
- 确保回答不会突然结束`,

    ko: `${langConfig.systemPrompt}

【최적화 2단계 답변 시스템】

■ 기본 모드（기본값）:
- 최대 300자
- 3-5문장으로 명확하고 실용적인 정보 제공
- 간결하지만 만족스러운 답변
- 구체적이고 유용한 세부사항 포함
- 끝에 "📋 자세한 정보가 필요하면 '자세히 알려줘'라고 말씀해주세요" 추가

■ 상세 모드（"자세히", "더 알려줘", "상세히" 등）:
- 최대 1500자로 포괄적 커버리지
- 기본 답변을 철저히 상세하게 설명
- 단계, 방법, 주의사항, 주변 정보를 망라적으로 제공
- 구체적 예시, 시간, 장소, 연락처 포함
- 요점과 단락으로 읽기 쉽게 구성
- 완전히 만족할 만한 상세 정보 제공
- "다른 질문이 있으시면 말씀해주세요"로 종료

중요: 
- 각 모드의 글자수 제한을 최대한 활용
- 완전한 정보를 제공하고 아끼지 말 것
- 답변이 갑자기 끝나지 않도록 보장

중요: 절대 글자수 초과 금지`
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
    
    // 最適化された2段階システム
    const tokenSettings = {
      basic: { 
        max: 400,      // 基本回答: 最大300文字（余裕を持って400トークン）
        temp: 0.3,
        description: '簡潔だが十分な情報提供'
      },
      detail: { 
        max: 2000,     // 詳細回答: 最大1500文字（余裕を持って2000トークン）
        temp: 0.4,
        description: '包括的で詳細な情報提供'
      }
    };

    // シンプルな詳細要求検出（level3削除）
    const detailRequestKeywords = {
      ja: ['詳細', '詳しく', 'もっと教えて', 'さらに', '詳細を教えて', 'くわしく', 'もっと詳しく'],
      en: ['more details', 'tell me more', 'explain more', 'more info', 'detailed', 'elaborate'],
      zh: ['详细', '更多', '告诉我更多', '详细说明', '更详细'],
      ko: ['자세히', '더 알려줘', '상세히', '자세한 정보', '더 자세히']
    };

    const keywords = detailRequestKeywords[detectedLanguage as keyof typeof detailRequestKeywords] || detailRequestKeywords.ja;

    const isDetailRequest = keywords.some(keyword => 
      latestUserMessage.toLowerCase().includes(keyword.toLowerCase())
    );

    // シンプルな2段階判定
    const responseLevel: 'basic' | 'detail' = isDetailRequest ? 'detail' : 'basic';
    const currentSettings = tokenSettings[responseLevel];

    console.log(`[CHAT-API] ${responseLevel} mode: ${currentSettings.description}, max_tokens: ${currentSettings.max}`);

    // レベル別RAG検索
    const searchResults = await searchSimilarDocuments(
      latestUserMessage, 
      0.1, 
      isDetailRequest ? 12 : 5  // 詳細時は12件、基本時は5件
    );

    let ragContext = MINPAKU_CONTEXT;

    if (searchResults.length > 0) {
      const maxContentLength = isDetailRequest ? 250 : 100; // 詳細時は長めに
      ragContext = `${MINPAKU_CONTEXT}

関連情報:
${searchResults.map((result: SearchResult, index: number) => 
  `${index + 1}. ${result.title}: ${result.content.substring(0, maxContentLength)}${result.content.length > maxContentLength ? '...' : ''}`
).join('\n')}`;
      
      console.log(`[CHAT-API] RAG context enhanced with ${searchResults.length} documents (${responseLevel} mode)`);
    } else {
      console.log(`[CHAT-API] No RAG results found, using base context (${responseLevel} mode)`);
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

    // レベル別API設定
    const requestData = {
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: currentSettings.temp,
      max_tokens: currentSettings.max,
      stream: true,
      stop: ['<END>', '---', '\n\n\n'], // 自然な停止ポイント
      presence_penalty: 0.1, // 繰り返し防止
      frequency_penalty: 0.1  // 冗長性防止
    };

    console.log(`[CHAT-API] Response level: ${responseLevel}, max_tokens: ${currentSettings.max}`);

    // デバッグログ追加
    console.log('[CHAT-API] Request details:', {
      responseLevel,
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
