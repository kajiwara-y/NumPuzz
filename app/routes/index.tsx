import SudokuGame from '../islands/SudokuGame'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            ナンプレ
          </h1>
          <a
            href="/create"
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            📷 写真から問題作成
          </a>
        </div>
        <SudokuGame />
      </div>
    </div>
  )
}
