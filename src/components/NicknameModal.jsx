import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Check, AlertCircle, X } from 'lucide-react'

export default function NicknameModal({ onSave, onCancel, allowCancel }) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    const trimmed = nickname.trim()
    if (trimmed.length < 2) {
      setError('Přezdívka musí mít alespoň 2 znaky.')
      return
    }
    if (trimmed.length > 15) {
      setError('Přezdívka může mít maximálně 15 znaků.')
      return
    }
    setError('')
    onSave(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#080611]/80 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm bg-[#131124] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-teal-500" />
        
        {allowCancel && (
          <motion.button
            onClick={onCancel}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}

        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 mx-auto">
          <User className="w-7 h-7 text-indigo-400" />
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">Vítej ve hře!</h2>
        <p className="text-white/40 text-sm text-center mb-6">Zadej svou přezdívku, ať ostatní vědí, proti komu hrají.</p>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={e => { setNickname(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Tvoje přezdívka..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors transition-opacity transition-transform text-center text-lg"
              autoFocus
              maxLength={15}
            />
            {error && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs font-medium flex items-center justify-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </motion.p>
            )}
          </div>

          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 shadow-indigo-900/30 font-bold flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Uložit přezdívku
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
