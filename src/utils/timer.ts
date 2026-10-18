/**
 * Core time calculation logic for the birthday countdown/countup timer.
 */

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

export function calculateTimeDifference(targetDateStr: string, now: Date = new Date()): TimeRemaining {
  const targetTime = new Date(targetDateStr).getTime();
  const currentTime = now.getTime();
  const diffMs = targetTime - currentTime;
  const isPast = diffMs <= 0;
  
  const absDiffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  
  const days = Math.floor(absDiffSeconds / (3600 * 24));
  const hours = Math.floor((absDiffSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((absDiffSeconds % 3600) / 60);
  const seconds = absDiffSeconds % 60;
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isPast,
    totalSeconds: absDiffSeconds
  };
}

export function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

export function formatTimeDisplay(time: TimeRemaining): {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  return {
    days: padZero(time.days),
    hours: padZero(time.hours),
    minutes: padZero(time.minutes),
    seconds: padZero(time.seconds),
  };
}
