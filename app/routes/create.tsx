import CreatePuzzle from '../islands/CreatePuzzle'

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">
              📷 ナンプレ問題作成
            </h1>
            <a
              href="/"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← ゲームに戻る
            </a>
          </div>
        </div>
        
        <CreatePuzzle />
      </div>
    </div>
  )
}
