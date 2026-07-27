import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 5500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: '-10vw' }}
      transition={{ duration: 1.2 }}
    >
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.2, opacity: 0, filter: 'blur(20px)' }}
        animate={{ scale: 1, opacity: 0.6, filter: 'blur(0px)' }}
        transition={{ duration: 3, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/wedding.png`} 
          alt="Wedding" 
          className="w-full h-full object-cover mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </motion.div>

      <div className="relative z-10 pl-[15vw] w-1/2">
        <motion.div 
          className="text-primary font-sans tracking-widest text-[1vw] mb-4 uppercase"
          initial={{ opacity: 0, x: -20 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.8 }}
        >
          Service 01
        </motion.div>
        
        <motion.h2 
          className="font-display text-[6vw] font-bold leading-none mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          Films de <br/>
          <span className="text-white/40 italic">Mariage</span>
        </motion.h2>

        <motion.p 
          className="font-sans text-[1.2vw] text-white/70 max-w-md leading-relaxed"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}
        >
          Une approche cinématographique pour capturer l'émotion pure. Des souvenirs inoubliables avec une qualité premium.
        </motion.p>
      </div>
    </motion.div>
  );
}
