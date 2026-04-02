import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMeasurementStore } from '../store/useMeasurementStore'
import { useSpeechRecognition } from '../utils/useSpeechRecognition'
import BottomNav from '../components/BottomNav'

export default function VoiceInputPage() {
  const navigate = useNavigate()
  const { measurements, addBatch } = useMeasurementStore()
  const [latestBatch, setLatestBatch] = useState(null)
  const [cutExpanded, setCutExpanded] = useState(false)

  const handleResult = useCallback((results) => {
    setLatestBatch(results)
    addBatch(results)
  }, [addBatch])

  const { isRecording, interimText, toggle, isSupported } = useSpeechRecognition({
    onResult: handleResult,
    gracePeriodMs: 2000,
  })

  const toggleRecording = () => {
    // 録音終了時は最新バッチをクリアして次の録音へ
    if (isRecording) setLatestBatch(null)
    toggle()
  }

  const allItems = measurements.flatMap((b) => b.items)
  const uncutBatches = measurements.map((batch) => ({
    ...batch,
    items: batch.items.filter((i) => !i.cut),
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
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-surface/50 rounded-xl px-4 py-3 mb-2"
                    >
                      <span className="line-through text-text-muted font-bold text-xl">
                        {item.displayValue}
                      </span>
                      <span className="text-success text-sm">✓</span>
                    </div>
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
                className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 mb-2"
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
    </div>
  )
}
