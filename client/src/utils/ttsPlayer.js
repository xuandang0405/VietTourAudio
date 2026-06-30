let activeUtterance = null;

export function stopSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  window.speechSynthesis.cancel();
  activeUtterance = null;
}

export function speakText(text, languageCode = 'vi-VN', options = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    return { supported: false };
  }

  stopSpeech();

  activeUtterance = new window.SpeechSynthesisUtterance(text);
  activeUtterance.lang = languageCode;
  activeUtterance.rate = languageCode.startsWith('vi') ? 0.95 : 1;
  activeUtterance.pitch = 1;
  activeUtterance.onend = () => {
    activeUtterance = null;
    options.onEnd?.();
  };
  activeUtterance.onerror = () => {
    activeUtterance = null;
    options.onError?.();
  };

  window.speechSynthesis.speak(activeUtterance);

  return { supported: true };
}
