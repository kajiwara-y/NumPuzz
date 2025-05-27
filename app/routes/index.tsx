import SudokuGame from '../islands/SudokuGame'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          ナンプレ
        </h1>
        <SudokuGame />
      </div>
    </div>
  )
}
