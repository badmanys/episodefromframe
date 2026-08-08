import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, ZoomIn } from 'lucide-react'

export default function FrameViewer({ frame, revealed = false }) {
  const [imageState, setImageState] = useState('loading') // 'loading' | 'loaded' | 'error'
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Reset state when frame changes
  useEffect(() => {
    setImageState('loading')
    setIsFullscreen(false)
  }, [frame?.id])

  return (
    <>
      <div className="glass-card overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border-red-900/20">

        {/* 16:9 frame container */}
        <div className="relative w-full aspect-video bg-black overflow-hidden group">

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
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                      style={{ width: `${w}%` }}
                      className="h-2.5 bg-red-500/20 rounded-full mx-auto shadow-[0_0_10px_rgba(220,38,38,0.2)]"
                    />
                  ))}
                </div>
                {/* Spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-7 h-7 text-red-600/60 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
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
          <div className="absolute inset-0 cursor-pointer" onClick={() => { if (imageState === 'loaded' && revealed) setIsFullscreen(true) }}>
            <motion.img
              key={frame.id}
              src={frame.image}
              alt={revealed ? `${frame.title} – Part ${frame.part}, Ep. ${frame.episode}` : 'Anime frame – uhádni odkud'}
              onLoad={() => setImageState('loaded')}
              onError={() => setImageState('error')}
              animate={{
                filter: imageState === 'loaded'
                  ? revealed ? 'blur(0px) brightness(1)' : 'blur(30px) brightness(0.3)'
                  : 'blur(0px) brightness(0)',
                scale: imageState === 'loaded' && !revealed ? 1.2 : 1,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              style={{ willChange: 'filter, transform' }}
            />
            {revealed && imageState === 'loaded' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                <p className="text-white font-bold tracking-widest uppercase flex items-center gap-2"><ZoomIn className="w-5 h-5"/> Zvětšit</p>
              </div>
            )}
          </div>
        )}

        {/* "Mystery" overlay shown when image is loaded but not yet revealed */}
        <AnimatePresence>
          {imageState === 'loaded' && !revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 pointer-events-none"
            >
              <div className="w-16 h-16 rounded-2xl bg-black/50 backdrop-blur-md
                              border border-red-500/30 flex items-center justify-center
                              shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                <Eye className="w-8 h-8 text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
              </div>
              <p className="text-red-100/60 text-[10px] font-black tracking-[0.3em] uppercase drop-shadow-md">
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
            <div className="px-5 py-4 bg-gradient-to-t from-red-950/20 to-transparent border-t border-red-900/30 flex items-center justify-between">
              <div>
                <p className="text-red-100 font-bold text-sm uppercase tracking-wider">{frame.title}</p>
                <p className="text-red-400/60 font-black text-[10px] mt-1 uppercase tracking-[0.2em]">
                  Part {frame.part} · Epizoda {frame.episode}
                </p>
              </div>
              <span className="text-2xl drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">🎬</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && frame?.image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFullscreen(false)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center cursor-zoom-out p-4"
          >
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={frame.image} 
              alt="Fullscreen frame" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.2)] border border-white/10" 
            />
            <button className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/50 p-2 rounded-full border border-white/10">
              <EyeOff className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
