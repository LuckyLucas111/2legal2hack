import { useEffect, useState } from "react";
import { differenceInSeconds } from "date-fns";

interface CountdownTimerProps {
  label: string;
  deadline: string;
  maxHours?: number;
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "EXPIRED";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getColorClass(totalSeconds: number): string {
  if (totalSeconds <= 0) return "text-red-600 animate-pulse";
  const hours = totalSeconds / 3600;
  if (hours < 6) return "text-red-600";
  if (hours < 12) return "text-orange-500";
  if (hours < 24) return "text-yellow-500";
  return "text-green-600";
}

function getBarColor(totalSeconds: number): string {
  if (totalSeconds <= 0) return "bg-red-600";
  const hours = totalSeconds / 3600;
  if (hours < 6) return "bg-red-600";
  if (hours < 12) return "bg-orange-500";
  if (hours < 24) return "bg-yellow-500";
  return "bg-green-600";
}

export default function CountdownTimer({ label, deadline, maxHours = 72 }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    differenceInSeconds(new Date(deadline), new Date())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(differenceInSeconds(new Date(deadline), new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const maxSeconds = maxHours * 3600;
  const pct = Math.max(0, Math.min(100, (remaining / maxSeconds) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">{label}:</span>
        <span className={`font-mono font-bold ${getColorClass(remaining)}`}>
          {formatCountdown(remaining)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${getBarColor(remaining)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
