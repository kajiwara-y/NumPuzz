import { useState, useEffect, useRef } from 'react'
import SudokuBoard from './SudokuBoard'
import GameControls from './GameControls'
import GameStatus from './GameStatus'
import { 
  SudokuPuzzle, 
  SudokuState, 
  createInitialState, 
  isGameComplete,
  isValidMove,
  calculateTimeSpent,
  toggleMemo,
  clearCellMemo,
  autoRemoveMemos,
  clearAllMemos,
  saveCurrentGame,
  loadCurrentGame,
  clearCurrentGame,
  hasSavedGame,
  calculateProgress
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
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false)

// 自動保存用のタイマー
const autoSaveTimerRef = useRef<number | null>(null)

  // 初期化時に保存されたゲームを読み込み
  useEffect(() => {
    const savedGame = loadCurrentGame()
    if (savedGame) {
      setGameState(savedGame)
      setLastSaved('前回の続きから開始')
      
      // 既に完了していたかチェック
      if (savedGame.completedAt) {
        setIsComplete(true)
      }
    } else {
      const initialState = createInitialState(SAMPLE_PUZZLE)
      setGameState(initialState)
    }
  }, [])

  // 自動保存（30秒間隔）
  useEffect(() => {
    if (!gameState || isComplete) return

    // 既存のタイマーをクリア
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // 30秒後に自動保存
    autoSaveTimerRef.current = window.setTimeout(() => {
      if (saveCurrentGame(gameState)) {
        setLastSaved(new Date().toLocaleTimeString())
      }
    }, 30000) // 30秒

    return () => {
      if (autoSaveTimerRef.current !== null) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [gameState, isComplete])

  // ゲーム完了チェック
  useEffect(() => {
    if (gameState && !isComplete) {
      const complete = isGameComplete(gameState.currentGrid, gameState.puzzle.solution)
      if (complete) {
        setIsComplete(true)
        const completedState = {
          ...gameState,
          completedAt: new Date().toISOString(),
          timeSpent: calculateTimeSpent(gameState.startedAt, new Date().toISOString())
        }
        setGameState(completedState)
        
        // 完了時に保存
        saveCurrentGame(completedState)
        setLastSaved('ゲーム完了！')
      }
    }
  }, [gameState?.currentGrid, isComplete])

    // ゲーム状態更新時に即座に保存
  const updateGameState = (newState: SudokuState) => {
    setGameState(newState)
    
    // 状態変更時に即座に保存
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
    
    // 初期値のセルは変更できない
    if (gameState.puzzle.initialGrid[row][col] !== 0) return

    if (gameState.isMemoryMode) {
      // メモモードの場合
      const newMemoGrid = toggleMemo(gameState.memoGrid, row, col, number)
      
      setGameState({
        ...gameState,
        memoGrid: newMemoGrid,
        lastModified: new Date().toISOString(),
        timeSpent: calculateTimeSpent(gameState.startedAt, new Date().toISOString())
      })
    } else {
      // 通常入力モードの場合
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

      // 数字を確定入力した場合、関連するメモを自動削除
      let newMemoGrid = gameState.memoGrid
      if (number !== 0) {
        newMemoGrid = autoRemoveMemos(gameState.memoGrid, row, col, number)
        // 入力したセルのメモもクリア
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
    
    // 初期値のセルは変更できない
    if (gameState.puzzle.initialGrid[row][col] !== 0) return

    if (gameState.isMemoryMode) {
      // メモモードの場合：選択したセルのメモをすべてクリア
      const newMemoGrid = clearCellMemo(gameState.memoGrid, row, col)
      
      updateGameState({
        ...gameState,
        memoGrid: newMemoGrid,
        lastModified: new Date().toISOString(),
        timeSpent: calculateTimeSpent(gameState.startedAt, new Date().toISOString())
      })
    } else {
      // 通常モードの場合：数字をクリア
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
  // 新しいゲームを開始
  const handleNewGame = () => {
    if (hasSavedGame() && !isComplete) {
      setShowNewGameConfirm(true)
    } else {
      startNewGame()
    }
  }

  const startNewGame = () => {
    clearCurrentGame()
    const initialState = createInitialState(SAMPLE_PUZZLE)
    setGameState(initialState)
    setIsComplete(false)
    setErrors(new Set())
    setSelectedCell(null)
    setLastSaved(null)
    setShowNewGameConfirm(false)
  }

  const handleManualSave = () => {
    if (gameState && saveCurrentGame(gameState)) {
      setLastSaved('手動保存完了')
    }
  }

  if (!gameState) {
    return <div className="text-center">Loading...</div>
  }

  const progress = calculateProgress(gameState.currentGrid, gameState.puzzle.initialGrid)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <GameStatus 
          gameState={gameState} 
          isComplete={isComplete}
        />

        {/* 進行状況と保存状態 */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              進行状況: <span className="font-medium">{progress}%</span>
            </span>
            {lastSaved && (
              <span className="text-xs text-green-600">
                💾 {lastSaved}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              onClick={handleManualSave}
              disabled={isComplete}
            >
              手動保存
            </button>
            <button
              className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
              onClick={handleNewGame}
            >
              新しい問題
            </button>
          </div>
        </div>

        {/* メモモード表示 */}
        {gameState.isMemoryMode && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-purple-600 font-medium">📝 メモモード</span>
              <span className="text-sm text-purple-500">
                数字をクリックしてメモを追加/削除できます
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
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

          <div className="lg:w-64">
            <GameControls
              onNumberInput={handleNumberInput}
              onClearCell={handleClearCell}
              onToggleMemoryMode={handleToggleMemoryMode}
              onClearAllMemos={handleClearAllMemos}
              selectedCell={selectedCell}
              isComplete={isComplete}
              isMemoryMode={gameState.isMemoryMode}
            />
          </div>
        </div>

        {/* 完了メッセージ */}
        {isComplete && (
          <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
            <h3 className="text-lg font-bold text-green-800 mb-2">
              🎉 おめでとうございます！
            </h3>
            <p className="text-green-700 mb-3">
              ナンプレを完成させました！
            </p>
            <div className="text-sm text-green-600">
              <p>所要時間: {Math.floor(gameState.timeSpent / 60)}分{gameState.timeSpent % 60}秒</p>
              {gameState.hintsUsed > 0 && (
                <p>使用したヒント: {gameState.hintsUsed}回</p>
              )}
            </div>
          </div>
        )}

        {/* 新しいゲーム確認ダイアログ */}
        {showNewGameConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                新しい問題を開始しますか？
              </h3>
              <p className="text-gray-600 mb-6">
                現在の進行状況（{progress}%）が失われます。
                <br />
                続行してもよろしいですか？
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  onClick={() => setShowNewGameConfirm(false)}
                >
                  キャンセル
                </button>
                <button
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                  onClick={startNewGame}
                >
                  新しい問題を開始
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
