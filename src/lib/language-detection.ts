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
    systemPrompt: '基本は300文字以内で十分な情報を、詳細要求時は1500文字以内で徹底的に回答してください。',
    welcomeMessage: 'ととのいヴィラPALへようこそ！ご質問をお聞かせください。',
    placeholderText: 'メッセージを入力してください...',
    quickReplies: ['チェックイン方法は？', '近くのお店を教えて', 'Wi-Fiパスワードは？', '詳細を教えて']
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    systemPrompt: 'Basic responses within 200 words with sufficient info, detailed responses within 1000 words when requested.',
    welcomeMessage: 'Welcome to Totonoiii Villa PAL! How can I help you?',
    placeholderText: 'Type your message...',
    quickReplies: ['How to check in?', 'Nearby restaurants?', 'Wi-Fi password?', 'Tell me more']
  },
  {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
    systemPrompt: '基础回答300字内提供充分信息，详细要求时1500字内全面回答。',
    welcomeMessage: '欢迎来到整备别墅PAL！有什么可以帮助您的吗？',
    placeholderText: '请输入您的消息...',
    quickReplies: ['如何办理入住？', '附近的餐厅？', 'Wi-Fi密码？', '告诉我更多']
  },
  {
    code: 'ko',
    name: '한국어',
    flag: '🇰🇷',
    systemPrompt: '기본 답변은 300자 내 충분한 정보로, 상세 요청시 1500자 내 포괄적으로 답변하세요.',
    welcomeMessage: '토토노이 빌라 PAL에 오신 것을 환영합니다! 무엇을 도와드릴까요？',
    placeholderText: '메시지를 입력하세요...',
    quickReplies: ['체크인 방법은?', '근처 음식점은?', 'Wi-Fi 비밀번호는?', '자세히 알려줘']
  }
];

/**
 * 改善された言語自動検出関数
 * 日本語と中国語の区別を正確に行います
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'ja';
  
  // 韓国語検出（ハングル文字）
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  
  // 英語検出（アルファベットが主で、日本語文字がない場合）
  if (/[a-zA-Z]/.test(text) && !/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(text)) {
    const alphabetRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
    if (alphabetRatio > 0.5) return 'en';
  }
  
  // 中国語 vs 日本語の詳細判定
  const hasHiragana = /[\u3040-\u309f]/.test(text); // ひらがな
  const hasKatakana = /[\u30a0-\u30ff]/.test(text); // カタカナ
  const hasKanji = /[\u4e00-\u9fff]/.test(text);    // 漢字
  
  // 日本語特有の文字（ひらがな・カタカナ）がある場合は日本語
  if (hasHiragana || hasKatakana) {
    return 'ja';
  }
  
  // 漢字のみの場合の判定
  if (hasKanji && !hasHiragana && !hasKatakana) {
    // 日本語でよく使われる漢字パターンをチェック
    const japanesePatterns = [
      /[はがをにでとのもうこそあるいる]/, // ひらがな助詞・動詞
      /[チェック|ウィ|パスワード|イン|アウト]/, // カタカナ
      /[方法|時間|場所|連絡|確認|情報]/, // 日本語でよく使う漢字
      /[？]/, // 日本語の疑問符
    ];
    
    // 中国語特有のパターン
    const chinesePatterns = [
      /[请|您|吗|呢|的|了|在|是|有|我|你|他]/, // 中国語特有の文字
      /[？].*[请|您|吗]/, // 中国語の疑問文パターン
    ];
    
    // 中国語パターンが強い場合は中国語
    for (const pattern of chinesePatterns) {
      if (pattern.test(text)) return 'zh';
    }
    
    // それ以外は日本語とする（安全な判定）
    return 'ja';
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
