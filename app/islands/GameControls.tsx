interface GameControlsProps {
  onNumberInput: (number: number) => void
  onClearCell: () => void
  selectedCell: [number, number] | null
  isComplete?: boolean
}

export default function GameControls({
  onNumberInput,
  onClearCell,
  selectedCell,
  isComplete = false
}: GameControlsProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <div className="space-y-4">
      {/* 数字入力ボタン */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">数字入力</h3>
        <div className="grid grid-cols-3 gap-2">
          {numbers.map((number) => (
            <button
              key={number}
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
              onClick={() => onNumberInput(number)}
              disabled={!selectedCell || isComplete}
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      {/* クリアボタン */}
      <div>
        <button
          className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
          onClick={onClearCell}
          disabled={!selectedCell || isComplete}
        >
          クリア
        </button>
      </div>

      {/* 将来実装予定の機能ボタン */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">ツール</h3>
        
        <button
          className="w-full py-2 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed"
          disabled
          title="将来実装予定"
        >
          📝 メモ機能
        </button>
        
        <button
          className="w-full py-2 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed"
          disabled
          title="将来実装予定"
        >
          💡 ヒント
        </button>
        
        <button
          className="w-full py-2 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed"
          disabled
          title="将来実装予定"
        >
          💾 保存
        </button>
        
        <button
          className="w-full py-2 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed"
          disabled
          title="将来実装予定"
        >
          📁 読み込み
        </button>

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
