import { SudokuState, formatTime, getDifficultyLabel, getDifficultyColor } from '../utils/sudoku'

interface GameStatusProps {
  gameState: SudokuState
  isComplete: boolean
}

export default function GameStatus({ gameState, isComplete }: GameStatusProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            {gameState.puzzle.title}
          </h2>
          <p className={`text-sm font-medium ${getDifficultyColor(gameState.puzzle.difficulty)}`}>
            難易度: {getDifficultyLabel(gameState.puzzle.difficulty)}
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span className="font-medium">⏱️ 経過時間:</span>
            <span className="font-mono">
              {formatTime(gameState.timeSpent)}
            </span>
          </div>
          
          {gameState.hintsUsed > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-medium">💡 ヒント:</span>
              <span>{gameState.hintsUsed}回</span>
            </div>
          )}
          
          {isComplete && (
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <span>✅ 完了</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
