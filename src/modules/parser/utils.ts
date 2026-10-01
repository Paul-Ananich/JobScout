export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/g;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches)];
}

export function isLinkedInJobUrl(url: string): boolean {
  return /linkedin\.com\/(?:jobs|comm\/jobs)/i.test(url);
}

export function normalizeLinkedInUrl(url: string): string {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('linkedin.com')) {
      const jobIdMatch = url.match(/(?:jobs\/view\/|currentJobId=)(\d+)/);
      if (jobIdMatch?.[1]) {
        return `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  result = result.replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 10)));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
    String.fromCharCode(parseInt(code, 16))
  );

  return result;
}

export function extractTextBetween(
  html: string,
  startMarker: string,
  endMarker: string
): string | null {
  const startIndex = html.indexOf(startMarker);
  if (startIndex === -1) return null;

  const contentStart = startIndex + startMarker.length;
  const endIndex = html.indexOf(endMarker, contentStart);
  if (endIndex === -1) return null;

  return html.slice(contentStart, endIndex);
}

export function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
