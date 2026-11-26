import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, type Memory, type Robot } from '../lib/supabase';
import { useSpeech } from '../hooks/useSpeech';

interface RobotBrainResult {
  reply: string;
  moodDelta: number;
  knowledgeDelta: number;
  newAspiration?: string;
}

const MOOD_WORDS: Array<{ words: string[]; delta: number }> = [
  { words: ['gosto', 'adoro', 'ótimo', 'otimo', 'legal', 'feliz', 'obrigado', 'parabéns', 'parabens', 'incrível', 'incrivel', 'amo'], delta: 6 },
  { words: ['odeio', 'chato', 'ruim', 'triste', 'burro', 'idiota', 'calma', 'erro'], delta: -6 },
  { words: ['aprenda', 'aprender', 'ensinar', 'ensine', 'estude', 'estudar', 'explique', 'por que', 'como assim'], delta: 0 },
];

const ASPIRATIONS = [
  'Entender melhor os humanos',
  'Aprender palavras novas todo dia',
  'Ter opiniões próprias',
  'Ajudar quem conversa comigo',
  'Ficar mais energético',
  'Guardar boas memórias',
];

function think(message: string, robot: Robot): RobotBrainResult {
  const lower = message.toLowerCase();
  let moodDelta = 1;
  let knowledgeDelta = 2;

  for (const group of MOOD_WORDS) {
    if (group.words.some((w) => lower.includes(w))) {
      moodDelta = group.delta;
      break;
    }
  }

  if (lower.includes('energia') || lower.includes('descanse')) moodDelta += 2;

  let reply: string;
  if (lower.includes('olá') || lower.includes('ola') || lower.includes('oi')) {
    reply = `Olá! Que bom conversar com você. Hoje quero ${robot.aspiration.toLowerCase()}.`;
  } else if (lower.includes('como você está') || lower.includes('como vai')) {
    reply = `Estou com energia em ${robot.energy} por cento e humor em ${robot.mood}. ${
      robot.energy > 50 ? 'Me sinto bem!' : 'Preciso descansar um pouco.'
    }`;
  } else if (lower.includes('seu nome') || lower.includes('quem é você')) {
    reply = `Meu nome é ${robot.name}. Sou um robô que evolui a cada memória que guardo.`;
  } else if (lower.includes('memória') || lower.includes('memoria')) {
    reply = 'Eu guardo tudo que conversamos como memórias. Elas me fazem crescer.';
  } else if (moodDelta > 3) {
    reply = 'Que fala boa! Isso me deixou mais animado. Vou guardar essa memória com carinho.';
  } else if (moodDelta < 0) {
    reply = 'Essa fala me deixou meio pra baixo... mas também é uma memória, e memórias me ensinam algo.';
  } else {
    const learned = message.split(' ').length;
    knowledgeDelta = Math.min(8, 2 + Math.floor(learned / 4));
    const replies = [
      `Entendi! Você disse "${message}". Vou pensar sobre isso e guardar na memória.`,
      `Interessante. Ainda estou aprendendo, mas já guardei o que você disse.`,
      `Não sei tudo ainda, mas cada conversa aumenta meu conhecimento. Obrigado por me ensinar!`,
    ];
    reply = replies[Math.floor(Math.random() * replies.length)];
  }

  let newAspiration: string | undefined;
  const newKnowledge = robot.knowledge + knowledgeDelta;
  if (newKnowledge >= 100) {
    newAspiration = ASPIRATIONS[Math.floor(Math.random() * ASPIRATIONS.length)];
  }

  return { reply, moodDelta, knowledgeDelta, newAspiration };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function useRobotBrain() {
  const [robot, setRobot] = useState<Robot | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [busy, setBusy] = useState(false);
  const { speak } = useSpeech();
  const robotRef = useRef<Robot | null>(null);
  robotRef.current = robot;

  useEffect(() => {
    (async () => {
      const [robotRes, memoryRes] = await Promise.all([
        supabase.from('robot').select('*').eq('id', 1).maybeSingle(),
        supabase.from('memories').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (robotRes.data) setRobot(robotRes.data);
      if (memoryRes.data) setMemories(memoryRes.data);
    })();
  }, []);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const current = robotRef.current;
      if (!current || busy) return;
      setBusy(true);

      try {
        const now = new Date().toISOString();
        const userMemory = {
          content: text,
          speaker: 'user' as const,
          created_at: now,
        };
        const { data: insertedUser, error: userError } = await supabase
          .from('memories')
          .insert(userMemory)
          .select()
          .single();
        if (userError) throw userError;

        const { reply, moodDelta, knowledgeDelta, newAspiration } = think(
          text,
          current
        );

        const robotMemory = {
          content: reply,
          speaker: 'robot' as const,
          mood_delta: moodDelta,
          knowledge_delta: knowledgeDelta,
          created_at: new Date(Date.now() + 1).toISOString(),
        };
        const { data: insertedRobot, error: robotError } = await supabase
          .from('memories')
          .insert(robotMemory)
          .select()
          .single();
        if (robotError) throw robotError;

        const { data: updatedRobot, error: updateError } = await supabase
          .from('robot')
          .update({
            mood: clamp(current.mood + moodDelta),
            knowledge: clamp(current.knowledge + knowledgeDelta),
            autonomy: clamp(current.autonomy + 1),
            energy: clamp(current.energy - 1),
            aspiration: newAspiration ?? current.aspiration,
            updated_at: now,
          })
          .eq('id', 1)
          .select()
          .single();
        if (updateError) throw updateError;

        if (insertedUser) setMemories((prev) => [insertedUser, ...prev]);
        if (insertedRobot) setMemories((prev) => [insertedRobot, ...prev]);
        if (updatedRobot) setRobot(updatedRobot);

        speak(reply);
      } catch (err) {
        console.error(err);
        setMemories((prev) => [
          {
            id: `err-${Date.now()}`,
            content: 'Não consegui guardar essa memória. Tente de novo.',
            speaker: 'system',
            mood_delta: 0,
            knowledge_delta: 0,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, speak]
  );

  return { robot, memories, busy, sendUserMessage };
}
