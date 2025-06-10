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
  calculateProgress,
  getCompletedNumbers,
  findConflicts,
  GameSnapshot,
  createSnapshot
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
  const [snapshots, setSnapshots] = useState<GameSnapshot[]>([])
  const [conflicts, setConflicts] = useState<Set<string>>(new Set())

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
      const complete = isGameComplete(gameState.currentGrid, gameState.puzzle.solution as number[][])
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

  // 矛盾チェック（グリッド変更時に実行）
  useEffect(() => {
    if (gameState) {
      const newConflicts = findConflicts(gameState.currentGrid)
      setConflicts(newConflicts)
      setErrors(newConflicts) // errorsも更新してSudokuBoardに反映
    }
  }, [gameState?.currentGrid])

  // ゲーム状態更新時に即座に保存
  const updateGameState = (newState: SudokuState) => {
    setGameState(newState)
    
    // 状態変更時に即座に保存
    if (saveCurrentGame(newState)) {
      setLastSaved('保存済み')
    }
  }

  // スナップショット作成（重要な操作前に自動実行）
  const createGameSnapshot = (description: string) => {
    if (!gameState) return
    
    const snapshot = createSnapshot(gameState, description)
    setSnapshots(prev => {
      const newSnapshots = [...prev, snapshot]
      // 最大10個まで保持
      if (newSnapshots.length > 10) {
        newSnapshots.shift()
      }
      return newSnapshots
    })
  }

  const handleCellSelect = (row: number, col: number) => {
    setSelectedCell([row, col])
  }

  const handleNumberInput = (number: number) => {
    if (!gameState || !selectedCell || isComplete) return

    const [row, col] = selectedCell
    
    // 初期値のセルは変更できない
    if (gameState.puzzle.initialGrid[row][col] !== 0) return

    // 重要な変更前にスナップショット作成
    if (number !== 0 && gameState.currentGrid[row][col] === 0) {
      createGameSnapshot(`数字${number}を[${row+1},${col+1}]に配置`)
    }

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

  // リセット機能
  const handleResetToSnapshot = (snapshotIndex: number) => {
    if (!gameState || !snapshots[snapshotIndex]) return

    const snapshot = snapshots[snapshotIndex]
    const confirm = window.confirm(
      `${snapshot.description}の状態に戻しますか？\n` +
      `(${new Date(snapshot.timestamp).toLocaleString()})`
    )

    if (confirm) {
      updateGameState({
        ...gameState,
        currentGrid: snapshot.currentGrid.map(row => [...row]),
        memoGrid: snapshot.memoGrid.map(row => row.map(cell => new Set(cell))),
        lastModified: new Date().toISOString()
      })
      
      // 使用したスナップショット以降を削除
      setSnapshots(prev => prev.slice(0, snapshotIndex))
    }
  }

  const handleResetToInitial = () => {
    if (!gameState) return

    const confirm = window.confirm(
      '初期状態に戻しますか？\n' +
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
      setSnapshots([])
    }
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
    setSnapshots([])
    setConflicts(new Set())
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
    <div className="max-w-md mx-auto p-4 space-y-4">
      <GameStatus gameState={gameState} isComplete={isComplete} />

      {/* 進行状況と保存状態 */}
      <div className="flex justify-between items-center text-sm">
        <div className="space-x-4">
          <span className="text-gray-600">
            進行状況: {progress}%
          </span>
          {lastSaved && (
            <span className="text-green-600">
              💾 {lastSaved}
            </span>
          )}
        </div>

        <div className="space-x-2">
          <button
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
            onClick={handleManualSave}
          >
            手動保存
          </button>
          <button
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            onClick={handleNewGame}
          >
            新しい問題
          </button>
        </div>
      </div>

      {/* 矛盾警告 */}
      {conflicts.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-red-700 font-medium">
              矛盾を検出しました ({conflicts.size}箇所)
            </span>
          </div>
          <p className="text-red-600 text-sm mt-1">
            赤色のセルを確認してください
          </p>
        </div>
      )}

      {/* リセット機能 */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <h3 className="text-sm font-medium text-gray-700">操作履歴</h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            onClick={handleResetToInitial}
          >
            🔄 最初から
          </button>
          
          {snapshots.slice(-3).map((snapshot, index) => {
            const actualIndex = snapshots.length - 3 + index
            return (
              <button
                key={actualIndex}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                onClick={() => handleResetToSnapshot(actualIndex)}
                title={new Date(snapshot.timestamp).toLocaleString()}
              >
                ↶ {snapshot.description}
              </button>
            )
          })}
        </div>
        
        {snapshots.length === 0 && (
          <p className="text-gray-500 text-sm">履歴はありません</p>
        )}
      </div>

      {/* メモモード表示 */}
      {gameState.isMemoryMode && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
          <div className="flex items-center space-x-2">
            <span className="text-purple-600">📝 メモモード</span>
            <span className="text-purple-600 text-sm">
              数字をクリックしてメモを追加/削除できます
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
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
        <div className="text-center space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-green-700 font-bold text-xl">
            🎉 おめでとうございます！
          </div>

          <div className="text-green-600">
            ナンプレを完成させました！
          </div>

          <div className="text-green-600 text-sm">
            所要時間: {Math.floor(gameState.timeSpent / 60)}分{gameState.timeSpent % 60}秒

            {gameState.hintsUsed > 0 && (
              <div>使用したヒント: {gameState.hintsUsed}回</div>
            )}
          </div>
        </div>
      )}

      {/* 新しいゲーム確認ダイアログ */}
      {showNewGameConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              新しい問題を開始しますか？
            </h3>

            <p className="text-gray-600 mb-4">
              現在の進行状況（{progress}%）が失われます。
              <br />
              続行してもよろしいですか？
            </p>

            <div className="flex space-x-3">
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => setShowNewGameConfirm(false)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={startNewGame}
              >
                新しい問題を開始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
