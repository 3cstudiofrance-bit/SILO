import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene4() {
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
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: '-10vh' }}
      transition={{ duration: 1 }}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div 
          className="w-24 h-24 rounded-2xl border border-primary/50 flex items-center justify-center mb-8 relative"
          initial={{ rotate: -90, opacity: 0, scale: 0 }}
          animate={phase >= 1 ? { rotate: 0, opacity: 1, scale: 1 } : { rotate: -90, opacity: 0, scale: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="absolute inset-0 rounded-2xl border border-primary animate-ping opacity-20" />
          <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </motion.div>

        <motion.h2 
          className="font-display text-[5vw] font-bold mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1 }}
        >
          Portail Client <span className="text-primary italic">Dédié</span>
        </motion.h2>

        <motion.p 
          className="font-sans text-[1.5vw] text-white/60 tracking-wide uppercase"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}
        >
          Suivez votre projet en temps réel
        </motion.p>
        
        <div className="flex gap-12 mt-12">
          {['Devis', 'Factures', 'Livrables'].map((item, i) => (
            <motion.div 
              key={item}
              className="text-[1.1vw] font-sans text-white/40 uppercase tracking-widest flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.5 + i * 0.2 }}
            >
              <div className="w-12 h-[2px] bg-white/10" />
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
