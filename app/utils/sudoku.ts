// ナンプレの問題データ型
export interface SudokuPuzzle {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  initialGrid: number[][] // 9x9の初期状態（0は空のセル）
  solution: number[][] | null // 9x9の解答
  createdAt: string // ISO文字列
  source?: 'upload' | 'manual' // 将来的な拡張用
  imageUrl?: string // アップロードされた画像のURL（将来的な拡張用）
}

// ゲームの進行状態
export interface SudokuState {
  puzzle: SudokuPuzzle
  currentGrid: number[][] // 現在の状態
  memoGrid: MemoGrid // メモ数字の状態
  startedAt: string // ゲーム開始時刻
  lastModified: string // 最終更新時刻
  completedAt?: string // 完了時刻
  timeSpent: number // 経過時間（秒）
  hintsUsed: number // 使用したヒント数
  isMemoryMode: boolean // メモモードかどうか
}

// 保存用のデータ構造（LocalStorage用）
export interface SavedGame {
  id: string
  state: SudokuState
  savedAt: string
}

// メモデータの型定義
export type MemoGrid = Set<number>[][] // 各セル[row][col]にSet<number>でメモ数字を管理

// 初期状態を作成する関数
export function createInitialState(puzzle: SudokuPuzzle): SudokuState {
  return {
    puzzle,
    currentGrid: puzzle.initialGrid.map(row => [...row]), // ディープコピー
    memoGrid: Array(9).fill(null).map(() => 
      Array(9).fill(null).map(() => new Set<number>())
    ),
    startedAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    timeSpent: 0,
    hintsUsed: 0,
    isMemoryMode: false
  }
}

// ゲームが完了しているかチェックする関数
export function isGameComplete(currentGrid: number[][], solution: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (currentGrid[row][col] !== solution[row][col]) {
        return false
      }
    }
  }
  return true
}

// 数独のルールに従って有効な入力かチェックする関数
export function isValidMove(grid: number[][], row: number, col: number, num: number): boolean {
  // 行のチェック
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) {
      return false
    }
  }

  // 列のチェック
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) {
      return false
    }
  }

  // 3x3ブロックのチェック
  const blockRow = Math.floor(row / 3) * 3
  const blockCol = Math.floor(col / 3) * 3
  
  for (let r = blockRow; r < blockRow + 3; r++) {
    for (let c = blockCol; c < blockCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === num) {
        return false
      }
    }
  }

  return true
}

// LocalStorageにゲーム状態を保存する関数
export function saveGameToStorage(gameState: SudokuState): void {
  try {
    const savedGame: SavedGame = {
      id: gameState.puzzle.id,
      state: gameState,
      savedAt: new Date().toISOString()
    }
    
    const existingGames = getStoredGames()
    const updatedGames = existingGames.filter(game => game.id !== gameState.puzzle.id)
    updatedGames.push(savedGame)
    
    localStorage.setItem('sudoku_games', JSON.stringify(updatedGames))
  } catch (error) {
    console.error('Failed to save game to storage:', error)
  }
}

// LocalStorageからゲーム状態を読み込む関数
export function loadGameFromStorage(puzzleId: string): SudokuState | null {
  try {
    const games = getStoredGames()
    const savedGame = games.find(game => game.id === puzzleId)
    return savedGame ? savedGame.state : null
  } catch (error) {
    console.error('Failed to load game from storage:', error)
    return null
  }
}

// LocalStorageから全ての保存されたゲームを取得する関数
export function getStoredGames(): SavedGame[] {
  try {
    const stored = localStorage.getItem('sudoku_games')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to get stored games:', error)
    return []
  }
}

// LocalStorageから特定のゲームを削除する関数
export function deleteGameFromStorage(puzzleId: string): void {
  try {
    const games = getStoredGames()
    const updatedGames = games.filter(game => game.id !== puzzleId)
    localStorage.setItem('sudoku_games', JSON.stringify(updatedGames))
  } catch (error) {
    console.error('Failed to delete game from storage:', error)
  }
}

// グリッドが空かどうかをチェックする関数
export function isEmpty(grid: number[][], row: number, col: number): boolean {
  return grid[row][col] === 0
}

