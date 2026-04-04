/**
 * Ketersediaan AI enhancement — harus selaras dengan logika di /api/ai-enhance.
 */
export type AiEnhanceAvailability = {
  openai: boolean;
  gemini: boolean;
  ollama: boolean;
};

export function getAiEnhanceAvailability(): AiEnhanceAvailability {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    ollama: Boolean(process.env.OLLAMA_API_KEY?.trim()),
  };
}

export function isAiEnhanceConfigured(
  a: AiEnhanceAvailability = getAiEnhanceAvailability(),
): boolean {
  return a.openai || a.gemini || a.ollama;
}
