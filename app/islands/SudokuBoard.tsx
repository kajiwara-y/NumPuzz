interface SudokuBoardProps {
  currentGrid: number[][]
  initialGrid: number[][]
  memoGrid: Set<number>[][]
  selectedCell: [number, number] | null
  onCellSelect: (row: number, col: number) => void
  errors?: Set<string>
  isComplete?: boolean
  isMemoryMode?: boolean
  highlightedCell?: string // R3C5形式のセル指定
}

export default function SudokuBoard({
  currentGrid,
  initialGrid,
  memoGrid,
  selectedCell,
  onCellSelect,
  errors = new Set(),
  isComplete = false,
  isMemoryMode = false,
  highlightedCell
}: SudokuBoardProps) {
  // メモ数字を表示する関数
  const renderMemoNumbers = (memos: Set<number>) => {
    if (memos.size === 0) {
      return null
    }
    
    const memoArray = Array.from(memos).sort()
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {memoArray.map((num) => {
          // 3x3グリッドでの位置計算
          const row = Math.floor((num - 1) / 3)
          const col = (num - 1) % 3
          
          const topPercent = row * 33.33
          const leftPercent = col * 33.33
          
          return (
            <span
              key={num}
              className="absolute text-gray-500 font-medium"
              style={{
                fontSize: '0.5rem',
                lineHeight: '0.5rem',
                top: `${topPercent}%`,
                left: `${leftPercent}%`,
                width: '33.33%',
                height: '33.33%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {num}
            </span>
          )
        })}
      </div>
    )
  }

  // セルの関連性を判定する関数（拡張版）
  const getCellRelation = (row: number, col: number) => {
    if (!selectedCell) return 'none'
    
    const [selectedRow, selectedCol] = selectedCell
    const selectedNumber = currentGrid[selectedRow][selectedCol]
    const currentNumber = currentGrid[row][col]
    
    // 選択されたセル自体
    if (row === selectedRow && col === selectedCol) {
      return 'selected'
    }
    
    // 同じ数字（0以外）
    if (selectedNumber !== 0 && currentNumber === selectedNumber) {
      return 'same-number'
    }
    
    // 同じ行
    if (row === selectedRow) {
      return 'same-row'
    }
    
    // 同じ列
    if (col === selectedCol) {
      return 'same-col'
    }
    
    // 同じ3x3ブロック
    const selectedBlockRow = Math.floor(selectedRow / 3)
    const selectedBlockCol = Math.floor(selectedCol / 3)
    const currentBlockRow = Math.floor(row / 3)
    const currentBlockCol = Math.floor(col / 3)
    
    if (selectedBlockRow === currentBlockRow && selectedBlockCol === currentBlockCol) {
      return 'same-block'
    }
    
    return 'none'
  }
  
  // 注: この関数は現在使用していません。将来的に必要になった場合のために残しています。
  // ヒントで指定されたセルをハイライトする関数
  // const highlightHintCell = (cellText: string) => {
  //   // R3C5のような形式をハイライトする
  //   const match = cellText.match(/R(\d+)C(\d+)/i)
  //   if (match) {
  //     const row = parseInt(match[1]) - 1 // 0-indexedに変換
  //     const col = parseInt(match[2]) - 1 // 0-indexedに変換
  //     onCellSelect(row, col)
  //   }
  // }

  const getCellClassName = (row: number, col: number) => {
    const baseClasses = "relative w-8 h-8 sm:w-10 sm:h-10 border border-gray-400 flex items-center justify-center text-sm sm:text-base font-medium cursor-pointer transition-colors"
    
    // 初期値のセルかどうか
    const isInitial = initialGrid[row][col] !== 0
    
    // エラーがあるセルかどうか
    const hasError = errors.has(`${row}-${col}`)

    // セルの関連情報
    const relation = getCellRelation(row, col)
    
    // ヒントでハイライトされているセルかどうか
    const isHighlighted = highlightedCell && 
      highlightedCell.toLowerCase() === `r${row+1}c${col+1}`.toLowerCase()
    
    // 3x3ブロックの境界線
    const thickBorderClasses = []
    if (row % 3 === 0 && row !== 0) thickBorderClasses.push('border-t-2 border-t-gray-800')
    if (col % 3 === 0 && col !== 0) thickBorderClasses.push('border-l-2 border-l-gray-800')
    if (row === 8) thickBorderClasses.push('border-b-2 border-b-gray-800')
    if (col === 8) thickBorderClasses.push('border-r-2 border-r-gray-800')
    
    let colorClasses = ''
    
    if (isHighlighted) {
      // ヒントでハイライトされたセルは最優先
      colorClasses = 'bg-green-300 text-green-900 shadow-inner ring-2 ring-green-500 ring-inset'
    } else if (hasError) {
      // エラーは次に優先
      colorClasses = 'bg-red-100 text-red-700 border-red-300'
    } else if (relation === 'selected') {
      // 選択されたセル
      colorClasses = isMemoryMode ? 'bg-purple-300 text-purple-900 shadow-inner' : 'bg-blue-300 text-blue-900 shadow-inner'
    } else if (relation === 'same-number') {
      // 同じ数字のセル（新機能）
      if (isInitial) {
        colorClasses = 'bg-yellow-200 text-gray-900'
      } else if (isComplete) {
        colorClasses = 'bg-yellow-100 text-green-800'
      } else {
        colorClasses = 'bg-yellow-200 text-gray-700'
      }
    } else if (relation === 'same-row' || relation === 'same-col') {
      // 同じ行・列
      if (isInitial) {
        colorClasses = 'bg-blue-100 text-gray-900 font-bold'
      } else if (isComplete) {
        colorClasses = 'bg-green-100 text-green-800'
      } else {
        colorClasses = 'bg-blue-100 text-gray-700'
      }
    } else if (relation === 'same-block') {
      // 同じ3x3ブロック
      if (isInitial) {
        colorClasses = 'bg-blue-50 text-gray-900 font-bold'
      } else if (isComplete) {
        colorClasses = 'bg-green-50 text-green-800'
      } else {
        colorClasses = 'bg-blue-50 text-gray-700'
      }
    } else if (isInitial) {
      // 初期値（関連なし）
      colorClasses = 'bg-gray-100 text-gray-900 font-bold'
    } else if (isComplete) {
      // 完了時（関連なし）
      colorClasses = 'bg-green-50 text-green-800'
    } else {
      // 通常状態
      colorClasses = 'bg-white text-gray-700 hover:bg-gray-50'
    }
    
    return `${baseClasses} ${colorClasses} ${thickBorderClasses.join(' ')}`
  }

  return (
    <div className="inline-block bg-gray-800 p-1 rounded-lg">
      {/* 列番号の表示 */}
      <div className="flex justify-around mb-1 px-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => (
          <div key={`col-${col}`} className="w-8 h-5 sm:w-10 flex items-center justify-center text-xs text-white font-medium">
            C{col}
          </div>
        ))}
      </div>
      
      <div className="flex">
        {/* 行番号の表示 */}
        <div className="flex flex-col justify-around mr-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(row => (
            <div key={`row-${row}`} className="h-8 w-5 sm:h-10 flex items-center justify-center text-xs text-white font-medium">
              R{row}
            </div>
          ))}
        </div>
        
        {/* 盤面 */}
        <div className="grid grid-cols-9 gap-0 bg-white rounded">
          {currentGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={getCellClassName(rowIndex, colIndex)}
                onClick={() => onCellSelect(rowIndex, colIndex)}
                disabled={isComplete}
                aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}`}
                data-row={rowIndex + 1}
                data-col={colIndex + 1}
              >
                {cell === 0 ? (
                  // 空のセルの場合はメモ数字を表示
                  renderMemoNumbers(memoGrid[rowIndex][colIndex])
                ) : (
                  // 数字が入っている場合は数字を表示
                  <span className="relative z-20 text-center">{cell}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
      
      {/* 凡例 */}
      <div className="mt-2 px-2 flex flex-wrap justify-center gap-2 text-xs text-white">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-blue-300 mr-1 rounded-sm"></span>
          <span>選択中</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-green-300 mr-1 rounded-sm"></span>
          <span>ヒント</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-yellow-200 mr-1 rounded-sm"></span>
          <span>同じ数字</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 bg-red-100 mr-1 rounded-sm"></span>
          <span>矛盾</span>
        </div>
      </div>
    </div>
  )
}
