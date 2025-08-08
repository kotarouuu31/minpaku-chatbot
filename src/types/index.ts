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
  data?: any;
}
