export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface SendMessageOptions {
  parseMode?: 'HTML' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  replyMarkup?: InlineKeyboardMarkup;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface MessageResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export interface JobNotificationData {
  jobId: string;
  title: string;
  company: string;
  location?: string;
  url: string;
  salary?: string;
  seniorityLevel?: string;
  techStack: string[];
  remoteType?: string;
  matchScore?: number;
  matchReasons: string[];
}
