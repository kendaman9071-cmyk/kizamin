import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSetting, setSetting } from '../utils/settings'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  const [wakeLock, setWakeLock] = useState(() => getSetting('wakeLock'))
  const [vibration, setVibration] = useState(() => getSetting('vibration'))
  const [doubleTap, setDoubleTap] = useState(() => getSetting('doubleTap'))

  const handleToggle = (key, value, setter) => {
    setter(value)
    setSetting(key, value)
  }

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return
    // TODO: 実際の送信処理
    setFeedbackSent(true)
    setTimeout(() => {
      setFeedbackSent(false)
      setFeedbackText('')
      setFeedbackOpen(false)
    }, 2000)
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
          <SettingsToggle
            label="画面スリープ無効"
            description="切断中に画面が暗くなるのを防ぐ"
            value={wakeLock}
            onChange={(v) => handleToggle('wakeLock', v, setWakeLock)}
          />
          <SettingsToggle
            label="振動フィードバック"
            description="切断確定時に軽く振動する"
            value={vibration}
            onChange={(v) => handleToggle('vibration', v, setVibration)}
          />
          <SettingsToggle
            label="誤タップ防止"
            description="2回タップで切断確定（誤操作を防ぐ）"
            value={doubleTap}
            onChange={(v) => handleToggle('doubleTap', v, setDoubleTap)}
          />
        </SettingsSection>

        <SettingsSection title="表示">
          <SettingsRow label="フォントサイズ" value="中" />
          <SettingsRow label="切断モードフォント" value="特大" />
          <SettingsRow label="ダークモード" value="ON（固定）" />
        </SettingsSection>

        <SettingsSection title="音声認識">
          <SettingsRow label="読み上げペース" value="自動" />
          <SettingsNav label="数字の読み方" />
          <SettingsNav label="材料登録" />
        </SettingsSection>

        <SettingsSection title="データ管理">
          <SettingsNav label="プロジェクト管理" />
          <SettingsNav label="バックアップ（準備中）" />
        </SettingsSection>

        <SettingsSection title="サポート">
          <button
            onClick={() => setFeedbackOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span className="text-text-primary text-sm">意見・要望を送る</span>
            <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {feedbackOpen && (
            <div className="px-4 pb-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="ご意見・ご要望をご自由にお書きください"
                className="w-full bg-border text-text-primary text-sm rounded-xl p-3 h-32 resize-none outline-none placeholder:text-text-muted"
              />
              <button
                onClick={handleSendFeedback}
                className={`mt-2 w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                  feedbackSent ? 'bg-success text-white' : 'bg-brand-primary text-background'
                }`}
              >
                {feedbackSent ? '送信しました ✓' : '送信'}
              </button>
            </div>
          )}
        </SettingsSection>

        <SettingsSection title="言語">
          <SettingsRow label="言語" value="日本語" />
          <p className="text-text-muted text-xs px-4 pb-3">※多言語対応予定</p>
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({ title, children }) {
  return (
    <div>
      <p className="text-text-muted text-xs font-bold tracking-widest uppercase mb-2 px-1">
        {title}
      </p>
      <div className="bg-surface rounded-2xl overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  )
}

function SettingsRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-text-primary text-sm">{label}</span>
      <span className="text-text-muted text-sm">{value}</span>
    </div>
  )
}

function SettingsToggle({ label, description, value, onChange }) {
  return (
    <button
      className="w-full flex items-center justify-between px-4 py-3 text-left"
      onClick={() => onChange(!value)}
    >
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

function SettingsNav({ label }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-text-primary text-sm">{label}</span>
      <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}
