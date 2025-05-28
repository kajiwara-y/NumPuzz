interface SudokuBoardProps {
  currentGrid: number[][]
  initialGrid: number[][]
  memoGrid: Set<number>[][]
  selectedCell: [number, number] | null
  onCellSelect: (row: number, col: number) => void
  errors?: Set<string>
  isComplete?: boolean
  isMemoryMode?: boolean
}

export default function SudokuBoard({
  currentGrid,
  initialGrid,
  memoGrid,
  selectedCell,
  onCellSelect,
  errors = new Set(),
  isComplete = false,
  isMemoryMode = false
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

  const getCellClassName = (row: number, col: number) => {
    const baseClasses = "relative w-8 h-8 sm:w-10 sm:h-10 border border-gray-400 flex items-center justify-center text-sm sm:text-base font-medium cursor-pointer transition-colors"    
    // 初期値のセルかどうか
    const isInitial = initialGrid[row][col] !== 0
    
    // 選択されたセルかどうか
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col
    
    // エラーがあるセルかどうか
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
      colorClasses = isMemoryMode ? 'bg-purple-200 text-purple-900' : 'bg-blue-200 text-blue-900'
    } else if (isInitial) {
      colorClasses = 'bg-gray-100 text-gray-900 font-bold'
    } else if (isComplete) {
      colorClasses = 'bg-green-50 text-green-800'
    } else {
      colorClasses = 'bg-white text-gray-700 hover:bg-gray-50'
    }
    
    return `${baseClasses} ${colorClasses} ${thickBorderClasses.join(' ')}`
  }

  return (
    <div className="inline-block bg-gray-800 p-1 rounded-lg">
      <div className="grid grid-cols-9 gap-0 bg-white rounded">
        {currentGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={getCellClassName(rowIndex, colIndex)}
              onClick={() => onCellSelect(rowIndex, colIndex)}
              disabled={isComplete}
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
  )
}
