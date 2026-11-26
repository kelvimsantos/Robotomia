import type { Memory } from '../lib/supabase';
import { History, Mic } from 'lucide-react';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

interface MemoryListProps {
  memories: Memory[];
  interim: string;
  listening: boolean;
}

export function MemoryList({ memories, interim, listening }: MemoryListProps) {
  return (
    <div className="panel p-5 flex flex-col min-h-0 flex-1">
      <div className="flex items-center gap-2 mb-4">
        <History size={16} className="text-accent-400" />
        <h3 className="font-display font-semibold">Memórias</h3>
        <span className="ml-auto text-xs text-slate-500 font-mono">
          {memories.length}
        </span>
      </div>

      <div className="overflow-y-auto flex-1 space-y-2 pr-1 min-h-0">
        {listening && interim && (
          <div className="p-3 rounded-xl bg-surface-850 border border-accent-500/40">
            <p className="text-xs text-slate-500 mb-0.5">
              <Mic size={10} className="inline mr-1" />
              ouvindo...
            </p>
            <p className="text-sm italic text-accent-300">{interim}</p>
          </div>
        )}
        {memories.length === 0 && !interim ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            Nenhuma memória ainda.
            <br />
            Converse com o robô para começar.
          </p>
        ) : (
          [...memories]
            .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
            .map((memory) => (
              <div
                key={memory.id}
                className="p-3 rounded-xl bg-surface-850 border border-surface-700/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold ${
                      memory.speaker === 'user'
                        ? 'text-accent-300'
                        : memory.speaker === 'robot'
                          ? 'text-good-400'
                          : 'text-warn-400'
                    }`}
                  >
                    {memory.speaker === 'user'
                      ? 'Você'
                      : memory.speaker === 'robot'
                        ? 'Robotomia'
                        : 'Sistema'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {timeAgo(memory.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {memory.content}
                </p>
                {(memory.mood_delta !== 0 || memory.knowledge_delta !== 0) && (
                  <div className="flex gap-2 mt-1.5">
                    {memory.mood_delta !== 0 && (
                      <span className="text-[10px] font-mono text-accent-400/80">
                        humor {memory.mood_delta > 0 ? '+' : ''}
                        {memory.mood_delta}
                      </span>
                    )}
                    {memory.knowledge_delta !== 0 && (
                      <span className="text-[10px] font-mono text-good-400/80">
                        conhecimento {memory.knowledge_delta > 0 ? '+' : ''}
                        {memory.knowledge_delta}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
