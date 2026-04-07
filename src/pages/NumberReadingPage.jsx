import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'kizamin-custom-readings'

function loadReadings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveReadings(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const SECTIONS = [
  {
    title: '基本的な読み方',
    rows: [
      ['910', 'きゅうひゃくじゅう'],
      ['1820', 'せんはっぴゃくにじゅう'],
      ['450', 'よんひゃくごじゅう'],
      ['3030', 'さんぜんさんじゅう'],
    ],
  },
  {
    title: '単位',
    rows: [
      ['910mm', 'きゅうひゃくじゅうミリ'],
      ['6しゃく', '六尺 → 1820mm'],
      ['3すん', '三寸 → 90.9mm'],
      ['1.5メートル', '1.5メートル → 1500mm'],
    ],
  },
  {
    title: '四則演算',
    rows: [
      ['910 たす 455', '1365mm'],
      ['1820 ひく 303', '1517mm'],
      ['455 かける 3', '455mm × 3件登録'],
      ['1820 わる 4', '455mm × 4件登録'],
    ],
  },
  {
    title: '複数まとめて入力',
    rows: [
      ['910 と 455 と 303', '3件別々に登録'],
      ['910 つぎ 455', '2件別々に登録'],
    ],
  },
  {
    title: 'iOSの音声認識の癖',
    rows: [
      ['「910」→「900頭」', '自動補正対応済み'],
      ['「タス」「ヒク」', 'カタカナ演算子対応済み'],
      ['「900と」', '900+10=910 として認識'],
    ],
  },
]

export default function NumberReadingPage() {
  const navigate = useNavigate()
  const [readings, setReadings] = useState(loadReadings)
  const [keyword, setKeyword] = useState('')
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const kw = keyword.trim()
    const val = parseFloat(value)
    if (!kw) { setError('よみがなを入力してください'); return }
    if (isNaN(val) || val <= 0) { setError('寸法（mm）を正しく入力してください'); return }
    const next = [...readings, { id: Date.now(), keyword: kw, value: val, label: label.trim() }]
    setReadings(next)
    saveReadings(next)
    setKeyword(''); setValue(''); setLabel(''); setError('')
  }

  const handleDelete = (id) => {
    const next = readings.filter((r) => r.id !== id)
    setReadings(next)
    saveReadings(next)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-text-muted p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-text-primary font-bold text-xl">数字の読み方</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 space-y-5">

        {/* カスタム読み方追加フォーム */}
        <div className="bg-surface rounded-2xl p-4 space-y-3">
          <p className="text-text-muted text-xs font-bold tracking-widest uppercase">カスタム読み方を追加</p>
          <div className="space-y-1">
            <p className="text-text-muted text-xs px-1">よみがな（音声で話す言葉）</p>
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder="例：はんまい"
              className="w-full bg-background text-text-primary text-sm rounded-xl px-3 py-2.5 border border-border focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="flex gap-2">
            <div className="w-2/5 space-y-1">
              <p className="text-text-muted text-xs px-1">寸法 mm</p>
              <input type="text" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
                placeholder="例：455"
                className="w-full bg-background text-text-primary text-sm rounded-xl px-3 py-2.5 border border-border focus:outline-none focus:border-brand-primary" />
            </div>
            <div className="w-3/5 space-y-1">
              <p className="text-text-muted text-xs px-1">表示名（任意）</p>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                placeholder="例：半間"
                className="w-full bg-background text-text-primary text-sm rounded-xl px-3 py-2.5 border border-border focus:outline-none focus:border-brand-primary" />
            </div>
          </div>
          {error && <p className="text-danger text-xs">{error}</p>}
          <button onClick={handleAdd}
            className="w-full py-3 rounded-xl bg-brand-primary text-white font-bold text-sm">
            追加
          </button>
        </div>

        {/* カスタム読み方リスト */}
        {readings.length > 0 && (
          <div>
            <p className="text-text-muted text-xs font-bold tracking-widest uppercase mb-2 px-1">登録済みカスタム読み方</p>
            <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border">
              <AnimatePresence>
                {readings.map((r) => (
                  <motion.div key={r.id} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-bold text-sm truncate">
                        {r.label || r.keyword}
                      </p>
                      <p className="text-text-muted text-xs mt-0.5">
                        <span className="text-brand-primary">{r.keyword}</span>
                        <span className="ml-2">→ {r.value}mm</span>
                      </p>
                    </div>
                    <button onClick={() => handleDelete(r.id)}
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

        {/* デフォルト読み方（参考） */}
        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            <p className="text-text-muted text-xs font-bold tracking-widest uppercase mb-2 px-1">{sec.title}</p>
            <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border">
              {sec.rows.map(([input, result]) => (
                <div key={input} className="flex items-center justify-between px-4 py-3">
                  <span className="text-brand-primary font-bold text-sm font-mono">{input}</span>
                  <span className="text-text-muted text-sm text-right ml-4">{result}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
