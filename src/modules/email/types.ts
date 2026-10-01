export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: GmailMessagePayload;
  internalDate: string;
}

export interface GmailMessagePayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: GmailHeader[];
  body: GmailMessageBody;
  parts?: GmailMessagePart[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessageBody {
  attachmentId?: string;
  size: number;
  data?: string;
}

export interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename?: string;
  headers: GmailHeader[];
  body: GmailMessageBody;
  parts?: GmailMessagePart[];
}

export interface EmailContent {
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  textBody: string;
  htmlBody: string;
  raw: string;
}

export interface EmailFetchOptions {
  maxResults?: number;
  query?: string;
  labelIds?: string[];
}
