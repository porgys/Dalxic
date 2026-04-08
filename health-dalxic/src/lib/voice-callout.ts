"use client";

/**
 * Voice Number Callout — Two modes:
 * 1. Web Speech API (SpeechSynthesisUtterance) — zero infrastructure
 * 2. Pre-recorded audio files — concatenated playback from /audio/ directory
 *
 * Pre-recorded file naming:
 *   /audio/numbers/number-001.mp3 through number-999.mp3
 *   /audio/phrases/please-proceed-to.mp3
 *   /audio/rooms/room-1.mp3 through room-50.mp3
 *   /audio/departments/{department}.mp3
 */

export type CalloutMode = "speech" | "audio";

export interface CalloutOptions {
  token: string;        // e.g. "#042" or "ER-KBH-001"
  room?: string;        // e.g. "Room 3"
  department?: string;  // e.g. "General"
  patientName?: string; // Optional — only spoken if configured
  lang?: string;        // BCP 47 locale, default "en-GB"
  mode?: CalloutMode;   // default "speech"
  volume?: number;      // 0-1, default 1
  rate?: number;        // speech rate 0.5-2, default 0.9
}

/**
 * Speak a queue callout using Web Speech API
 */
export function speakCallout(options: CalloutOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    const { token, room, department, lang = "en-GB", volume = 1, rate = 0.9 } = options;

    // Extract number from token — "#042" → "42", "ER-KBH-001" → "E R 1"
    const numberText = formatTokenForSpeech(token);

    // Build sentence
    let sentence = `Number ${numberText}`;
    if (room) {
      sentence += `, please proceed to ${room}`;
    } else if (department) {
      sentence += `, please proceed to ${department} department`;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = lang;
    utterance.volume = volume;
    utterance.rate = rate;
    utterance.pitch = 1;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Small delay to ensure cancel completes
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  });
}

/**
 * Play pre-recorded audio files by concatenating segments
 */
export async function playAudioCallout(options: CalloutOptions): Promise<void> {
  const { token, room } = options;
  const segments: string[] = [];

  // Extract number from token
  const num = extractNumber(token);
  if (num > 0 && num <= 999) {
    segments.push(`/audio/numbers/number-${String(num).padStart(3, "0")}.mp3`);
  }

  segments.push("/audio/phrases/please-proceed-to.mp3");

  if (room) {
    const roomNum = extractNumber(room);
    if (roomNum > 0 && roomNum <= 50) {
      segments.push(`/audio/rooms/room-${roomNum}.mp3`);
    }
  }

  // Play segments sequentially
  for (const src of segments) {
    await playAudioSegment(src, options.volume ?? 1);
  }
}

function playAudioSegment(src: string, volume: number): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.onended = () => resolve();
    audio.onerror = () => {
      // If audio file doesn't exist, skip silently
      console.warn(`Audio file not found: ${src}`);
      resolve();
    };
    audio.play().catch(() => resolve());
  });
}

/**
 * Main callout function — dispatches to speech or audio mode
 */
export async function calloutNumber(options: CalloutOptions): Promise<void> {
  const mode = options.mode || "speech";

  if (mode === "audio") {
    try {
      await playAudioCallout(options);
    } catch {
      // Fallback to speech if audio fails
      await speakCallout(options);
    }
  } else {
    await speakCallout(options);
  }
}

// ─── Helpers ───

function formatTokenForSpeech(token: string): string {
  // "#042" → "42"
  if (token.startsWith("#")) {
    const num = parseInt(token.slice(1), 10);
    return isNaN(num) ? token : String(num);
  }
  // "ER-KBH-001" → "E R 1"
  if (token.startsWith("ER-")) {
    const parts = token.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    return `E R ${isNaN(num) ? parts[parts.length - 1] : num}`;
  }
  return token;
}

function extractNumber(str: string): number {
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Get available voices for a locale
 */
export function getAvailableVoices(lang?: string): SpeechSynthesisVoice[] {
  if (!("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (!lang) return voices;
  return voices.filter((v) => v.lang.startsWith(lang));
}
