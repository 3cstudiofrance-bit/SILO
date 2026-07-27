import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 4500),
      setTimeout(() => setPhase(5), 6500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex"
      initial={{ opacity: 0, x: '10vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1.2 }}
    >
      {/* Left Split - Artiste */}
      <motion.div 
        className="relative h-full overflow-hidden"
        initial={{ width: '0%' }}
        animate={phase >= 1 ? { width: '50%' } : { width: '0%' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 bg-background z-10 opacity-60 mix-blend-multiply" />
        <motion.img 
          src={`${import.meta.env.BASE_URL}images/artist.png`}
          alt="Artist"
          className="absolute inset-0 w-[50vw] h-full object-cover"
          animate={{ scale: [1, 1.1] }}
          transition={{ duration: 8, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center p-8 bg-black/40">
          <motion.div 
            className="text-primary font-sans tracking-widest text-[1vw] mb-4 uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          >
            Service 02
          </motion.div>
          <motion.h2 
            className="font-display text-[4vw] font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            Clips Artistes
          </motion.h2>
        </div>
      </motion.div>

      {/* Right Split - Corporate */}
      <motion.div 
        className="relative h-full overflow-hidden border-l border-primary/30"
        initial={{ width: '0%' }}
        animate={phase >= 3 ? { width: '50%' } : { width: '0%' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 bg-background z-10 opacity-60 mix-blend-multiply" />
        <motion.img 
          src={`${import.meta.env.BASE_URL}images/corporate.png`}
          alt="Corporate"
          className="absolute inset-0 w-[50vw] h-full object-cover"
          animate={{ scale: [1.1, 1] }}
          transition={{ duration: 8, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center p-8 bg-black/40">
          <motion.div 
            className="text-primary font-sans tracking-widest text-[1vw] mb-4 uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          >
            Service 03 & 04
          </motion.div>
          <motion.h2 
            className="font-display text-[4vw] font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            Corporate &<br/>Réseaux Sociaux
          </motion.h2>
        </div>
      </motion.div>
    </motion.div>
  );
}
