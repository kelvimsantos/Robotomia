import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(onFinalText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalCallbackRef = useRef(onFinalText);
  finalCallbackRef.current = onFinalText;

  const supported = getRecognitionCtor() !== null;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('Seu navegador não suporta reconhecimento de voz. Use o Chrome ou o Edge.');
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setError(null);
    setInterim('');
    const recognition = new Ctor();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText);
      if (finalText.trim()) {
        setInterim('');
        finalCallbackRef.current(finalText.trim());
      }
    };
    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };
    recognition.onerror = (event) => {
      setListening(false);
      setInterim('');
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Permissão do microfone negada. Libere o acesso no navegador.');
      } else if (event.error === 'no-speech') {
        setError('Não ouvi nada. Tente falar de novo.');
      } else if (event.error !== 'aborted') {
        setError('Não consegui ouvir. Tente novamente.');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      setError('Não consegui acessar o microfone.');
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim('');
  }, []);

  return { listening, interim, error, supported, start, stop, setError };
}
