import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center flex-col"
      initial={{ opacity: 0, y: '10vh' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="mb-8"
        >
          {/* Fallback to styled text if logo image is tricky to size dynamically in video */}
          <div className="font-display text-[10vw] font-bold leading-none tracking-tighter">
            3C<span className="text-primary">.</span>
          </div>
        </motion.div>

        <motion.h2 
          className="font-display text-[4vw] italic text-white/90 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.2 }}
        >
          "Votre vision, notre expertise."
        </motion.h2>

        <motion.div 
          className="h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: '40vw' } : { width: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        <motion.div 
          className="mt-8 text-[1.2vw] font-sans tracking-[0.3em] uppercase text-white/50 flex flex-col gap-2"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <span>Un studio dirigé par</span>
          <span className="text-white">Said Fofana</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
