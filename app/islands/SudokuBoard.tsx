interface SudokuBoardProps {
  currentGrid: number[][]
  initialGrid: number[][]
  selectedCell: [number, number] | null
  onCellSelect: (row: number, col: number) => void
  errors?: Set<string>
  isComplete?: boolean
}

export default function SudokuBoard({
  currentGrid,
  initialGrid,
  selectedCell,
  onCellSelect,
  errors = new Set(),
  isComplete = false
}: SudokuBoardProps) {
  const getCellClassName = (row: number, col: number) => {
    const baseClasses = "w-8 h-8 sm:w-10 sm:h-10 border border-gray-400 flex items-center justify-center text-sm sm:text-base font-medium cursor-pointer transition-colors"
    
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
      colorClasses = 'bg-blue-200 text-blue-900'
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
              {cell === 0 ? '' : cell}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
