export interface ActionCard {
  type: 'donation-list' | 'impact-fund' | 'traceability';
  data: Record<string, unknown>;
}

export interface SanitizeResult {
  cleanedText: string;
  actionCards: ActionCard[];
}

function classifyActionCard(data: Record<string, unknown>): ActionCard['type'] | null {
  if ('artistShare' in data || ('total' in data && 'charityShare' in data)) return 'impact-fund';
  if ('stages' in data && Array.isArray(data.stages)) return 'traceability';
  if ('items' in data && Array.isArray(data.items)) {
    const first = data.items[0] as Record<string, unknown> | undefined;
    if (first && 'amount' in first) return 'donation-list';
  }
  return null;
}

function tryParseJSON(str: string): Record<string, unknown> | null {
  try { return JSON.parse(str); } catch { return null; }
}

export const sanitizeAssistantContent = (content: string): string => {
  return sanitizeAssistantContentWithCards(content).cleanedText;
};

export const sanitizeAssistantContentWithCards = (content: string): SanitizeResult => {
  if (!content) return { cleanedText: '', actionCards: [] };
  let cleaned = content;
  const actionCards: ActionCard[] = [];

  // Strip think tags
  cleaned = cleaned.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '');
  if (/<\/think>/i.test(cleaned)) {
    cleaned = cleaned.split(/<\/think>/i).pop() ?? cleaned;
  }
  if (/<\/thinking>/i.test(cleaned)) {
    cleaned = cleaned.split(/<\/thinking>/i).pop() ?? cleaned;
  }
  cleaned = cleaned.replace(/```(?:think|reasoning)[\s\S]*?```/gi, '');

  // ── Phase 1: Extract well-formed :::action-card blocks ──
  cleaned = cleaned.replace(
    /:::action-card\[([^\]]*)\]\{([\s\S]*?)\}/g,
    (_match, type: string, jsonStr: string) => {
      const data = tryParseJSON(jsonStr);
      if (data) {
        const idx = actionCards.length;
        actionCards.push({ type: type.trim() as ActionCard['type'], data });
        return `\n\n{{ACTION_CARD:${idx}}}\n\n`;
      }
      return '';
    }
  );

  // ── Phase 2: Fix malformed :::action-card fragments ──
  // Pattern: trailing `,{...},{...}]}  or `:::` after broken JSON
  // Strip residual `:::` markers and partial wrappers
  cleaned = cleaned.replace(/:::action-card\[[^\]]*\]\s*/g, '');
  cleaned = cleaned.replace(/(?:::)\s*$/gm, '');

  // ── Phase 3: Detect bare JSON blocks with known card fields ──
  const BARE_JSON_RE = /(\{[\s\S]*?"(?:items|artistShare|amount|charityShare|stages)"[\s\S]*?\})/g;
  let match: RegExpExecArray | null;
  while ((match = BARE_JSON_RE.exec(cleaned)) !== null) {
    const jsonStr = match[1];
    const data = tryParseJSON(jsonStr);
    if (data) {
      const type = classifyActionCard(data);
      if (type) {
        const idx = actionCards.length;
        actionCards.push({ type, data });
        cleaned = cleaned.replace(jsonStr, `\n\n{{ACTION_CARD:${idx}}}\n\n`);
        // Reset regex since string changed
        BARE_JSON_RE.lastIndex = 0;
      }
    }
  }

  // ── Phase 4: Detect truncated JSON arrays (starts with comma or missing opener) ──
  // Pattern: `,{"name":...,"amount":...},{"name":...,"amount":...}]}` — donation list fragment
  const FRAGMENT_RE = /,\s*(\{[\s\S]*?"amount"[\s\S]*?\})\s*(?:,\s*(\{[\s\S]*?"amount"[\s\S]*?\})\s*)*\]/g;
  while ((match = FRAGMENT_RE.exec(cleaned)) !== null) {
    const fullMatch = match[0];
    const attempt = tryParseJSON('[' + fullMatch);
    if (attempt && Array.isArray(attempt) && attempt.length > 0) {
      const first = attempt[0] as Record<string, unknown>;
      if ('amount' in first) {
        const data = { items: attempt };
        const idx = actionCards.length;
        actionCards.push({ type: 'donation-list', data });
        cleaned = cleaned.replace(fullMatch, `\n\n{{ACTION_CARD:${idx}}}\n\n`);
        FRAGMENT_RE.lastIndex = 0;
      }
    }
  }

  // Clean up orphaned JSON syntax fragments (], }, :::) left after extraction
  cleaned = cleaned.replace(/^\s*[}\]][}\]\s,]*$/gm, '');
  cleaned = cleaned.replace(/^\s*:::\s*$/gm, '');

  // Strip emoji symbols (defense-in-depth)
  cleaned = cleaned.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
    ''
  );

  // Strip action-card placeholders from text (rendered separately)
  cleaned = cleaned.replace(/\{\{ACTION_CARD:\d+\}\}/g, '');

  // Collapse excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  cleaned = cleaned.trim();
  return {
    cleanedText: cleaned || content.trim(),
    actionCards,
  };
};
