import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface AnimatedCoinCounterProps {
  value: number;
  duration?: number;
  showDeltaBadge?: boolean;
  className?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  enableSound?: boolean;
}

/**
 * Web Audio gentle synthesizer chime for coin gains
 */
function playCoinPickupSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // First high chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1318.51, now); // E6
    osc1.frequency.exponentialRampToValueAtTime(1760.0, now + 0.08); // A6
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second sparkle harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1975.53, now + 0.06); // B6
    osc2.frequency.exponentialRampToValueAtTime(2637.02, now + 0.16); // E7
    gain2.gain.setValueAtTime(0.06, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.35);
  } catch {
    // Ignore audio restrictions gracefully
  }
}

/**
 * AnimatedCoinCounter
 * Smoothly rolls up/animates user coins when increased (Counter effect),
 * with golden glowing highlights and floating delta badges (+N Coins).
 */
export const AnimatedCoinCounter: React.FC<AnimatedCoinCounterProps> = ({
  value,
  duration,
  showDeltaBadge = true,
  className = '',
  prefix,
  suffix,
  enableSound = true,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [isRollingUp, setIsRollingUp] = useState<boolean>(false);
  const [floatingDelta, setFloatingDelta] = useState<{ id: number; amount: number } | null>(null);
  const prevValueRef = useRef<number>(value);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevValueRef.current;
    
    // If coins increased -> Trigger exciting counter animation
    if (value > prev) {
      const delta = value - prev;
      setIsRollingUp(true);

      if (enableSound) {
        playCoinPickupSound();
      }

      if (showDeltaBadge) {
        setFloatingDelta({ id: Date.now(), amount: delta });
        const timer = setTimeout(() => {
          setFloatingDelta((curr) => (curr?.amount === delta ? null : curr));
        }, 1800);
        return () => clearTimeout(timer);
      }

      // Calculate dynamic duration based on delta magnitude (800ms - 2200ms)
      const targetDuration = duration ?? Math.min(2200, Math.max(750, Math.log10(delta + 1) * 350));
      const startTime = performance.now();
      const startValue = prev;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const animateStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / targetDuration);
        
        // Quartic Ease-Out curve for dramatic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(startValue + delta * easeOut);

        setDisplayValue(current);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateStep);
        } else {
          setDisplayValue(value);
          setIsRollingUp(false);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateStep);
    } else {
      // If coins decreased or unchanged, update immediately for responsive gameplay
      setDisplayValue(value);
      setIsRollingUp(false);
    }

    prevValueRef.current = value;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration, showDeltaBadge, enableSound]);

  return (
    <span className={`relative inline-flex items-center tabular-nums font-mono ${className}`}>
      {prefix}
      
      <span
        className={`transition-all duration-300 font-bold ${
          isRollingUp
            ? 'text-[#FFF275] scale-105 drop-shadow-[0_0_10px_rgba(255,215,0,0.85)] animate-pulse'
            : ''
        }`}
      >
        {displayValue.toLocaleString('en-US')}
      </span>

      {suffix}

      {/* Floating Gain Badge (+X 💰) */}
      {floatingDelta && (
        <span
          key={floatingDelta.id}
          className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-[#FFD700] to-yellow-300 text-[#09101D] text-[10px] font-black shadow-lg shadow-[#FFD700]/30 animate-coin-float whitespace-nowrap border border-white/60"
        >
          <Sparkles size={10} className="text-amber-950 animate-spin" />
          <span>+{floatingDelta.amount.toLocaleString('en-US')}</span>
        </span>
      )}
    </span>
  );
};

export default AnimatedCoinCounter;
