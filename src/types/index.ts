export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MinpakuInfo {
  propertyName: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  wifiPassword: string;
  emergencyContact: string;
  houseRules: string[];
  amenities: string[];
  nearbyAttractions: string[];
}

export interface EmbedConfig {
  theme?: "light" | "dark" | "auto";
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left" | "center";
  width?: number;
  height?: number;
  showHeader?: boolean;
  welcomeMessage?: string;
}

export interface ParentMessage {
  type: "resize" | "close" | "minimize" | "theme-change";
  data?: Record<string, unknown>;
}

// RAG関連の型定義
export interface Document {
  id: number;
  title: string;
  content: string;
  category: string;
  similarity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SearchResult {
  id: number;
  title: string;
  content: string;
  category: string;
  similarity: number;
}

export interface InitResult {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
  stats?: {
    success: number;
    errors: number;
    total: number;
  };
}

export interface Category {
  key: string;
  name: string;
}

// API関連の型定義
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
