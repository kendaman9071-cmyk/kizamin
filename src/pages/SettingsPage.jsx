import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSetting, setSetting } from '../utils/settings'
import { useMeasurementStore } from '../store/useMeasurementStore'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { measurements, itemOrder, selectedForCutting, clearAll } = useMeasurementStore()
  const fileRef = useRef(null)
  const [importMsg, setImportMsg] = useState('')

  const [wakeLock,     setWakeLock]     = useState(() => getSetting('wakeLock'))
  const [vibration,    setVibration]    = useState(() => getSetting('vibration'))
  const [doubleTap,    setDoubleTap]    = useState(() => getSetting('doubleTap'))
  const [fontSize,     setFontSize]     = useState(() => getSetting('fontSize'))
  const [cuttingFont,  setCuttingFont]  = useState(() => getSetting('cuttingFont'))

  const toggle = (key, val, setter) => { setter(val); setSetting(key, val) }

  // ── バックアップ ──
  const handleExport = () => {
    const data = JSON.stringify({ measurements, itemOrder, selectedForCutting }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `kizamin-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result)
        if (!Array.isArray(json.measurements)) throw new Error()
        // zustand の persist ストレージに直接書き込んで再読込
        const stored = JSON.parse(localStorage.getItem('kizamin-measurements') || '{}')
        stored.state = {
          measurements: json.measurements,
          itemOrder: json.itemOrder || [],
          selectedForCutting: json.selectedForCutting || [],
        }
        localStorage.setItem('kizamin-measurements', JSON.stringify(stored))
        setImportMsg('インポート完了。ページをリロードしてください。')
      } catch {
        setImportMsg('ファイルの形式が正しくありません。')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-text-muted p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-text-primary font-bold text-xl">設定</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-6 pb-8">

        <SettingsSection title="切断モード">
          <SettingsToggle label="画面スリープ無効" description="切断中に画面が暗くなるのを防ぐ"
            value={wakeLock} onChange={(v) => toggle('wakeLock', v, setWakeLock)} />
          <SettingsToggle label="振動フィードバック" description="切断確定時に軽く振動する"
            value={vibration} onChange={(v) => toggle('vibration', v, setVibration)} />
          <SettingsToggle label="誤タップ防止" description="2回タップで切断確定"
            value={doubleTap} onChange={(v) => toggle('doubleTap', v, setDoubleTap)} />
          <SettingsSegment
            label="切断フォントサイズ"
            options={[{ value: 'sm', label: '大' }, { value: 'md', label: '特大' }, { value: 'lg', label: '超特大' }]}
            value={cuttingFont}
            onChange={(v) => toggle('cuttingFont', v, setCuttingFont)}
          />
        </SettingsSection>

        <SettingsSection title="表示">
          <SettingsSegment
            label="寸法カードの文字サイズ"
            options={[{ value: 'sm', label: '小' }, { value: 'md', label: '中' }, { value: 'lg', label: '大' }]}
            value={fontSize}
            onChange={(v) => toggle('fontSize', v, setFontSize)}
          />
        </SettingsSection>

        <SettingsSection title="音声認識">
          <SettingsNav label="数字の読み方" onPress={() => navigate('/settings/numbers')} />
          <SettingsNav label="材料登録" onPress={() => navigate('/settings/materials')} />
        </SettingsSection>

        <SettingsSection title="データ管理">
          <SettingsNav label="プロジェクト管理" onPress={() => navigate('/settings/projects')} />
          <div className="px-4 py-3 flex gap-2">
            <button onClick={handleExport}
              className="flex-1 py-2.5 rounded-xl border border-border text-text-primary text-sm font-medium">
              エクスポート
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex-1 py-2.5 rounded-xl border border-border text-text-primary text-sm font-medium">
              インポート
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
          {importMsg && (
            <p className="text-xs px-4 pb-3 text-brand-primary">{importMsg}</p>
          )}
        </SettingsSection>

        <SettingsSection title="サポート">
          <SettingsNav label="意見・要望を送る（準備中）" />
        </SettingsSection>

      </div>
    </div>
  )
}

// ─── 共通パーツ ─────────────────────────────────────────────────────
function SettingsSection({ title, children }) {
  return (
    <div>
      <p className="text-text-muted text-xs font-bold tracking-widest uppercase mb-2 px-1">{title}</p>
      <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border">{children}</div>
    </div>
  )
}

function SettingsToggle({ label, description, value, onChange }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-3 text-left" onClick={() => onChange(!value)}>
      <div className="flex-1 mr-4">
        <div className="text-text-primary text-sm">{label}</div>
        {description && <div className="text-text-muted text-xs mt-0.5">{description}</div>}
      </div>
      <div className={`flex-shrink-0 w-11 h-6 rounded-full flex items-center px-1 transition-colors ${value ? 'bg-brand-primary' : 'bg-border'}`}>
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  )
}

function SettingsSegment({ label, options, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-text-primary text-sm">{label}</span>
      <div className="flex rounded-lg overflow-hidden border border-border">
        {options.map((opt) => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-3 h-9 text-xs font-bold transition-colors ${
              value === opt.value ? 'bg-brand-primary text-white' : 'bg-surface text-text-muted'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SettingsNav({ label, onPress }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-3" onClick={onPress}>
      <span className="text-text-primary text-sm">{label}</span>
      {onPress && (
        <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}
