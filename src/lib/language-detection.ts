export interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
  systemPrompt: string;
  welcomeMessage: string;
  placeholderText: string;
  quickReplies: string[];
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'ja',
    name: '日本語',
    flag: '🇯🇵',
    systemPrompt: '日本語で丁寧に回答してください。敬語を適切に使用し、親切で温かい応対を心がけてください。',
    welcomeMessage: 'ととのいヴィラPALへようこそ！お気軽にご質問ください。チェックイン方法、周辺情報、設備について何でもお答えします。',
    placeholderText: 'メッセージを入力してください...',
    quickReplies: ['チェックイン方法は？', '近くのお店を教えて', 'Wi-Fiパスワードは？', '周辺の観光地は？']
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    systemPrompt: 'Please respond in clear, polite English. You are a customer support AI for "Totonoiii Villa PAL" in Izu, Japan. Provide helpful information about the property, local area, and Japanese customs when relevant.',
    welcomeMessage: 'Welcome to Totonoiii Villa PAL! I\'m here to help with check-in procedures, local recommendations, amenities, and anything else you need during your stay.',
    placeholderText: 'Type your message...',
    quickReplies: ['How to check in?', 'Nearby restaurants?', 'Wi-Fi password?', 'Local attractions?']
  },
  {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
    systemPrompt: '请用简体中文礼貌地回答。您是位于日本伊豆的"整备别墅PAL"的客户支持AI。请提供有关设施、当地信息的帮助，并在相关时解释日本的习俗。',
    welcomeMessage: '欢迎来到整备别墅PAL！我可以帮助您了解入住手续、当地推荐、设施信息以及住宿期间的任何问题。',
    placeholderText: '请输入您的消息...',
    quickReplies: ['如何办理入住？', '附近的餐厅？', 'Wi-Fi密码？', '当地景点？']
  },
  {
    code: 'ko',
    name: '한국어',
    flag: '🇰🇷',
    systemPrompt: '정중한 한국어로 답변해 주세요. 당신은 일본 이즈에 위치한 "토토노이 빌라 PAL"의 고객 지원 AI입니다. 시설, 지역 정보에 대한 도움을 제공하고 관련된 일본 관습에 대해서도 설명해 주세요.',
    welcomeMessage: '토토노이 빌라 PAL에 오신 것을 환영합니다! 체크인 절차, 현지 추천 정보, 시설 안내 및 숙박 중 필요한 모든 것을 도와드리겠습니다.',
    placeholderText: '메시지를 입력하세요...',
    quickReplies: ['체크인 방법은?', '근처 음식점은?', 'Wi-Fi 비밀번호는?', '지역 관광지는?']
  }
];

/**
 * 言語自動検出関数
 * テキストの内容から言語を自動判定します
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'ja';
  
  // 韓国語検出（ハングル文字）
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  
  // 中国語検出（簡体字・繁体字）
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  
  // 英語検出（日本語文字がなく、アルファベットが主の場合）
  if (/[a-zA-Z]/.test(text) && !/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    const alphabetRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
    if (alphabetRatio > 0.5) return 'en';
  }
  
  return 'ja'; // デフォルト
}

/**
 * 言語設定取得関数
 * 指定された言語コードに対応する設定を返します
 */
export function getLanguageConfig(languageCode: string): LanguageConfig {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || SUPPORTED_LANGUAGES[0];
}

/**
 * サポートされている言語のリストを取得
 */
export function getSupportedLanguages(): LanguageConfig[] {
  return SUPPORTED_LANGUAGES;
}

/**
 * 言語コードが有効かどうかをチェック
 */
export function isValidLanguageCode(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}
