import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useMeasurementStore } from '../store/useMeasurementStore'
import { useSpeechRecognition } from '../utils/useSpeechRecognition'
import { playStartSound, playStopSound } from '../utils/sounds'
import { getSetting } from '../utils/settings'
import BottomNav from '../components/BottomNav'

const FONT = {
  sm: { v1: 'text-base', v2: 'text-sm', v3: 'text-xs' },
  md: { v1: 'text-xl',   v2: 'text-lg', v3: 'text-sm' },
  lg: { v1: 'text-2xl',  v2: 'text-xl', v3: 'text-base' },
}

const LONG_PRESS_MS = 600

export default function MeasurementListPage() {
  const navigate = useNavigate()
  const { measurements, deleteItem, updateItem, clearAll, setSelectedForCutting, itemOrder, setItemOrder, markAsUncut } = useMeasurementStore()

  const [columns, setColumns] = useState(() => parseInt(localStorage.getItem('kizamin-columns') || '1', 10))
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('kizamin-sort') || 'input')
  const [editMode, setEditMode] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [cutExpanded, setCutExpanded] = useState(false)
  const [filterWarning, setFilterWarning] = useState(false)
  const [fontSize] = useState(() => getSetting('fontSize'))

  const allItems = measurements.flatMap((b) => b.items.map((item) => ({ ...item, batchId: b.id })))

  // 手動並び替え順を適用
  const applyOrder = (items) => {
    if (!itemOrder.length) return items
    const orderMap = new Map(itemOrder.map((id, idx) => [id, idx]))
    return [...items].sort((a, b) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity
      const bi = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity
      return ai - bi
    })
  }

  const sortItems = (items) => {
    if (sortOrder === 'asc') return [...items].sort((a, b) => (a.value ?? 0) - (b.value ?? 0))
    if (sortOrder === 'desc') return [...items].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    return applyOrder(items)
  }

  const isGrouped = sortOrder === 'asc' || sortOrder === 'desc'

  const groupItems = (items) => {
    if (!isGrouped) return items.map((item) => ({ ...item, groupItems: [item] }))
    const groups = []
    const map = new Map()
    for (const item of items) {
      const key = item.value ?? item.displayValue
      if (map.has(key)) {
        groups[map.get(key)].groupItems.push(item)
      } else {
        map.set(key, groups.length)
        groups.push({ ...item, groupItems: [item] })
      }
    }
    return groups
  }

  const uncutRaw = sortItems(allItems.filter((i) => !i.cut))
  const uncut = groupItems(uncutRaw)
  const uncutDisplay = filterWarning ? uncut.filter((i) => i.warning) : uncut
  const uncutTotal = uncutRaw.length
  const cut = allItems.filter((i) => i.cut)
  const warningCount = uncutRaw.filter((i) => i.warning).length

  const setColumns_ = (n) => {
    setColumns(n)
    localStorage.setItem('kizamin-columns', String(n))
  }

  const setSortOrder_ = (s) => {
    setSortOrder(s)
    localStorage.setItem('kizamin-sort', s)
    if (s !== 'input') setEditMode(false)
  }

  const enterEditMode = () => {
    setSortOrder_('input')
    setEditMode(true)
    setFilterWarning(false)
  }

  const handleReorder = (newItems) => {
    setItemOrder(newItems.map((i) => i.id))
  }

  const handleStartCutting = () => {
    setSelectedForCutting(uncutRaw)
    navigate('/cutting')
  }

  const handleEditSave = () => {
    if (!editingItem) return
    const numVal = parseFloat(editingItem.value)
    if (!isNaN(numVal) && numVal > 0) {
      const updates = {
        value: Math.round(numVal),
        displayValue: `${Math.round(numVal)}mm`,
        memo: editingItem.memo,
        warning: false,
      }
      for (const { batchId, id } of editingItem.groupItems) {
        updateItem(batchId, id, updates)
      }
    }
    setEditingItem(null)
  }

  // 編集モード時は1列固定
  const displayColumns = editMode ? 1 : columns

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ヘッダー */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-text-primary font-bold text-xl">寸法一覧</h1>
          <p className="text-text-muted text-xs mt-0.5">
            未切断 {uncutTotal}件 / 全 {allItems.length}件
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            // 編集モード時：完了ボタンのみ
            <button
              onClick={() => setEditMode(false)}
              className="px-4 h-9 rounded-lg bg-brand-primary text-white text-sm font-bold"
            >
              完了
            </button>
          ) : (
            <>
              {/* ソート順トグル */}
              <div className="flex rounded-lg overflow-hidden border border-border">
                {[
                  { key: 'input', label: '入力' },
                  { key: 'asc',   label: '昇順' },
                  { key: 'desc',  label: '降順' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortOrder_(key)}
                    className={`px-2 h-9 text-xs font-bold transition-colors ${
                      sortOrder === key ? 'bg-brand-primary text-white' : 'bg-surface text-text-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* 列数トグル */}
              <div className="flex rounded-lg overflow-hidden border border-border">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setColumns_(n)}
                    className={`w-9 h-9 text-sm font-bold transition-colors ${
                      columns === n ? 'bg-brand-primary text-white' : 'bg-surface text-text-muted'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {/* 全削除ボタン */}
              {allItems.length > 0 && (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface text-text-muted"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              )}
              {/* 設定ボタン */}
              <button
                onClick={() => navigate('/settings')}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface text-text-muted"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {warningCount > 0 && (
        <div className="px-4 mb-2">
          <button
            onClick={() => { setFilterWarning((v) => !v); setEditMode(false) }}
            className={`text-sm rounded-lg px-3 py-1.5 border font-medium transition-colors ${
              filterWarning
                ? 'bg-warning text-background border-warning'
                : 'text-warning border-warning'
            }`}
          >
            ⚠️ 要確認 {warningCount}件{filterWarning ? ' ✕' : ''}
          </button>
        </div>
      )}

      {/* リスト */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {allItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            寸法がありません
          </div>
        ) : (
          <>
            {/* 切断済み（折りたたみ） */}
            {!editMode && cut.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setCutExpanded((v) => !v)}
                  className="flex items-center gap-2 text-text-muted text-sm mb-2 w-full"
                >
                  <div className="flex-1 h-px bg-border" />
                  <span className="whitespace-nowrap">
                    切断済み {cut.length}件 {cutExpanded ? '▲' : '▼'}
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
                      <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${displayColumns}, 1fr)` }}
                      >
                        {cut.map((item) => (
                          <MeasurementCard
                            key={item.id}
                            item={{ ...item, groupItems: [item] }}
                            columns={displayColumns}
                            isCut
                            editMode={false}
                            onLongPress={() => {}}
                            onTap={() => markAsUncut(item.id)}
                            onDelete={() => {}}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 未切断 */}
            {editMode ? (
              // 編集モード：ドラッグ並び替え
              <Reorder.Group
                axis="y"
                values={uncutRaw}
                onReorder={handleReorder}
                className="flex flex-col gap-2"
              >
                {uncutRaw.map((item) => (
                  <DraggableCard
                    key={item.id}
                    item={item}
                    fontSize={fontSize}
                    onTap={() => setEditingItem({
                      groupItems: [item],
                      value: String(item.value ?? ''),
                      memo: item.memo ?? '',
                    })}
                    onDelete={() => deleteItem(item.batchId, item.id)}
                  />
                ))}
              </Reorder.Group>
            ) : (
              // 通常モード：グリッド表示
              <div
                className="grid gap-2 overflow-hidden"
                style={{ gridTemplateColumns: `repeat(${displayColumns}, 1fr)` }}
              >
                {uncutDisplay.map((item) => (
                  <MeasurementCard
                    key={item.id}
                    item={item}
                    columns={displayColumns}
                    fontSize={fontSize}
                    editMode={false}
                    onLongPress={enterEditMode}
                    onTap={() => setEditingItem({
                      groupItems: item.groupItems,
                      value: String(item.value ?? ''),
                      memo: item.memo ?? '',
                    })}
                    onDelete={() => {
                      const last = item.groupItems[item.groupItems.length - 1]
                      deleteItem(last.batchId, last.id)
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {uncutTotal > 0 && !editMode && (
        <div className="px-4 pb-8">
          <button
            onClick={handleStartCutting}
            className="w-full bg-brand-primary text-background font-bold text-lg py-4 rounded-2xl"
          >
            切断モード開始
          </button>
        </div>
      )}

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

      {/* 全削除確認 */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl p-6 w-full"
            >
              <h2 className="text-text-primary font-bold text-lg mb-2">全削除しますか？</h2>
              <p className="text-text-muted text-sm mb-5">全 {allItems.length}件のデータが削除されます。</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-text-muted font-bold"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => { clearAll(); setConfirmClear(false) }}
                  className="flex-1 py-3 rounded-xl bg-danger text-white font-bold"
                >
                  全削除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── ドラッグ可能カードラッパー（editMode専用） ─────────────────────────
function DraggableCard({ item, onTap, onDelete, fontSize }) {
  const dragControls = useDragControls()
  return (
    <Reorder.Item
      value={item}
      className="list-none"
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.03, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 50 }}
      style={{ position: 'relative' }}
    >
      <MeasurementCard
        item={{ ...item, groupItems: [item] }}
        columns={1}
        editMode
        fontSize={fontSize}
        onLongPress={() => {}}
        onTap={onTap}
        onDelete={onDelete}
        dragControls={dragControls}
      />
    </Reorder.Item>
  )
}

// ─── カードコンポーネント ───────────────────────────────────────────
function MeasurementCard({ item, columns, isCut = false, editMode = false, onLongPress, onTap, onDelete, dragControls, fontSize = 'md' }) {
  const f = FONT[fontSize] ?? FONT.md
  const timerRef = useRef(null)
  const [pressing, setPressing] = useState(false)

  const startPress = useCallback(() => {
    if (editMode) return
    setPressing(true)
    timerRef.current = setTimeout(() => {
      setPressing(false)
      onLongPress()
    }, LONG_PRESS_MS)
  }, [editMode, onLongPress])

  const endPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (pressing) {
      setPressing(false)
      onTap()
    }
  }, [pressing, onTap])

  const cancelPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setPressing(false)
  }, [])

  const isCompact = columns >= 2
  const count = item.groupItems?.length ?? 1

  // 切断済みカード：長押し機構を使わずシンプルなタップで復活
  if (isCut) {
    return (
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={onTap}
        className="rounded-xl px-3 py-3 cursor-pointer overflow-hidden min-w-0"
        style={{ backgroundColor: 'rgba(42,42,42,0.5)', userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {isCompact ? (
          <div className="text-center min-w-0">
            <div className="font-bold leading-tight truncate line-through text-text-muted text-sm">
              {item.displayValue}
            </div>
            <div className="text-success text-xs mt-0.5 font-medium">✓ 切断済</div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-bold text-xl line-through text-text-muted">{item.displayValue}</span>
            <span className="text-success text-sm font-medium">✓ 切断済</span>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      animate={{ backgroundColor: pressing ? '#FF4444' : '#2A2A2A' }}
      transition={{ duration: 0.2 }}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={cancelPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      className="rounded-xl px-3 py-3 select-none cursor-pointer overflow-hidden min-w-0"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {isCompact && !editMode ? (
        // 2〜3列：コンパクト表示
        <div className="text-center min-w-0">
          <div className={`font-bold leading-tight truncate ${
            isCut ? 'line-through text-text-muted' : 'text-text-primary'
          } ${columns === 3 ? f.v3 : f.v2}`}>
            {item.displayValue}
            {count > 1 && <span className="text-brand-light font-bold ml-0.5">×{count}</span>}
          </div>
          {item.memo && (
            <div className="text-text-muted text-xs mt-0.5 truncate">{item.memo}</div>
          )}
          {isCut && <div className="text-success text-xs mt-0.5">✓</div>}
          {!isCut && item.warning && <div className="text-warning text-xs mt-0.5">⚠️</div>}
        </div>
      ) : (
        // 1列 or 編集モード：フル表示
        <div className="flex items-center gap-3">
          {/* 編集モード：ドラッグハンドル */}
          {editMode && (
            <div
              className="text-text-muted flex-shrink-0 touch-none cursor-grab active:cursor-grabbing px-1 py-2"
              onPointerDown={(e) => { e.stopPropagation(); dragControls?.start(e) }}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
              </svg>
            </div>
          )}
          <div className="flex-1">
            <span className={`font-bold ${f.v1} ${isCut ? 'line-through text-text-muted' : 'text-text-primary'}`}>
              {item.displayValue}
            </span>
            {count > 1 && (
              <span className={`text-brand-light font-bold ${f.v1} ml-1`}>×{count}</span>
            )}
            {item.memo && (
              <span className="text-text-muted text-sm ml-2">{item.memo}</span>
            )}
            {item.originalUnit && (
              <div className="text-text-muted text-xs mt-0.5">
                {item.originalUnit}: {item.originalValue}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 編集モード：削除ボタン */}
            {editMode && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onPointerDown={(e) => { e.stopPropagation(); onDelete() }}
                className="w-7 h-7 rounded-full bg-danger flex items-center justify-center"
              >
                <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </motion.button>
            )}
            {isCut && <span className="text-success text-sm font-medium">✓ 切断済</span>}
            {!isCut && !editMode && item.warning && <span className="text-warning">⚠️</span>}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── 編集モーダル（音声入力付き） ────────────────────────────────────
function EditModal({ editingItem, onChange, onSave, onClose }) {
  const handleVoiceResult = useCallback((results) => {
    const first = results[0]
    if (first && first.value != null) {
      onChange((prev) => ({ ...prev, value: String(first.value) }))
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
              value={editingItem.value}
              onChange={(e) => onChange((prev) => ({ ...prev, value: e.target.value }))}
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
