interface GameControlsProps {
  onNumberInput: (number: number) => void
  onClearCell: () => void
  onToggleMemoryMode: () => void
  onClearAllMemos: () => void
  selectedCell: [number, number] | null
  isComplete?: boolean
  isMemoryMode?: boolean
}

export default function GameControls({
  onNumberInput,
  onClearCell,
  onToggleMemoryMode,
  onClearAllMemos,
  selectedCell,
  isComplete = false,
  isMemoryMode = false
}: GameControlsProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <div className="space-y-4">
      {/* メモモード切り替え */}
      <div>
        <button
          className={`w-full py-2 font-medium rounded-lg transition-colors mb-3 ${
            isMemoryMode 
              ? 'bg-purple-500 hover:bg-purple-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          onClick={onToggleMemoryMode}
          disabled={isComplete}
        >
          📝 {isMemoryMode ? 'メモモード ON' : 'メモモード OFF'}
        </button>
      </div> 
      {/* 数字入力ボタン */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          {isMemoryMode ? 'メモ入力' : '数字入力'}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {numbers.map((number) => (
            <button
              key={number}
              className={`w-12 h-12 font-bold rounded-lg transition-colors ${
                isMemoryMode 
                  ? 'bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white'
              }`}
              onClick={() => onNumberInput(number)}
              disabled={!selectedCell || isComplete}
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      {/* クリアボタン */}
      <div className="space-y-2">
        <button
          className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
          onClick={onClearCell}
          disabled={!selectedCell || isComplete}
        >
          {isMemoryMode ? 'メモクリア' : 'セルクリア'}
        </button>
        
        {isMemoryMode && (
          <button
            className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
            onClick={onClearAllMemos}
            disabled={isComplete}
          >
            全メモクリア
          </button>
        )}
      </div>

      {/* 将来実装予定の機能ボタン */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">将来の機能</h3>
        
        <button
          className="w-full py-2 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed"
          disabled
          title="将来実装予定"
        >
          📷 写真から作成
        </button>
      </div>

      {/* 完了時のメッセージ */}
      {isComplete && (
        <div className="pt-4 border-t border-gray-200">
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <p className="text-green-800 font-medium text-sm">
              🎉 ゲーム完了！
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
