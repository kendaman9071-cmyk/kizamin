import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeasurementStore } from '../store/useMeasurementStore'
import { useSpeechRecognition } from '../utils/useSpeechRecognition'
import { parseVoiceInput } from '../utils/measurementParser'
import { playStartSound, playStopSound } from '../utils/sounds'
import BottomNav from '../components/BottomNav'

export default function VoiceInputPage() {
  const navigate = useNavigate()
  const { measurements, addBatch, markAsUncut, updateItem } = useMeasurementStore()
  const [latestBatch, setLatestBatch] = useState(null)
  const [cutExpanded, setCutExpanded] = useState(false)
  const [manualText, setManualText] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const inputRef = useRef(null)

  const handleResult = useCallback((results) => {
    setLatestBatch(results)
    addBatch(results)
  }, [addBatch])

  const { isRecording, interimText, toggle, isSupported } = useSpeechRecognition({
    onResult: handleResult,
    gracePeriodMs: 2000,
  })

  const toggleRecording = () => {
    if (isRecording) {
      setLatestBatch(null)
      playStopSound()
    } else {
      playStartSound()
    }
    toggle()
  }

  const handleManualSubmit = () => {
    const text = manualText.trim()
    if (!text) return
    const results = parseVoiceInput(text)
    if (results.length > 0) {
      setLatestBatch(results)
      addBatch(results)
    }
    setManualText('')
    inputRef.current?.blur()
  }

  const handleManualKeyDown = (e) => {
    if (e.key === 'Enter') handleManualSubmit()
  }

  const handleEditSave = () => {
    if (!editingItem) return
    const numVal = parseFloat(editingItem.editValue)
    if (!isNaN(numVal) && numVal > 0) {
      const rounded = Math.round(numVal * 10) / 10
      updateItem(editingItem.batchId, editingItem.id, {
        value: rounded,
        displayValue: `${rounded}mm`,
        memo: editingItem.memo,
        warning: false,
      })
    }
    setEditingItem(null)
  }

  const allItems = measurements.flatMap((b) => b.items)
  const uncutBatches = measurements.map((batch) => ({
    ...batch,
    items: batch.items.filter((i) => !i.cut).map((i) => ({ ...i, batchId: batch.id })),
  })).filter((batch) => batch.items.length > 0)
  const cutItems = allItems.filter((i) => i.cut)

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <span className="text-text-muted text-sm font-medium tracking-widest uppercase">
          きざみん
        </span>
        <button
          onClick={() => navigate('/settings')}
          className="text-text-muted p-2"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* 寸法スクロールリスト */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {measurements.length === 0 && !isRecording && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <p className="text-sm">マイクボタンで採寸開始</p>
          </div>
        )}

        {/* 切断済み（折りたたみ） */}
        {cutItems.length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => setCutExpanded((v) => !v)}
              className="flex items-center gap-2 text-text-muted text-xs mb-2 w-full"
            >
              <div className="flex-1 h-px bg-border" />
              <span className="whitespace-nowrap">
                切断済み {cutItems.length}件 {cutExpanded ? '▲' : '▼'}
              </span>
              <div className="flex-1 h-px bg-border" />
            </button>
            <AnimatePresence>
              {cutExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {cutItems.map((item) => (
                    <motion.div
                      key={item.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => markAsUncut(item.id)}
                      className="flex items-center justify-between bg-surface/50 rounded-xl px-4 py-3 mb-2 cursor-pointer"
                    >
                      <span className="line-through text-text-muted font-bold text-xl">
                        {item.displayValue}
                      </span>
                      <span className="text-success text-sm font-medium">✓ 切断済</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 未切断バッチ */}
        {uncutBatches.map((batch, bIdx) => (
          <div key={batch.id} className="mb-1">
            {bIdx > 0 && (
              <div className="text-text-muted text-xs text-center py-2 tracking-wider">
                ── {new Date(batch.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} ──
              </div>
            )}
            {batch.items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setEditingItem({
                  id: item.id,
                  batchId: item.batchId,
                  editValue: String(item.value ?? ''),
                  memo: item.memo ?? '',
                })}
                className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 mb-2 cursor-pointer"
              >
                <div>
                  <span className="text-text-primary font-bold text-xl">
                    {item.displayValue}
                  </span>
                  {item.memo && (
                    <span className="text-text-muted text-sm ml-2">{item.memo}</span>
                  )}
                  {item.originalUnit && (
                    <div className="text-text-muted text-xs mt-0.5">
                      {item.originalUnit}: {item.originalValue}
                    </div>
                  )}
                </div>
                {item.warning && <span className="text-warning text-lg">⚠️</span>}
              </motion.div>
            ))}
          </div>
        ))}

        {/* 最新バッチ（録音直後・大きく表示） */}
        <AnimatePresence>
          {latestBatch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-surface border border-brand-primary rounded-2xl px-4 py-4 mb-2"
            >
              <div className="text-brand-primary text-xs font-bold tracking-widest mb-2 uppercase">
                認識結果 — タップして修正
              </div>
              {latestBatch.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-text-primary font-bold text-2xl">
                    {item.displayValue}
                  </span>
                  {item.memo && (
                    <span className="text-text-muted text-sm">{item.memo}</span>
                  )}
                  {item.warning && <span className="text-warning">⚠️</span>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 音声認識未対応の警告 */}
      {!isSupported && (
        <div className="mx-4 mb-2 bg-danger/20 border border-danger rounded-xl px-4 py-3 text-danger text-sm">
          このブラウザは音声認識に対応していません。Chrome または Safari をお使いください。
        </div>
      )}

      {/* 録音中リアルタイムテキスト */}
      {isRecording && (
        <div className="mx-4 mb-2 bg-surface rounded-xl px-4 py-3 min-h-12 flex items-center">
          <p className="text-text-muted text-sm">
            {interimText || '話してください...'}
          </p>
        </div>
      )}

      {/* 手入力フィールド */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 items-center bg-surface rounded-xl px-3 py-2 border border-border">
          <input
            ref={inputRef}
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={handleManualKeyDown}
            placeholder="入力　例: 910  910たす455  6しゃく"
            className="flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-muted focus:outline-none"
          />
          <AnimatePresence>
            {manualText.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleManualSubmit}
                className="bg-brand-primary text-white text-sm font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
              >
                追加
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 録音ボタン */}
      <div className="pb-8 px-4 flex flex-col items-center gap-4">
        <motion.button
          onTap={toggleRecording}
          whileTap={{ scale: 0.95 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors ${
            isRecording
              ? 'bg-danger'
              : 'bg-brand-primary'
          }`}
        >
          {isRecording ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-6 h-6 bg-white rounded-sm"
            />
          ) : (
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 9a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V23h-2v-2.062A8 8 0 0 1 4 13a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z"/>
            </svg>
          )}
        </motion.button>

        <p className="text-text-muted text-xs">
          {isRecording ? '録音中 — もう一度タップで終了' : 'タップして録音開始'}
        </p>
      </div>

      <BottomNav />

      {/* 編集モーダル */}
      <AnimatePresence>
        {editingItem && (
          <EditModal
            editingItem={editingItem}
            onChange={setEditingItem}
            onSave={handleEditSave}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── 編集モーダル ────────────────────────────────────────────────────
function EditModal({ editingItem, onChange, onSave, onClose }) {
  const handleVoiceResult = useCallback((results) => {
    const first = results[0]
    if (first && first.value != null) {
      onChange((prev) => ({ ...prev, editValue: String(first.value) }))
    }
  }, [onChange])

  const { isRecording, interimText, toggle, isSupported } = useSpeechRecognition({
    onResult: handleVoiceResult,
    gracePeriodMs: 1500,
  })

  const handleMicTap = () => {
    if (isRecording) playStopSound()
    else playStartSound()
    toggle()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50"
      onPointerDown={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface rounded-2xl p-6 w-full"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-text-primary font-bold text-lg mb-4">寸法を編集</h2>

        <div className="mb-3">
          <label className="text-text-muted text-xs mb-1 block">数値 (mm)</label>
          <div className="flex gap-2 items-stretch min-w-0">
            <input
              type="text"
              inputMode="decimal"
              value={editingItem.editValue}
              onChange={(e) => onChange((prev) => ({ ...prev, editValue: e.target.value }))}
              className="min-w-0 flex-1 bg-background text-text-primary text-2xl font-bold rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-brand-primary"
              autoFocus={!isRecording}
            />
            {isSupported && (
              <motion.button
                onTap={handleMicTap}
                whileTap={{ scale: 0.92 }}
                className={`flex-shrink-0 w-14 rounded-xl flex items-center justify-center transition-colors ${
                  isRecording ? 'bg-danger' : 'bg-brand-primary'
                }`}
              >
                {isRecording ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-4 h-4 bg-white rounded-sm"
                  />
                ) : (
                  <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
                    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 9a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V23h-2v-2.062A8 8 0 0 1 4 13a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z"/>
                  </svg>
                )}
              </motion.button>
            )}
          </div>
          {isRecording && (
            <p className="text-text-muted text-xs mt-2 px-1">
              {interimText || '話してください...'}
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="text-text-muted text-xs mb-1 block">メモ（任意）</label>
          <input
            type="text"
            value={editingItem.memo}
            onChange={(e) => onChange((prev) => ({ ...prev, memo: e.target.value }))}
            className="w-full bg-background text-text-primary rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-brand-primary"
            placeholder="メモを入力"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-text-muted font-bold"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 rounded-xl bg-brand-primary text-white font-bold"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
