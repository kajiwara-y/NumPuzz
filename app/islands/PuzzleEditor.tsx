import { useState } from 'react'
import { solveSudoku, hasUniqueSolution } from '../utils/sudoku'

interface PuzzleEditorProps {
  initialGrid: number[][]
  confidence?: number
  onSave: (grid: number[][]) => void
  onCancel: () => void
}

export default function PuzzleEditor({ 
  initialGrid, 
  confidence = 0, 
  onSave, 
  onCancel 
}: PuzzleEditorProps) {
  const [grid, setGrid] = useState<number[][]>(
    initialGrid.map(row => [...row])
  )
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [errors, setErrors] = useState<Set<string>>(new Set())

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell([row, col])
  }

  const handleNumberInput = (number: number) => {
    if (!selectedCell) return

    const [row, col] = selectedCell
    const newGrid = grid.map((r, rowIndex) =>
      r.map((cell, colIndex) =>
        rowIndex === row && colIndex === col ? number : cell
      )
    )

    setGrid(newGrid)
    
    // 簡単なバリデーション
    validateGrid(newGrid)
  }

  const validateGrid = (currentGrid: number[][]) => {
    const newErrors = new Set<string>()
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const num = currentGrid[row][col]
        if (num !== 0) {
          // 行チェック
          for (let c = 0; c < 9; c++) {
            if (c !== col && currentGrid[row][c] === num) {
              newErrors.add(`${row}-${col}`)
            }
          }
          
          // 列チェック
          for (let r = 0; r < 9; r++) {
            if (r !== row && currentGrid[r][col] === num) {
              newErrors.add(`${row}-${col}`)
            }
          }
          
          // 3x3ブロックチェック
          const blockRow = Math.floor(row / 3) * 3
          const blockCol = Math.floor(col / 3) * 3
          
          for (let r = blockRow; r < blockRow + 3; r++) {
            for (let c = blockCol; c < blockCol + 3; c++) {
              if ((r !== row || c !== col) && currentGrid[r][c] === num) {
                newErrors.add(`${row}-${col}`)
              }
            }
          }
        }
      }
    }
    
    setErrors(newErrors)
  }

  const getCellClassName = (row: number, col: number) => {
    const baseClasses = "w-8 h-8 sm:w-10 sm:h-10 border border-gray-400 flex items-center justify-center text-sm sm:text-base font-medium cursor-pointer transition-colors"
    
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col
    const hasError = errors.has(`${row}-${col}`)
    
    // 3x3ブロックの境界線
    const thickBorderClasses = []
    if (row % 3 === 0 && row !== 0) thickBorderClasses.push('border-t-2 border-t-gray-800')
    if (col % 3 === 0 && col !== 0) thickBorderClasses.push('border-l-2 border-l-gray-800')
    if (row === 8) thickBorderClasses.push('border-b-2 border-b-gray-800')
    if (col === 8) thickBorderClasses.push('border-r-2 border-r-gray-800')
    
    let colorClasses = ''
    if (hasError) {
      colorClasses = 'bg-red-100 text-red-700 border-red-300'
    } else if (isSelected) {
      colorClasses = 'bg-blue-200 text-blue-900'
    } else {
      colorClasses = 'bg-white text-gray-700 hover:bg-gray-50'
    }
    
    return `${baseClasses} ${colorClasses} ${thickBorderClasses.join(' ')}`
  }

  const handleSave = () => {
    if (errors.size > 0) {
      alert('エラーがある箇所を修正してください')
      return
    }
    // 解答が生成できるかチェック
    try {
      const solution = solveSudoku(grid)
      if (!solution) {
        alert('この問題は解くことができません。数字を見直してください。')
        return
      }
    
      // 一意解かチェック（オプション）
      if (!hasUniqueSolution(grid)) {
        const proceed = confirm(
          'この問題は複数の解答を持つ可能性があります。続行しますか？'
        )
        if (!proceed) return
      }
    
      onSave(grid)
    } catch (error) {
      alert('問題の検証中にエラーが発生しました。')
      console.error('Validation error:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          ✏️ 問題の確認・修正
        </h2>

        {/* 信頼度表示 */}
        {confidence > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              AI解析の信頼度: <span className="font-medium">{Math.round(confidence * 100)}%</span>
              {confidence < 0.8 && (
                <span className="ml-2 text-orange-600">
                  （信頼度が低いため、内容を確認してください）
                </span>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ナンプレボード */}
          <div className="flex-1">
            <div className="inline-block bg-gray-800 p-1 rounded-lg">
              <div className="grid grid-cols-9 gap-0 bg-white rounded">
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      className={getCellClassName(rowIndex, colIndex)}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {cell === 0 ? '' : cell}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 編集コントロール */}
          <div className="lg:w-64">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">数字入力</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                    <button
                      key={number}
                      className="w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
                      onClick={() => handleNumberInput(number)}
                      disabled={!selectedCell}
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
                  onClick={() => handleNumberInput(0)}
                  disabled={!selectedCell}
                >
                  セルクリア
                </button>
              </div>

              {/* 全クリアボタン */}
              <div>
                <button
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                  onClick={() => {
                    setGrid(Array(9).fill(null).map(() => Array(9).fill(0)))
                    setErrors(new Set())
                  }}
                >
                  全てクリア
                </button>
              </div>

              {/* エラー表示 */}
              {errors.size > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-1">エラー</h4>
                  <p className="text-sm text-red-600">
                    {errors.size}箇所にルール違反があります
                  </p>
                </div>
              )}

              {/* 使用方法 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">使用方法</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• セルをクリックして選択</li>
                  <li>• 数字ボタンで入力</li>
                  <li>• 空白にする場合は「セルクリア」</li>
                  <li>• 赤色のセルはルール違反です</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 保存・キャンセルボタン */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            className={`px-6 py-2 rounded-lg transition-colors font-medium ${
              errors.size > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={handleSave}
            disabled={errors.size > 0}
          >
            この問題で開始
          </button>
        </div>
      </div>
    </div>
  )
}
