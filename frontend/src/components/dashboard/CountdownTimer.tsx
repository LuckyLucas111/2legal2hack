import { useEffect, useState } from "react";
import { differenceInSeconds } from "date-fns";

interface CountdownTimerProps {
  label: string;
  deadline: string;
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

export default function CountdownTimer({ label, deadline }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    differenceInSeconds(new Date(deadline), new Date())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(differenceInSeconds(new Date(deadline), new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-mono font-semibold ${getColorClass(remaining)}`}>
        {formatCountdown(remaining)}
      </span>
    </div>
  );
}
