import { useState, useEffect } from 'react'
import { SudokuState } from '../utils/sudoku'

interface SudokuHintButtonProps {
  gameState: SudokuState
  progress: number
  onHighlightCell?: (cellRef: string) => void
}

interface TechniqueHint {
  technique: string
  description: string
  timestamp: string
}

export default function SudokuHintButton({ gameState, progress, onHighlightCell }: SudokuHintButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hint, setHint] = useState<TechniqueHint | null>(null)

  // LocalStorageからヒント履歴を取得
  const getHintHistory = (): TechniqueHint[] => {
    try {
      const stored = localStorage.getItem('sudoku_hints')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load hint history:', error)
      return []
    }
  }

  // LocalStorageにヒント履歴を保存
  const saveHintToHistory = (newHint: TechniqueHint) => {
    try {
      const history = getHintHistory()
      const updatedHistory = [newHint, ...history].slice(0, 10) // 最新10件まで保存
      localStorage.setItem('sudoku_hints', JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to save hint to history:', error)
    }
  }

  // Geminiにテクニック提案を依頼
  const requestHint = async () => {
    setIsLoading(true)
    setShowHint(false)

    try {
      // メモ情報を配列に変換
      const memoGridArray = gameState.memoGrid.map(row => 
        row.map(cell => Array.from(cell))
      )

      // APIリクエスト
      const response = await fetch('/api/analyze-sudoku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentGrid: gameState.currentGrid,
          initialGrid: gameState.puzzle.initialGrid,
          memoGrid: memoGridArray,
          progress
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'ヒントの取得に失敗しました')
      }

      const newHint: TechniqueHint = {
        technique: data.technique,
        description: data.description,
        timestamp: data.timestamp
      }

      setHint(newHint)
      setShowHint(true)
      saveHintToHistory(newHint)

    } catch (error) {
      console.error('Failed to get hint:', error)
      alert('ヒントの取得に失敗しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const hintHistory = getHintHistory()

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">テクニックヒント</h3>
        {!showHint && (
          <button
            onClick={requestHint}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isLoading 
                ? 'bg-gray-100 text-gray-400' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {isLoading ? '取得中...' : '次のテクニックを提案'}
          </button>
        )}
      </div>

      {showHint && hint && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-blue-800">{hint.technique}</h4>
            <button 
              onClick={() => setShowHint(false)} 
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              閉じる
            </button>
          </div>
          <p className="text-sm text-gray-700">
            {hint.description.split(/\b(R\d+C\d+)\b/).map((part, index) => {
              const isCellRef = /^R\d+C\d+$/.test(part);
              return isCellRef ? (
                <button 
                  key={index}
                  className="font-medium text-blue-700 underline"
                  onClick={() => onHighlightCell && onHighlightCell(part)}
                >
                  {part}
                </button>
              ) : (
                <span key={index}>{part}</span>
              );
            })}
          </p>
        </div>
      )}

      {hintHistory.length > 0 && !showHint && (
        <div>
          <div className="text-sm text-gray-600 mb-2">最近のヒント履歴:</div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {hintHistory.map((item, index) => (
              <div 
                key={index} 
                className="bg-gray-50 border border-gray-100 rounded-lg p-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setHint(item)
                  setShowHint(true)
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.technique}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                  {item.description.replace(/R\d+C\d+/g, match => `[${match}]`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}