import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: MINPAKU_CONTEXT,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'チャットサービスに一時的な問題が発生しています。しばらくしてからもう一度お試しください。' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
