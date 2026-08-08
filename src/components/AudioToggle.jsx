import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, toggleSound, playClickSound } from '../lib/audio.js';

export default function AudioToggle({ className = '' }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  const handleToggle = () => {
    const newState = toggleSound();
    setEnabled(newState);
    if (newState) {
      // Small timeout so state updates before we try to play sound
      setTimeout(playClickSound, 50);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleToggle}
      className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors shadow-lg ${className}`}
      title={enabled ? 'Vypnout zvuky' : 'Zapnout zvuky'}
    >
      <AnimatePresence mode="wait">
        {enabled ? (
          <motion.div key="on" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
            <Volume2 className="w-5 h-5 text-red-400 drop-shadow-[0_0_5px_rgba(220,38,38,0.6)]" />
          </motion.div>
        ) : (
          <motion.div key="off" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
            <VolumeX className="w-5 h-5 text-white/40" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
