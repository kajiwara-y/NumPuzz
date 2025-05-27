import { useState, useEffect } from 'react'
import SudokuBoard from './SudokuBoard'
import GameControls from './GameControls'
import GameStatus from './GameStatus'
import { 
  SudokuPuzzle, 
  SudokuState, 
  createInitialState, 
  isGameComplete,
  isValidMove,
  calculateTimeSpent
} from '../utils/sudoku'

// サンプル問題データ
const SAMPLE_PUZZLE: SudokuPuzzle = {
  id: 'sample-001',
  title: 'サンプル問題 1',
  difficulty: 'medium',
  initialGrid: [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ],
  solution: [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ],
  createdAt: new Date().toISOString()
}

export default function SudokuGame() {
  const [gameState, setGameState] = useState<SudokuState | null>(null)
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [errors, setErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    // 初期状態を作成
    const initialState = createInitialState(SAMPLE_PUZZLE)
    setGameState(initialState)
  }, [])

  // ゲーム完了チェック
  useEffect(() => {
    if (gameState && !isComplete) {
      const complete = isGameComplete(gameState.currentGrid, gameState.puzzle.solution)
      if (complete) {
        setIsComplete(true)
        setGameState(prev => prev ? {
          ...prev,
          completedAt: new Date().toISOString(),
          timeSpent: calculateTimeSpent(prev.startedAt, new Date().toISOString())
        } : null)
      }
    }
  }, [gameState?.currentGrid, isComplete])

  const handleCellSelect = (row: number, col: number) => {
    setSelectedCell([row, col])
  }

  const handleNumberInput = (number: number) => {
    if (!gameState || !selectedCell || isComplete) return

    const [row, col] = selectedCell
    
    // 初期値のセルは変更できない
    if (gameState.puzzle.initialGrid[row][col] !== 0) return

    const newGrid = gameState.currentGrid.map((r, rowIndex) =>
      r.map((cell, colIndex) =>
        rowIndex === row && colIndex === col ? number : cell
      )
    )

    // バリデーションチェック
    const newErrors = new Set<string>()
    if (number !== 0 && !isValidMove(newGrid, row, col, number)) {
      newErrors.add(`${row}-${col}`)
    }
    setErrors(newErrors)

    setGameState({
      ...gameState,
      currentGrid: newGrid,
      lastModified: new Date().toISOString(),
      timeSpent: calculateTimeSpent(gameState.startedAt, new Date().toISOString())
    })
  }

  const handleClearCell = () => {
    if (!gameState || !selectedCell || isComplete) return

    const [row, col] = selectedCell
    
    // 初期値のセルは変更できない
    if (gameState.puzzle.initialGrid[row][col] !== 0) return

    handleNumberInput(0)
  }

  if (!gameState) {
    return <div className="text-center">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <GameStatus 
          gameState={gameState} 
          isComplete={isComplete}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <SudokuBoard
              currentGrid={gameState.currentGrid}
              initialGrid={gameState.puzzle.initialGrid}
              selectedCell={selectedCell}
              onCellSelect={handleCellSelect}
              errors={errors}
              isComplete={isComplete}
            />
          </div>

          <div className="lg:w-64">
            <GameControls
              onNumberInput={handleNumberInput}
              onClearCell={handleClearCell}
              selectedCell={selectedCell}
              isComplete={isComplete}
            />
          </div>
        </div>

        {isComplete && (
          <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
            <h3 className="text-lg font-bold text-green-800 mb-2">
              🎉 おめでとうございます！
            </h3>
            <p className="text-green-700">
              ナンプレを完成させました！
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
