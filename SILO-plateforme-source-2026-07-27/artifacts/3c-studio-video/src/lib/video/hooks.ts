import { useState, useEffect } from 'react';

/**
 * useVideoPlayer - Manages the video recording lifecycle and scene progression.
 * DO NOT MODIFY this file. The recording/export pipeline depends on its exact implementation.
 */
export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const sceneKeys = Object.keys(durations);

  useEffect(() => {
    let timeoutId: number;
    
    // Call startRecording on mount
    if (typeof window !== 'undefined' && (window as any).startRecording) {
      (window as any).startRecording();
    }

    function advanceScene() {
      setCurrentScene((prev) => {
        const nextScene = prev + 1;
        
        // If we've completed all scenes
        if (nextScene >= sceneKeys.length) {
          // Stop recording after the first full pass
          if (typeof window !== 'undefined' && (window as any).stopRecording) {
            (window as any).stopRecording();
          }
          // Loop back to start
          return 0;
        }
        
        return nextScene;
      });
    }

    function scheduleNext() {
      const duration = durations[sceneKeys[currentScene]];
      timeoutId = setTimeout(() => {
        advanceScene();
      }, duration);
    }

    scheduleNext();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentScene, durations, sceneKeys]);

  return { currentScene };
}
