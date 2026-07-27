import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Accent line
      setTimeout(() => setPhase(2), 1500),  // 3C STUDIO
      setTimeout(() => setPhase(3), 2500),  // Subtitle
      setTimeout(() => setPhase(4), 3500),  // Words
      setTimeout(() => setPhase(5), 5000),  // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center flex-col"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 0.9 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center">
        {/* Accent Line */}
        <motion.div 
          className="h-[2px] bg-primary mb-8"
          initial={{ width: 0 }}
          animate={phase >= 1 ? { width: '80%' } : { width: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />

        <motion.h1 
          className="font-display text-[8vw] font-bold tracking-tight uppercase leading-none"
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 40, filter: 'blur(10px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          3C Studio
        </motion.h1>

        <motion.div 
          className="flex items-center gap-6 mt-6 text-[1.5vw] font-sans tracking-[0.2em] text-white/60 uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1 }}
        >
          <span>Paris</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Audiovisuel</span>
        </motion.div>

        <motion.div 
          className="mt-12 flex gap-4 text-[1.2vw] font-sans tracking-widest text-primary"
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.span initial={{ opacity: 0, x: -20 }} animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }} transition={{ delay: 0.1 }}>CRÉATION</motion.span>
          <span className="text-white/40">•</span>
          <motion.span initial={{ opacity: 0, x: -20 }} animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }} transition={{ delay: 0.3 }}>CONTENU</motion.span>
          <span className="text-white/40">•</span>
          <motion.span initial={{ opacity: 0, x: -20 }} animate={phase >= 4 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }} transition={{ delay: 0.5 }}>CROISSANCE</motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}
