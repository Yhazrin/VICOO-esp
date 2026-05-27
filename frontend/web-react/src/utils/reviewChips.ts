export const FEEDBACK_CHIP_IDS = [
  'trueToSize',
  'comfortableFabric',
  'thoughtfulPackaging',
  'impactVisible',
] as const;

export type FeedbackChipId = (typeof FEEDBACK_CHIP_IDS)[number];

const CHIP_MARKER_PREFIX = '__VICOO_CHIPS__:';
const CHIP_MARKER_SUFFIX_RE = /\n\n__VICOO_CHIPS__:([a-zA-Z,]+)\s*$/;
const CHIP_MARKER_ONLY_RE = /^__VICOO_CHIPS__:([a-zA-Z,]+)\s*$/;

function parseChipMarker(body: string): { text: string; chipIds: FeedbackChipId[] } | null {
  const suffixMatch = body.match(CHIP_MARKER_SUFFIX_RE);
  if (suffixMatch) {
    return {
      text: body.slice(0, suffixMatch.index).trim(),
      chipIds: suffixMatch[1]
        .split(',')
        .map((part) => part.trim())
        .filter(isFeedbackChipId),
    };
  }

  const onlyMatch = body.match(CHIP_MARKER_ONLY_RE);
  if (onlyMatch) {
    return {
      text: '',
      chipIds: onlyMatch[1]
        .split(',')
        .map((part) => part.trim())
        .filter(isFeedbackChipId),
    };
  }

  return null;
}

/** Known chip labels in all locales — used to recover IDs from older reviews. */
const LEGACY_CHIP_LABEL_TO_ID: Record<string, FeedbackChipId> = {
  '尺码准确': 'trueToSize',
  'True to size': 'trueToSize',
  '面料舒适': 'comfortableFabric',
  'Comfortable fabric': 'comfortableFabric',
  '包装用心': 'thoughtfulPackaging',
  'Thoughtful packaging': 'thoughtfulPackaging',
  '影响可感知': 'impactVisible',
  'Impact feels visible': 'impactVisible',
};

function isFeedbackChipId(value: string): value is FeedbackChipId {
  return (FEEDBACK_CHIP_IDS as readonly string[]).includes(value);
}

function parseLegacyChipLine(line: string): FeedbackChipId[] {
  const parts = line.split(' · ').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return [];

  const ids: FeedbackChipId[] = [];
  for (const part of parts) {
    const id = LEGACY_CHIP_LABEL_TO_ID[part];
    if (!id) return [];
    ids.push(id);
  }
  return ids;
}

export function serializeReviewBody(
  userText: string,
  chipIds: readonly FeedbackChipId[],
): string | undefined {
  const text = userText.trim();
  if (!text && chipIds.length === 0) return undefined;
  if (!text) return `${CHIP_MARKER_PREFIX}${chipIds.join(',')}`;

  const marker =
    chipIds.length > 0 ? `\n\n${CHIP_MARKER_PREFIX}${chipIds.join(',')}` : '';
  const body = `${text}${marker}`.trim();
  return body || undefined;
}

export function deserializeReviewBody(body: string | null | undefined): {
  text: string;
  chipIds: FeedbackChipId[];
} {
  if (!body?.trim()) return { text: '', chipIds: [] };

  const marked = parseChipMarker(body);
  if (marked) return marked;

  const blocks = body.split(/\n\n/);
  if (blocks.length >= 2) {
    const lastBlock = blocks[blocks.length - 1].trim();
    const chipIds = parseLegacyChipLine(lastBlock);
    if (chipIds.length > 0) {
      return {
        text: blocks.slice(0, -1).join('\n\n').trim(),
        chipIds,
      };
    }
  }

  return { text: body.trim(), chipIds: [] };
}
