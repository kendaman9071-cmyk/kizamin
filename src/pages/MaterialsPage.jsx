import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'kizamin-custom-materials'

function loadMaterials() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveMaterials(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const DEFAULTS = [
  { keyword: 'さぶろく', value: null, label: 'サブロク（910×1820）', readonly: true },
  { keyword: 'ろくしゃく / いっけん', value: 1820, label: '六尺（1820mm）', readonly: true },
]

export default function MaterialsPage() {
  const navigate = useNavigate()
  const [materials, setMaterials] = useState(loadMaterials)
  const [keyword, setKeyword] = useState('')
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const kw = keyword.trim()
    const val = parseFloat(value)
    if (!kw) { setError('よみがなを入力してください'); return }
    if (isNaN(val) || val <= 0) { setError('寸法（mm）を正しく入力してください'); return }
    const next = [...materials, { id: Date.now(), keyword: kw, value: val, label: label.trim() || kw }]
    setMaterials(next)
    saveMaterials(next)
    setKeyword(''); setValue(''); setLabel(''); setError('')
  }

  const handleDelete = (id) => {
    const next = materials.filter((m) => m.id !== id)
    setMaterials(next)
    saveMaterials(next)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-text-muted p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-text-primary font-bold text-xl">材料登録</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 space-y-5">

        {/* 追加フォーム */}
        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <p className="text-text-muted text-xs font-bold tracking-widest uppercase">新規登録</p>
          <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="よみがな（例：たるき）"
            className="w-full bg-background text-text-primary text-sm rounded-xl px-3 py-2.5 border border-border focus:outline-none focus:border-brand-primary" />
          <input type="text" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
            placeholder="寸法 mm（例：45）"
            className="w-full bg-background text-text-primary text-sm rounded-xl px-3 py-2.5 border border-border focus:outline-none focus:border-brand-primary" />
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="表示名（例：垂木）"
            className="w-full bg-background text-text-primary text-sm rounded-xl px-3 py-2.5 border border-border focus:outline-none focus:border-brand-primary" />
          {error && <p className="text-danger text-xs">{error}</p>}
          <button onClick={handleAdd}
            className="w-full py-3 rounded-xl bg-brand-primary text-white font-bold text-sm">
            追加
          </button>
        </div>

        {/* カスタム材料リスト */}
        {materials.length > 0 && (
          <div>
            <p className="text-text-muted text-xs font-bold tracking-widest uppercase mb-2 px-1">登録済み</p>
            <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border">
              <AnimatePresence>
                {materials.map((m) => (
                  <motion.div key={m.id} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-bold text-sm truncate">{m.label}</p>
                      <p className="text-text-muted text-xs mt-0.5">
                        <span className="text-brand-primary">{m.keyword}</span>
                        <span className="ml-2">{m.value}mm</span>
                      </p>
                    </div>
                    <button onClick={() => handleDelete(m.id)}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center">
                      <svg width="12" height="12" stroke="#FF4444" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* デフォルト材料（参考） */}
        <div>
          <p className="text-text-muted text-xs font-bold tracking-widest uppercase mb-2 px-1">デフォルト（変更不可）</p>
          <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border">
            {DEFAULTS.map((m) => (
              <div key={m.keyword} className="px-4 py-3">
                <p className="text-text-muted text-sm">{m.label}</p>
                <p className="text-text-muted text-xs mt-0.5">{m.keyword}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
