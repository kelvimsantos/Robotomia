import { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Loader2 } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ConversationBarProps {
  onUserMessage: (text: string) => void;
  busy: boolean;
  listening: boolean;
  interim: string;
  onListeningChange: (value: boolean) => void;
  onInterimChange: (value: string) => void;
}

export function ConversationBar({
  onUserMessage,
  busy,
  listening,
  interim,
  onListeningChange,
  onInterimChange,
}: ConversationBarProps) {
  const { ttsEnabled, setTtsEnabled, speaking, stopSpeaking } = useSpeech();
  const [text, setText] = useState('');

  const handleFinalText = (spoken: string) => {
    onInterimChange('');
    onUserMessage(spoken);
  };

  const { error, supported, start: startRaw, stop: stopRaw, setError } =
    useSpeechRecognition(handleFinalText);

  const start = () => {
    onListeningChange(true);
    startRaw();
  };
  const stop = () => {
    onListeningChange(false);
    onInterimChange('');
    stopRaw();
  };

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    onUserMessage(trimmed);
    setText('');
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-bad-500/10 border border-bad-500/30 text-xs text-bad-400">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-semibold">
            ok
          </button>
        </div>
      )}

      <div className="panel p-2 flex items-center gap-2">
        <button
          onClick={listening ? stop : start}
          disabled={!supported}
          title={supported ? 'Falar com o robô' : 'Reconhecimento de voz não suportado neste navegador'}
          className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            listening
              ? 'bg-bad-500 text-white animate-pulse-soft shadow-lg shadow-bad-500/30'
              : supported
                ? 'bg-surface-800 text-slate-300 hover:bg-surface-700 hover:text-white'
                : 'bg-surface-850 text-slate-600 cursor-not-allowed'
          }`}
        >
          {listening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          onClick={() => {
            if (speaking) {
              stopSpeaking();
            }
            setTtsEnabled(!ttsEnabled);
          }}
          title={ttsEnabled ? 'Desativar voz do robô' : 'Ativar voz do robô'}
          className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            ttsEnabled
              ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/30'
              : 'bg-surface-800 text-slate-400 hover:bg-surface-700'
          }`}
        >
          {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <input
          value={listening ? interim || text : text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={
            listening ? 'Ouvindo você falar...' : 'Digite ou toque no microfone...'
          }
          className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-500 min-w-0"
        />

        <button
          onClick={send}
          disabled={busy || !text.trim()}
          className="shrink-0 h-11 px-4 rounded-xl bg-accent-600 text-white flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:bg-accent-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 px-2">
        {ttsEnabled
          ? speaking
            ? 'Robotomia está falando...'
            : 'Voz do robô ativada — ele responde falando.'
          : 'Voz do robô desativada — ele responde apenas por texto.'}
      </p>
    </div>
  );
}
