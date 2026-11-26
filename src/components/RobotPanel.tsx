import { useEffect, useState } from 'react';
import type { Robot } from '../lib/supabase';
import { Battery, Brain, Sparkles, Wind } from 'lucide-react';

interface StatBarProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}

function StatBar({ icon, label, value, colorClass }: StatBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="flex items-center gap-1.5 text-slate-400">
          {icon}
          {label}
        </span>
        <span className="font-mono text-slate-300">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function RobotPanel({ robot }: { robot: Robot | null }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!robot) return;
    const tick = () => {
      const diff = Date.now() - new Date(robot.created_at).getTime();
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      setElapsed(`${hours}h ${minutes}m`);
    };
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, [robot]);

  if (!robot) return null;

  return (
    <div className="panel p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <div
            className={`w-14 h-14 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center text-3xl ${
              robot.energy > 20 ? 'animate-pulse-soft' : 'animate-blink'
            }`}
          >
            {robot.energy > 60 ? '🤖' : robot.energy > 20 ? '😮‍💨' : '🥴'}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-900 ${
              robot.energy > 20 ? 'bg-good-500' : 'bg-bad-500'
            }`}
          />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg leading-tight">{robot.name}</h2>
          <p className="text-xs text-slate-400">vivo há {elapsed}</p>
        </div>
      </div>

      <div className="space-y-3.5">
        <StatBar
          icon={<Battery size={13} />}
          label="Energia"
          value={robot.energy}
          colorClass={robot.energy > 40 ? 'bg-good-500' : 'bg-bad-500'}
        />
        <StatBar
          icon={<Sparkles size={13} />}
          label="Humor"
          value={robot.mood}
          colorClass={robot.mood > 40 ? 'bg-accent-400' : 'bg-warn-500'}
        />
        <StatBar
          icon={<Brain size={13} />}
          label="Conhecimento"
          value={robot.knowledge}
          colorClass="bg-accent-500"
        />
        <StatBar
          icon={<Wind size={13} />}
          label="Autonomia"
          value={robot.autonomy}
          colorClass="bg-slate-400"
        />
      </div>

      <div className="mt-5 p-3 rounded-xl bg-surface-850 border border-surface-700/50">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
          Aspiração atual
        </p>
        <p className="text-sm text-accent-300 font-medium">{robot.aspiration}</p>
      </div>
    </div>
  );
}
