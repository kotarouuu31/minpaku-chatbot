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
 * 統合版多言語コンテキスト生成（簡潔+段階的詳細対応）
 */
function generateMultilingualContext(language: string, enhancedContext: string): string {
  const langConfig = getLanguageConfig(language);
  
  const unifiedPrompts = {
    ja: `${langConfig.systemPrompt}

【統合回答システム】

▼ 基本回答（デフォルト）:
- 2-3文で簡潔に要点のみ回答
- 必要最低限の情報を提供
- 冗長な説明や前置きは不要
- 直接的で親切な回答
- 最後に「📋 詳しく知りたい場合は『詳細を教えて』とお聞きください」を追加

▼ 詳細回答（ユーザーが「詳細」「詳しく」「もっと教えて」「詳細を教えて」等を要求した場合）:
- 前回の基本回答を踏まえて詳細説明
- 手順、注意点、追加情報を含める
- 具体的で実用的な情報を提供
- 最大300文字程度で完結`,

    en: `${langConfig.systemPrompt}

【UNIFIED RESPONSE SYSTEM】

▼ Basic Response (Default):
- 2-3 sentences with essential info only
- No lengthy explanations or introductions
- Direct and helpful answers
- End with "📋 Ask 'tell me more' for detailed information"

▼ Detailed Response (When user requests "more details", "tell me more", "explain more", etc.):
- Build upon previous basic response
- Include steps, tips, and additional information
- Practical and specific details
- Maximum ~200 words`,

    zh: `${langConfig.systemPrompt}

【统一回答系统】

▼ 基础回答（默认）:
- 2-3句话简洁回答要点
- 只提供必要信息，无冗长说明
- 直接且有用的答案
- 结尾加"📋 如需详细信息请说'告诉我更多'"

▼ 详细回答（用户要求"详细"、"更多"、"详细说明"等时）:
- 基于之前的基础回答提供详细说明
- 包含步骤、注意事项和补充信息
- 实用具体的详细内容`,

    ko: `${langConfig.systemPrompt}

【통합 답변 시스템】

▼ 기본 답변（기본값）:
- 2-3문장으로 요점만 간결하게
- 필수 정보만 제공, 장황한 설명 금지
- 직접적이고 도움이 되는 답변
- 마지막에 "📋 자세한 정보가 필요하면 '자세히 알려줘'라고 말씀해주세요" 추가

▼ 상세 답변（사용자가 "자세히", "더 알려줘", "상세히" 등 요청시）:
- 이전 기본 답변을 바탕으로 상세 설명
- 단계별 설명, 주의사항, 추가 정보 포함
- 실용적이고 구체적인 상세 내용`
  };

  const multilingualContext = `
${enhancedContext}

${unifiedPrompts[language as keyof typeof unifiedPrompts] || unifiedPrompts.ja}

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
    
    // 詳細要求の検出（統合版）
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
    
    // RAG検索（簡潔版）
    const searchResults = await searchSimilarDocuments(latestUserMessage, 0.1, isDetailRequest ? 8 : 3);
    let ragContext = MINPAKU_CONTEXT;
    
    if (searchResults.length > 0) {
      const maxContentLength = isDetailRequest ? 200 : 80; // 詳細要求時は長めに
      ragContext = `${MINPAKU_CONTEXT}

関連情報:
${searchResults.map((result: SearchResult, index: number) => 
  `${index + 1}. ${result.title}: ${result.content.substring(0, maxContentLength)}${result.content.length > maxContentLength ? '...' : ''}`
).join('\n')}`;
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

    // 統合API設定
    const requestData = {
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: isDetailRequest ? 0.4 : 0.3, // 詳細要求時は少し創造性アップ
      max_tokens: isDetailRequest ? 350 : 150,  // 簡潔150 / 詳細350
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
