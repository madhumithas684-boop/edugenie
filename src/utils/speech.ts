export function speakText(text: string, onEnd?: () => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip markdown formatting for cleaner speech
  const clean = text
    .replace(/[#*_`~>-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return () => {};

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Prefer a natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) => (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")) && v.lang.startsWith("en")
  ) || voices.find((v) => v.lang.startsWith("en"));

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
