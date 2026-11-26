import { useCallback, useEffect, useRef, useState } from 'react';

type SpeakFn = (text: string) => void;

export function useSpeech() {
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('robotomia-tts') === 'on';
  });
  const [speaking, setSpeaking] = useState(false);
  const enabledRef = useRef(ttsEnabled);

  useEffect(() => {
    enabledRef.current = ttsEnabled;
    localStorage.setItem('robotomia-tts', ttsEnabled ? 'on' : 'off');
  }, [ttsEnabled]);

  const speak: SpeakFn = useCallback((text: string) => {
    if (!enabledRef.current || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const makeUtterance = (): SpeechSynthesisUtterance => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.02;
      utterance.pitch = 0.9;
      const voice = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang.startsWith('pt'));
      if (voice) utterance.voice = voice;
      return utterance;
    };

    // some browsers load voices asynchronously; wait so pt-BR voice is found
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        const utterance = makeUtterance();
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.onvoiceschanged = null;
      };
      return;
    }

    const utterance = makeUtterance();
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { ttsEnabled, setTtsEnabled, speaking, speak, stopSpeaking };
}
