import { getCompletedNumbers } from '../utils/sudoku'
interface GameControlsProps {
  onNumberInput: (number: number) => void
  onClearCell: () => void
  onToggleMemoryMode: () => void
  onClearAllMemos: () => void
  selectedCell: [number, number] | null
  isComplete?: boolean
  isMemoryMode?: boolean
  currentGrid: number[][] // 追加
}

export default function GameControls({
  onNumberInput,
  onClearCell,
  onToggleMemoryMode,
  onClearAllMemos,
  selectedCell,
  isComplete = false,
  isMemoryMode = false,
  currentGrid // 追加
}: GameControlsProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  
  // 使い切った数字を計算
  const completedNumbers = getCompletedNumbers(currentGrid)

  return (
    <div className="space-y-4">
      {/* メモモード切り替え */}
      <div>
        <button
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            isMemoryMode
              ? 'bg-purple-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={onToggleMemoryMode}
          disabled={isComplete}
        >
          📝 {isMemoryMode ? 'メモモード ON' : 'メモモード OFF'}
        </button>
      </div>
 
      {/* 数字入力ボタン */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">
          {isMemoryMode ? 'メモ入力' : '数字入力'}
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {numbers.map((number) => {
            const isCompleted = completedNumbers.has(number)
            return (
              <button
                key={number}
                className={`
                  h-12 text-lg font-bold rounded-lg border-2 transition-all relative
                  ${!selectedCell || isComplete 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                    : isCompleted
                    ? 'bg-green-100 text-green-600 border-green-300 cursor-default'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 active:scale-95'
                  }
                `}
                onClick={() => !isCompleted && onNumberInput(number)}
                disabled={!selectedCell || isComplete || isCompleted}
              >
                {number}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        
        {/* 完了した数字の表示 */}
        {completedNumbers.size > 0 && (
          <div className="text-xs text-green-600 text-center">
            完了: {Array.from(completedNumbers).sort().join(', ')} 
            ({completedNumbers.size}/9)
          </div>
        )}
      </div>

      {/* クリアボタン */}
      <div className="space-y-2">
        <button
          className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400"
          onClick={onClearCell}
          disabled={!selectedCell || isComplete}
        >
          {isMemoryMode ? 'メモクリア' : 'セルクリア'}
        </button>
        {isMemoryMode && (
          <button
            className="w-full px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400"
            onClick={onClearAllMemos}
            disabled={isComplete}
          >
            全メモクリア
          </button>
        )}
      </div>

      {/* 完了時のメッセージ */}
      {isComplete && (
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-green-700 font-bold text-lg">
            🎉 ゲーム完了！
          </div>
        </div>
      )}
    </div>
  )
}
