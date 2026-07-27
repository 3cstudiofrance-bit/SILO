import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = { open: 6000, mariage: 7000, artist_corp: 8000, portal: 6000, close: 6000 };

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Persistent Background Texture */}
      <motion.div 
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/texture.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        animate={{ scale: [1, 1.05, 1], filter: ['contrast(1)', 'contrast(1.2)', 'contrast(1)'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Background Gradient Orbs */}
      <motion.div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] bg-primary/20 mix-blend-screen"
        animate={{ 
          x: currentScene === 1 ? '-20vw' : currentScene === 2 ? '-40vw' : 0,
          y: currentScene === 1 ? '10vh' : currentScene === 3 ? '40vh' : 0,
          scale: currentScene === 4 ? 1.5 : 1,
          opacity: currentScene === 4 ? 0.3 : 0.15
        }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />
      
      <motion.div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[80px] bg-white/5 mix-blend-screen"
        animate={{ 
          x: currentScene === 2 ? '30vw' : currentScene === 4 ? '10vw' : 0,
          y: currentScene === 1 ? '-20vh' : 0,
          opacity: currentScene === 3 ? 0.2 : 0.1
        }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />

      {/* Frame / Cinematic Letterbox */}
      <div className="absolute top-0 left-0 w-full h-[3vh] bg-black z-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[3vh] bg-black z-50 pointer-events-none" />

      {/* Main Content inside AnimatePresence */}
      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="open" />}
        {currentScene === 1 && <Scene2 key="mariage" />}
        {currentScene === 2 && <Scene3 key="artist_corp" />}
        {currentScene === 3 && <Scene4 key="portal" />}
        {currentScene === 4 && <Scene5 key="close" />}
      </AnimatePresence>
    </div>
  );
}