// 経過時間を計算する関数
export function calculateTimeSpent(startedAt: string, lastModified: string): number {
  const start = new Date(startedAt).getTime()
  const end = new Date(lastModified).getTime()
  return Math.floor((end - start) / 1000)
}

// 時間を「MM:SS」形式でフォーマットする関数
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 難易度に基づく色を取得する関数
export function getDifficultyColor(difficulty: SudokuPuzzle['difficulty']): string {
  switch (difficulty) {
    case 'easy':
      return 'text-green-600'
    case 'medium':
      return 'text-yellow-600'
    case 'hard':
      return 'text-orange-600'
    case 'expert':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

// 難易度の日本語表示を取得する関数
export function getDifficultyLabel(difficulty: SudokuPuzzle['difficulty']): string {
  switch (difficulty) {
    case 'easy':
      return '初級'
    case 'medium':
      return '中級'
    case 'hard':
      return '上級'
    case 'expert':
      return '最上級'
    default:
      return '不明'
  }
}

// メモを追加/削除する関数
export function toggleMemo(memoGrid: MemoGrid, row: number, col: number, number: number): MemoGrid {
  const newMemoGrid = memoGrid.map(r => r.map(cell => new Set(cell)))
  
  if (newMemoGrid[row][col].has(number)) {
    newMemoGrid[row][col].delete(number)
  } else {
    newMemoGrid[row][col].add(number)
  }
  
  return newMemoGrid
}

// セルのメモをすべてクリアする関数
export function clearCellMemo(memoGrid: MemoGrid, row: number, col: number): MemoGrid {
  const newMemoGrid = memoGrid.map(r => r.map(cell => new Set(cell)))
  newMemoGrid[row][col].clear()
  return newMemoGrid
}

// 数字確定時に関連するメモを自動削除する関数
export function autoRemoveMemos(memoGrid: MemoGrid, row: number, col: number, number: number): MemoGrid {
  const newMemoGrid = memoGrid.map(r => r.map(cell => new Set(cell)))
  
  // 同じ行のメモから削除
  for (let c = 0; c < 9; c++) {
    newMemoGrid[row][c].delete(number)
  }
  
  // 同じ列のメモから削除
  for (let r = 0; r < 9; r++) {
    newMemoGrid[r][col].delete(number)
  }
  
  // 同じ3x3ブロックのメモから削除
  const blockRow = Math.floor(row / 3) * 3
  const blockCol = Math.floor(col / 3) * 3
  
  for (let r = blockRow; r < blockRow + 3; r++) {
    for (let c = blockCol; c < blockCol + 3; c++) {
      newMemoGrid[r][c].delete(number)
    }
  }
  
  return newMemoGrid
}

// 全メモをクリアする関数
export function clearAllMemos(memoGrid: MemoGrid): MemoGrid {
  return Array(9).fill(null).map(() => 
    Array(9).fill(null).map(() => new Set<number>())
  )
}

// 既存のコードに以下を追加（複雑な複数ゲーム管理機能は削除）

// LocalStorageのキー
const STORAGE_KEY = 'sudoku_current_game'

// 現在のゲーム状態をLocalStorageに保存
export function saveCurrentGame(gameState: SudokuState): boolean {
  try {
    // Setオブジェクトを配列に変換して保存
    const stateToSave = {
      ...gameState,
      memoGrid: gameState.memoGrid.map(row => 
        row.map(cell => Array.from(cell))
      )
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    return true
  } catch (error) {
    console.error('Failed to save game:', error)
    return false
  }
}

// 現在のゲーム状態をLocalStorageから読み込み
export function loadCurrentGame(): SudokuState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const savedState = JSON.parse(stored)
    
    // 配列をSetオブジェクトに変換して復元
    const restoredState: SudokuState = {
      ...savedState,
      memoGrid: savedState.memoGrid.map((row: number[][]) => 
        row.map((cell: number[]) => new Set(cell))
      )
    }
    
    return restoredState
  } catch (error) {
    console.error('Failed to load game:', error)
    return null
  }
}

// 現在のゲームを削除（新しい問題を始める時用）
export function clearCurrentGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear game:', error)
  }
}

// 保存されたゲームがあるかチェック
export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch (error) {
    return false
  }
}

