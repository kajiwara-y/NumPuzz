import SudokuGame from '../islands/SudokuGame'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <div className="pt-4 pb-2 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            📱 ナンプレ
          </h1>
          <a
            href="/create"
            className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
          >
            📷 写真から問題作成
          </a>
        </div>
        
        <SudokuGame />
      </div>
    </div>
  )
}
