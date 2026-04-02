import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useMeasurementStore = create(
  persist(
    (set, get) => ({
      // 全寸法データ
      measurements: [],

      // 切断モードに送る選択済み寸法
      selectedForCutting: [],

      // 寸法を追加（バッチ単位）
      addBatch: (items) => {
        const batch = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          items: items.map((item, i) => ({
            id: Date.now() + i,
            value: item.value,           // mm値
            displayValue: item.displayValue, // 表示用（計算式など）
            unit: item.unit || 'mm',
            originalUnit: item.originalUnit || null,
            originalValue: item.originalValue || null,
            memo: item.memo || '',
            sketch: item.sketch || null,
            warning: item.warning || false,
            warningText: item.warningText || '',
            cut: false,
          })),
        }
        set((state) => ({
          measurements: [...state.measurements, batch],
        }))
      },

      // 寸法を更新
      updateItem: (batchId, itemId, updates) => {
        set((state) => ({
          measurements: state.measurements.map((batch) =>
            batch.id === batchId
              ? {
                  ...batch,
                  items: batch.items.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                }
              : batch
          ),
        }))
      },

      // 寸法を削除
      deleteItem: (batchId, itemId) => {
        set((state) => ({
          measurements: state.measurements.map((batch) =>
            batch.id === batchId
              ? { ...batch, items: batch.items.filter((i) => i.id !== itemId) }
              : batch
          ).filter((batch) => batch.items.length > 0),
        }))
      },

      // 全データ取得（フラット）
      getAllItems: () => {
        return get().measurements.flatMap((batch) => batch.items)
      },

      // 切断済みにマーク
      markAsCut: (itemId) => {
        set((state) => ({
          measurements: state.measurements.map((batch) => ({
            ...batch,
            items: batch.items.map((item) =>
              item.id === itemId ? { ...item, cut: true } : item
            ),
          })),
        }))
      },

      // 切断モード用に選択
      setSelectedForCutting: (items) => set({ selectedForCutting: items }),

      // 全データ削除
      clearAll: () => set({ measurements: [], selectedForCutting: [] }),
    }),
    {
      name: 'kizamin-measurements',
    }
  )
)