// 進行率を計算する関数
export function calculateProgress(currentGrid: number[][], initialGrid: number[][]): number {
  let filledCells = 0
  let totalEmptyCells = 0
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (initialGrid[row][col] === 0) {
        totalEmptyCells++
        if (currentGrid[row][col] !== 0) {
          filledCells++
        }
      }
    }
  }
  
  return totalEmptyCells === 0 ? 100 : Math.round((filledCells / totalEmptyCells) * 100)
}

// 写真解析結果の型定義
export interface PhotoAnalysisResult {
  success: boolean
  grid?: number[][]
  confidence?: number
  error?: string
  originalImage?: string // Base64エンコードされた画像
}

// 写真から作成された問題用の関数
export function createPuzzleFromPhoto(
  grid: number[][], 
  title?: string,
  originalImage?: string
): SudokuPuzzle {
  // 解答を生成
  const solution = solveSudoku(grid)
  
  if (!solution) {
    throw new Error('この問題は解くことができません')
  }
  return {
    id: `photo-${Date.now()}`,
    title: title || `写真から作成 - ${new Date().toLocaleString()}`,
    difficulty: estimateDifficulty(grid),
    initialGrid: grid.map(row => [...row]),
    solution: solution, 
    createdAt: new Date().toISOString(),
    source: 'upload',
    imageUrl: originalImage
  }
}

// 難易度を推定する関数
function estimateDifficulty(grid: number[][]): SudokuPuzzle['difficulty'] {
  let filledCells = 0
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== 0) {
        filledCells++
      }
    }
  }
  
  // 埋まっているセル数で難易度を推定
  if (filledCells >= 50) return 'easy'
  if (filledCells >= 40) return 'medium'
  if (filledCells >= 30) return 'hard'
  return 'expert'
}

// 問題が有効な数独かチェックする関数
export function isValidSudokuPuzzle(grid: number[][]): boolean {
  // 基本的なルールチェック
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = grid[row][col]
      if (num !== 0) {
        // 一時的に0にして、その数字が有効かチェック
        const tempGrid = grid.map(r => [...r])
        tempGrid[row][col] = 0
        if (!isValidMove(tempGrid, row, col, num)) {
          return false
        }
      }
    }
  }
  return true
}


// 数独ソルバー（バックトラッキング法）
export function solveSudoku(grid: number[][]): number[][] | null {
  // グリッドをコピー
  const solution = grid.map(row => [...row])
  
  if (solveSudokuRecursive(solution)) {
    return solution
  }
  
  return null // 解けない場合
}

// 再帰的に数独を解く
function solveSudokuRecursive(grid: number[][]): boolean {
  // 空のセルを見つける
  const emptyCell = findEmptyCell(grid)
  
  if (!emptyCell) {
    // 空のセルがない = 完成
    return true
  }
  
  const [row, col] = emptyCell
  
  // 1から9までの数字を試す
  for (let num = 1; num <= 9; num++) {
    if (isValidMove(grid, row, col, num)) {
      // 数字を配置
      grid[row][col] = num
      
      // 再帰的に続きを解く
      if (solveSudokuRecursive(grid)) {
        return true
      }
      
      // 解けなかった場合は戻す（バックトラック）
      grid[row][col] = 0
    }
  }
  
  return false // この経路では解けない
}

// 空のセルを見つける
function findEmptyCell(grid: number[][]): [number, number] | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        return [row, col]
      }
    }
  }
  return null
}

// 数独が一意解を持つかチェック（オプション）
export function hasUniqueSolution(grid: number[][]): boolean {
  const solutions: number[][][] = []
  const tempGrid = grid.map(row => [...row])
  
  findAllSolutions(tempGrid, solutions, 2) // 最大2つまで解を探す
  
  return solutions.length === 1
}

// すべての解を見つける（最大数まで）
function findAllSolutions(grid: number[][], solutions: number[][][], maxSolutions: number): void {
  if (solutions.length >= maxSolutions) {
    return
  }
  
  const emptyCell = findEmptyCell(grid)
  
  if (!emptyCell) {
    // 解が見つかった
    solutions.push(grid.map(row => [...row]))
    return
  }
  
  const [row, col] = emptyCell
  
  for (let num = 1; num <= 9; num++) {
    if (isValidMove(grid, row, col, num)) {
      grid[row][col] = num
      findAllSolutions(grid, solutions, maxSolutions)
      grid[row][col] = 0
    }
  }
}
