import { useState, useEffect, useRef } from 'react'
import SudokuBoard from './SudokuBoard'
import GameControls from './GameControls'
import GameStatus from './GameStatus'
import { 
  SudokuPuzzle, 
  SudokuState, 
  createInitialState, 
  isGameComplete,
  calculateTimeSpent,
  toggleMemo,
  clearCellMemo,
  autoRemoveMemos,
  clearAllMemos,
  saveCurrentGame,
  loadCurrentGame,
  calculateProgress,
  findConflicts,
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

interface SudokuGameProps {
  onHeaderVisibilityChange?: (isVisible: boolean) => void
}

export default function SudokuGame({ onHeaderVisibilityChange }: SudokuGameProps) {
  const [gameState, setGameState] = useState<SudokuState | null>(null)
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<Set<string>>(new Set())
  const [gameStarted, setGameStarted] = useState(false)

  // 自動保存用のタイマー
  const autoSaveTimerRef = useRef<number | null>(null)

  // 初期化時に保存されたゲームを読み込み
  useEffect(() => {
    const savedGame = loadCurrentGame()
    if (savedGame) {
      setGameState(savedGame)
      setLastSaved('前回の続きから開始')
      
      if (savedGame.completedAt) {
        setIsComplete(true)
      }
      
      const progress = calculateProgress(savedGame.currentGrid, savedGame.puzzle.initialGrid)
      if (progress > 0) {
        setGameStarted(true)
      }
    } else {
      const initialState = createInitialState(SAMPLE_PUZZLE)
      setGameState(initialState)
    }
  }, [])

  // ゲーム開始状態が変わったらヘッダーの表示状態を通知
  useEffect(() => {
    console.log('Game started:', gameStarted, 'Complete:', isComplete)
    if (onHeaderVisibilityChange) {
      if (isComplete) {
        // ゲーム完了時は必ず表示
        onHeaderVisibilityChange(true)
      } else if (gameStarted) {
        // ゲーム開始時は非表示を提案（手動非表示の場合は無視される）
        onHeaderVisibilityChange(false)
      } else {
        // 初期状態では表示
        onHeaderVisibilityChange(true)
      }
    }
  }, [gameStarted, isComplete, onHeaderVisibilityChange])


  // 自動保存（30秒間隔）
  useEffect(() => {
    if (!gameState || isComplete) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      if (saveCurrentGame(gameState)) {
        setLastSaved(new Date().toLocaleTimeString())
      }
    }, 30000)

    return () => {
      if (autoSaveTimerRef.current !== null) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [gameState, isComplete])

  // ゲーム完了チェック
  useEffect(() => {
    if (gameState && !isComplete) {
      const complete = isGameComplete(gameState.currentGrid, gameState.puzzle.solution as number[][])
      if (complete) {
        setIsComplete(true)
        const completedState = {
          ...gameState,
          completedAt: new Date().toISOString(),
          timeSpent: calculateTimeSpent(gameState.startedAt, new Date().toISOString())
        }
        setGameState(completedState)
        
        saveCurrentGame(completedState)
        setLastSaved('ゲーム完了！')
      }
    }
  }, [gameState?.currentGrid, isComplete])

  // 矛盾チェック
  useEffect(() => {
    if (gameState) {
      const newConflicts = findConflicts(gameState.currentGrid)
      setConflicts(newConflicts)
      setErrors(newConflicts)
    }
  }, [gameState?.currentGrid])

  // ゲーム状態更新
  const updateGameState = (newState: SudokuState) => {
    setGameState(newState)
    
    if (saveCurrentGame(newState)) {
      setLastSaved('保存済み')
    }
  }

  const handleCellSelect = (row: number, col: number) => {
    setSelectedCell([row, col])
  }

  const handleNumberInput = (number: number) => {
    if (!gameState || !selectedCell || isComplete) return

    const [row, col] = selectedCell
    
    if (gameState.puzzle.initialGrid[row][col] !== 0) return

    if (!gameStarted) {
      console.log('Setting game started to true') // デバッグ用
      setGameStarted(true)
    }

    if (gameState.isMemoryMode) {
      const newMemoGrid = toggleMemo(gameState.memoGrid, row, col, number)
      
      setGameState({
        ...gameState,
        memoGrid: newMemoGrid,
        lastModified: new Date().toISOString(),
        timeSpent: calculateTimeSpent(gameState.startedAt, new Date().toISOString())
      })
    } else {
      const newGrid = gameState.currentGrid.map((r, rowIndex) =>
        r.map((cell, colIndex) =>
          rowIndex === row && colIndex === col ? number : cell
        )
      )

      let newMemoGrid = gameState.memoGrid
      if (number !== 0) {
        newMemoGrid = autoRemoveMemos(gameState.memoGrid, row, col, number)
        newMemoGrid = clearCellMemo(newMemoGrid, row, col)
      }

      updateGameState({
        ...gameState,
        currentGrid: newGrid,
        memoGrid: newMemoGrid,
        lastModified: new Date().toISOString(),
        timeSpent: calculateTimeSpent(gameState.startedAt, new Date().toISOString())
      })
    }
  }

  const handleClearCell = () => {
    if (!gameState || !selectedCell || isComplete) return

    const [row, col] = selectedCell
    
    if (gameState.puzzle.initialGrid[row][col] !== 0) return

    if (gameState.isMemoryMode) {
      const newMemoGrid = clearCellMemo(gameState.memoGrid, row, col)
      
      updateGameState({
        ...gameState,
        memoGrid: newMemoGrid,
        lastModified: new Date().toISOString(),
        timeSpent: calculateTimeSpent(gameState.startedAt, new Date().toISOString())
      })
    } else {
      handleNumberInput(0)
    }
  }

  const handleToggleMemoryMode = () => {
    if (!gameState || isComplete) return

    updateGameState({
      ...gameState,
      isMemoryMode: !gameState.isMemoryMode,
      lastModified: new Date().toISOString()
    })
  }

  const handleClearAllMemos = () => {
    if (!gameState || isComplete) return

    const newMemoGrid = clearAllMemos(gameState.memoGrid)
    
    updateGameState({
      ...gameState,
      memoGrid: newMemoGrid,
      lastModified: new Date().toISOString(),
      timeSpent: calculateTimeSpent(gameState.startedAt, new Date().toISOString())
    })
  }

  const handleResetToInitial = () => {
    if (!gameState) return

    const confirm = window.confirm(
      '最初からやり直しますか？\n' +
      '入力した数字とメモがすべて削除されます。'
    )

    if (confirm) {
      updateGameState({
        ...gameState,
        currentGrid: gameState.puzzle.initialGrid.map(row => [...row]),
        memoGrid: Array(9).fill(null).map(() =>
          Array(9).fill(null).map(() => new Set())
        ),
        lastModified: new Date().toISOString()
      })
      setGameStarted(false)
    }
  }

  const handleManualSave = () => {
    if (gameState && saveCurrentGame(gameState)) {
      setLastSaved('手動保存完了')
    }
  }

  if (!gameState) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const progress = calculateProgress(gameState.currentGrid, gameState.puzzle.initialGrid)

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <GameStatus gameState={gameState} isComplete={isComplete} />

      {/* 進行状況とコントロール */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            進行状況: <span className="font-medium text-blue-600">{progress}%</span>
          </div>
          {lastSaved && (
            <div className="text-xs text-gray-500">
              💾 {lastSaved}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleManualSave}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
          >
            💾 手動保存
          </button>
          <button
            onClick={handleResetToInitial}
            className="flex-1 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm rounded-lg transition-colors"
          >
            🔄 最初から
          </button>
        </div>
      </div>

      {/* 矛盾警告 */}
      {conflicts.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700">
            <span>⚠️</span>
            <span className="font-medium">
              矛盾を検出しました ({conflicts.size}箇所)
            </span>
          </div>
          <div className="text-sm text-red-600 mt-1">
            赤色のセルを確認してください
          </div>
        </div>
      )}

      {/* メモモード表示 */}
      {gameState.isMemoryMode && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-700">
            <span>📝</span>
            <span className="font-medium">メモモード</span>
            <span className="text-sm text-purple-600">
              数字をクリックしてメモを追加/削除できます
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-center">
          <SudokuBoard
            currentGrid={gameState.currentGrid}
            initialGrid={gameState.puzzle.initialGrid}
            memoGrid={gameState.memoGrid}
            selectedCell={selectedCell}
            onCellSelect={handleCellSelect}
            errors={errors}
            isComplete={isComplete}
            isMemoryMode={gameState.isMemoryMode}
          />
        </div>

        <div className="space-y-4">
          <GameControls
            onNumberInput={handleNumberInput}
            onClearCell={handleClearCell}
            onToggleMemoryMode={handleToggleMemoryMode}
            onClearAllMemos={handleClearAllMemos}
            selectedCell={selectedCell}
            isComplete={isComplete}
            isMemoryMode={gameState.isMemoryMode}
            currentGrid={gameState.currentGrid}
          />
        </div>
      </div>

      {/* 完了メッセージ */}
      {isComplete && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-2">
          <div className="text-2xl">
            🎉 おめでとうございます！
          </div>

          <div className="text-lg font-medium text-green-800">
            ナンプレを完成させました！
          </div>

          <div className="text-sm text-green-700 space-y-1">
            <div>所要時間: {Math.floor(gameState.timeSpent / 60)}分{gameState.timeSpent % 60}秒</div>
            {gameState.hintsUsed > 0 && (
              <div>使用したヒント: {gameState.hintsUsed}回</div>
            )}
          </div>

          <div className="pt-3 border-t border-green-200">
            <a
              href="/create"
              className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              📷 新しい問題を作成する
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
