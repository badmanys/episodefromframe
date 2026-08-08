import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Target, Trophy, Calendar, Database, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'

const TABS = [
  { id: 'basics', label: 'Jak hrát', icon: Target },
  { id: 'scoring', label: 'Bodovací systém', icon: Trophy },
  { id: 'daily', label: 'Denní Výzva', icon: Calendar },
  { id: 'database', label: 'Seznam Anime', icon: Database },
]

export default function WikiModal({ isOpen, onClose, animes = [] }) {
  const [activeTab, setActiveTab] = useState('basics')

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-5xl h-[85vh] bg-[#090a0f] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col sm:flex-row relative"
        >
          {/* Glowing background */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(220,38,38,0.05) 0%, transparent 70%)` }} />

          {/* Header for mobile, close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation Sidebar */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-white/10 bg-white/5 flex flex-col z-10">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-500/30 text-red-500 flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-black uppercase tracking-widest text-sm">Herní Wiki</h2>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Pravidla</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex sm:flex-col gap-2">
              {TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left whitespace-nowrap sm:whitespace-normal flex-shrink-0 ${isActive ? 'bg-red-500/20 border border-red-500/30 text-white shadow-[0_0_15px_rgba(220,38,38,0.15)]' : 'bg-transparent border border-transparent text-white/50 hover:text-white hover:bg-white/5'}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-red-400' : 'text-white/30'}`} />
                    <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10 relative z-10 text-white/80">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {activeTab === 'basics' && (
                  <>
                    <div>
                      <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">Jak hrát (Základy)</h3>
                      <p className="text-white/50 text-sm font-bold uppercase tracking-[0.2em] mb-8">Hlavní cíl hry a orientace v rozhraní</p>
                      
                      <div className="space-y-6 text-base leading-relaxed">
                        <div className="glass-card p-6 bg-white/5 border-white/10">
                          <h4 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-red-400" /> Hlavní cíl</h4>
                          <p>Tím hlavním cílem je uhádnout, ze kterého anime pochází obrázek na obrazovce. Musíš přesně určit nejen samotnou sérii, ale také konkrétní Part (sezónu/část) a číslo epizody.</p>
                        </div>

                        <div className="glass-card p-6 bg-white/5 border-white/10">
                          <h4 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-400" /> Herní módy</h4>
                          <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold">1</span></div>
                              <div>
                                <strong className="text-white block">Classic (Klasický mód)</strong>
                                Hraješ sám za sebe. Hra se skládá z 5 kol. Snažíš se dosáhnout co nejvyššího skóre, každý špatný pokus tě stojí část bodů.
                              </div>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold">2</span></div>
                              <div>
                                <strong className="text-white block">Multiplayer (Pro 2-4 hráče)</strong>
                                Vyzvi své přátele! Založ místnost, pošli jim kód a hrajte proti sobě. Kdo rychleji a přesněji uhodne, získává bod. Hraje se většinou na 4 kola (nebo dle nastavení).
                              </div>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold">3</span></div>
                              <div>
                                <strong className="text-white block">Denní Výzva</strong>
                                Každý den o půlnoci se vygeneruje jeden unikátní obrázek pro všechny hráče na světě. Máš pouze jeden pokus. Přečti si více v záložce Denní Výzva!
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'scoring' && (
                  <>
                    <div>
                      <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">Bodovací Systém</h3>
                      <p className="text-white/50 text-sm font-bold uppercase tracking-[0.2em] mb-8">Jak se počítají body a penalizace</p>
                      
                      <div className="space-y-6 text-base leading-relaxed">
                        <div className="glass-card p-6 bg-white/5 border-emerald-500/20">
                          <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Zisk bodů</h4>
                          <p>V klasickém módu začínáš každé kolo s <strong>1000 body</strong>. Pokud uhodneš vše napoprvé, odnášíš si plný počet!</p>
                        </div>

                        <div className="glass-card p-6 bg-white/5 border-red-500/20">
                          <h4 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> Penalizace za chybné pokusy</h4>
                          <p className="mb-4">Pokud se spleteš, body začnou rychle klesat:</p>
                          <ul className="space-y-2 list-disc list-inside text-white/70 ml-2">
                            <li>Za každý odeslaný nesprávný tip (uhodl jsi sérii, ale špatný díl, atp.) se ti odečte pevná částka (obvykle <strong className="text-red-400">100 bodů</strong>).</li>
                            <li>Pokud nezadáš správný Part (často u vícesezónních anime zrádné), považuje se tip za nesprávný, i kdyby epizoda odpovídala. Part má obrovskou váhu!</li>
                          </ul>
                        </div>
                        
                        <div className="glass-card p-6 bg-white/5 border-amber-500/20">
                          <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-400" /> Multiplayer skóre</h4>
                          <p>V multiplayeru nehraješ na body za kolo, ale na čisté výhry. Pokud kolo uhodneš rychleji (či jako jediný v časovém limitu), získáváš pro sebe <strong className="text-amber-400">1 bod</strong> celkově do tabulky vítězů.</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'daily' && (
                  <>
                    <div>
                      <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">Denní Výzva</h3>
                      <p className="text-white/50 text-sm font-bold uppercase tracking-[0.2em] mb-8">Globální výzva s jedním pokusem</p>
                      
                      <div className="space-y-6 text-base leading-relaxed">
                        <div className="glass-card p-6 bg-white/5 border-white/10">
                          <p className="mb-4">Denní Výzva (Daily Challenge) je speciální režim. Všichni hráči na světě mají ten samý obrázek. Výzva se resetuje <strong>každou půlnoc</strong>.</p>
                          <p className="mb-4 text-white font-semibold">⚠️ Máš pouze JEDEN pokus.</p>
                          <p>Jakmile odešleš svůj tip, hra je u konce a dozvíš se, jak moc ses blížil.</p>
                        </div>

                        <div className="glass-card p-6 bg-white/5 border-white/10">
                          <h4 className="text-xl font-bold text-white mb-3">Vizuální rozpad tipu (Emoji Panel)</h4>
                          <p className="mb-4">Po tipnutí se ti zobrazí speciální panel na pravé straně s barevnými čtverečky (podobně jako ve Wordle):</p>
                          
                          <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <span className="w-24 text-sm font-bold text-white/50 uppercase">Série</span>
                              <span className="text-xl">🟩</span>
                              <span className="text-sm">Uhodl jsi sérii (červený = mimo)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-24 text-sm font-bold text-white/50 uppercase">Epizoda</span>
                              <span className="text-xl">🟨</span>
                              <span className="text-sm">Blízko! (odchylka do 5 dílů)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-24 text-sm font-bold text-white/50 uppercase">Part</span>
                              <span className="text-xl">🟥</span>
                              <span className="text-sm">Špatný part/sezóna.</span>
                            </div>
                          </div>
                          
                          <p className="mt-4">Nezapomeň svůj výsledek sdílet na sítích pomocí tlačítka <strong>Sdílet výsledek</strong> přímo v panelu!</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'database' && (
                  <>
                    <div>
                      <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">Seznam Anime</h3>
                      <p className="text-white/50 text-sm font-bold uppercase tracking-[0.2em] mb-8">Databáze dostupných sérií ve hře</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {animes.length > 0 ? (
                          animes.map(anime => (
                            <div key={anime.id} className="glass-card p-3 bg-white/5 border-white/10 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-black/50 overflow-hidden border border-white/10 shrink-0">
                                <img src={`/images/covers/${anime.id}.jpg`} alt="" className="w-full h-full object-cover opacity-60" onError={(e) => { e.target.style.display = 'none'; }} />
                              </div>
                              <span className="text-white font-bold text-sm">{anime.title}</span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center p-10 text-white/30 font-semibold border border-white/5 rounded-xl border-dashed">
                            Žádná anime nenalezena.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
