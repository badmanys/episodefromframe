import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function FrameViewer({ frame, revealed = false }) {
  const [imageState, setImageState] = useState('loading') // 'loading' | 'loaded' | 'error'

  // Reset state when frame changes
  useEffect(() => {
    setImageState('loading')
  }, [frame?.id])

  return (
    <div className="glass-card overflow-hidden">

      {/* 16:9 frame container */}
      <div className="relative w-full aspect-video bg-slate-950/80 overflow-hidden">

        {/* Skeleton shimmer (while loading) */}
        <AnimatePresence>
          {imageState === 'loading' && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            >
              {/* Shimmer bars */}
              <div className="w-full px-12 space-y-2.5 absolute top-1/3">
                {[70, 50, 60].map((w, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                    style={{ width: `${w}%` }}
                    className="h-2.5 bg-white/10 rounded-full mx-auto"
                  />
                ))}
              </div>
              {/* Spinner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-7 h-7 text-indigo-500/60" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {imageState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-3">
            <EyeOff className="w-10 h-10" />
            <p className="text-sm">Obrázek není k dispozici</p>
          </div>
        )}

        {/* The actual frame image */}
        {frame?.image && (
          <motion.img
            key={frame.id}
            src={frame.image}
            alt={revealed ? `${frame.title} – Part ${frame.part}, Ep. ${frame.episode}` : 'Anime frame – uhádni odkud'}
            onLoad={() => setImageState('loaded')}
            onError={() => setImageState('error')}
            animate={{
              filter: imageState === 'loaded'
                ? revealed ? 'blur(0px) brightness(1)' : 'blur(24px) brightness(0.4)'
                : 'blur(0px) brightness(0)',
              scale: imageState === 'loaded' && !revealed ? 1.15 : 1,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ willChange: 'filter, transform' }}
          />
        )}

        {/* "Mystery" overlay shown when image is loaded but not yet revealed */}
        <AnimatePresence>
          {imageState === 'loaded' && !revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2.5"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm
                              border border-white/20 flex items-center justify-center
                              shadow-xl shadow-black/40">
                <Eye className="w-7 h-7 text-white/70" />
              </div>
              <p className="text-white/35 text-xs font-semibold tracking-[0.2em] uppercase">
                Ze které epizody?
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reveal shimmer flash */}
        <AnimatePresence>
          {revealed && imageState === 'loaded' && (
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-white pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Metadata strip (only when revealed) */}
      <AnimatePresence>
        {revealed && frame && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">{frame.title}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  Part {frame.part} · Epizoda {frame.episode}
                </p>
              </div>
              <span className="text-2xl">🎬</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
