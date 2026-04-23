export const sanitizeAssistantContent = (content: string): string => {
  if (!content) return '';
  let cleaned = content;

  cleaned = cleaned.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, '');

  if (/<\/think>/i.test(cleaned)) {
    const parts = cleaned.split(/<\/think>/i);
    cleaned = parts[parts.length - 1] ?? cleaned;
  }
  if (/<\/thinking>/i.test(cleaned)) {
    const parts = cleaned.split(/<\/thinking>/i);
    cleaned = parts[parts.length - 1] ?? cleaned;
  }

  cleaned = cleaned.replace(/```(?:think|reasoning)[\s\S]*?```/gi, '');
  cleaned = cleaned.trim();
  return cleaned || content.trim();
};
