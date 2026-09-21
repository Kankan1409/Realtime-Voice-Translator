import { motion } from 'motion/react';

interface AudioWaveformProps {
  isActive: boolean;
  color?: string;
  barsCount?: number;
}

export function AudioWaveform({ isActive, color = 'bg-amber-400', barsCount = 12 }: AudioWaveformProps) {
  return (
    <div className="flex items-center justify-center gap-1 h-8 px-2">
      {Array.from({ length: barsCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${color}`}
          animate={
            isActive
              ? {
                  height: [8, Math.sin(i * 0.8) * 16 + 20, 8],
                  opacity: [0.6, 1, 0.6],
                }
              : { height: 4, opacity: 0.3 }
          }
          transition={
            isActive
              ? {
                  duration: 0.7,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.06,
                }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}
