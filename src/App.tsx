import { useState } from 'react';
import { Bot } from 'lucide-react';
import { RobotPanel } from './components/RobotPanel';
import { MemoryList } from './components/MemoryList';
import { ConversationBar } from './components/ConversationBar';
import { useRobotBrain } from './hooks/useRobotBrain';

export default function App() {
  const { robot, memories, busy, sendUserMessage } = useRobotBrain();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-surface-700/60 bg-surface-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-600 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none">
              Robotomia
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              um robô que evolui com as memórias
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 flex flex-col gap-5 lg:flex-row">
        <aside className="lg:w-72 shrink-0">
          <RobotPanel robot={robot} />
        </aside>

        <section className="flex-1 flex flex-col min-h-0 gap-4">
          <MemoryList
            memories={memories}
            interim={interim}
            listening={listening}
          />
          <ConversationBar
            onUserMessage={sendUserMessage}
            busy={busy}
            listening={listening}
            interim={interim}
            onListeningChange={setListening}
            onInterimChange={setInterim}
          />
        </section>
      </main>
    </div>
  );
}
