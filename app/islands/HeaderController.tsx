import { useState, useRef } from 'react'
import SudokuGame from './SudokuGame'

export default function HeaderController() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [isHeaderPeeking, setIsHeaderPeeking] = useState(false)
  const [manuallyHidden, setManuallyHidden] = useState(false) // 手動で隠されたかのフラグ
  const touchStartY = useRef<number>(0)

  // タッチイベントハンドラー
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0].clientY > 100) return
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === 0 || e.touches[0].clientY > 150) return
    
    if (!isHeaderVisible) {
      const currentY = e.touches[0].clientY
      const deltaY = currentY - touchStartY.current

      if (deltaY > 30) {
        setIsHeaderPeeking(true)
      } else if (deltaY < -10) {
        setIsHeaderPeeking(false)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === 0) return
    
    if (!isHeaderVisible && isHeaderPeeking) {
      const currentY = e.changedTouches[0].clientY
      const deltaY = currentY - touchStartY.current

      if (deltaY > 80) {
        setIsHeaderVisible(true)
        setIsHeaderPeeking(false)
        setManuallyHidden(false) // 手動表示時はフラグをリセット
      } else {
        setIsHeaderPeeking(false)
      }
    }
    
    touchStartY.current = 0
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHeaderVisible && e.clientY < 50) {
      setIsHeaderPeeking(true)
    } else if (!isHeaderVisible && e.clientY > 100) {
      setIsHeaderPeeking(false)
    }
  }

  const handleHeaderClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    
    if (!isHeaderVisible && isHeaderPeeking) {
      setIsHeaderVisible(true)
      setIsHeaderPeeking(false)
      setManuallyHidden(false) // 手動表示時はフラグをリセット
    }
  }

  // ヘッダーを隠すボタンのハンドラー
  const handleHideHeader = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Hide header clicked - setting manually hidden')
    setIsHeaderVisible(false)
    setIsHeaderPeeking(false)
    setManuallyHidden(true) // 手動で隠されたことを記録
  }

  // ゲームからの状態変更通知
  const handleGameStateChange = (shouldShow: boolean) => {
    console.log('Game state change:', shouldShow, 'Manually hidden:', manuallyHidden)
    
    // 手動で隠されている場合は、ゲーム完了時のみ表示
    if (manuallyHidden && shouldShow) {
      // ゲーム完了時のみ表示（ゲーム開始による非表示要求は無視）
      return
    }
    
    // 手動で隠されていない場合は通常通り
    if (!manuallyHidden) {
      setIsHeaderVisible(shouldShow)
      setIsHeaderPeeking(false)
    }
  }

  // インジケーターをクリックしてヘッダー表示
  const handleIndicatorClick = () => {
    setIsHeaderVisible(true)
    setIsHeaderPeeking(false)
    setManuallyHidden(false) // 手動表示時はフラグをリセット
  }

  return (
    <>
      {/* タッチ/マウスイベント検知エリア - 画面上部のみ */}
      {!isHeaderVisible && (
        <div
          className="fixed top-0 left-0 right-0 h-20 z-30"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleMouseMove}
        />
      )}

      {/* ヘッダー */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 transition-transform duration-300 ease-in-out
          ${isHeaderVisible ? 'translate-y-0' : isHeaderPeeking ? 'translate-y-0 opacity-75' : '-translate-y-full'}
        `}
        onClick={handleHeaderClick}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-800">
                📱 ナンプレ
              </h1>
              <a
                href="/create"
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                📷 写真から問題作成
              </a>
            </div>
            
            <button
              onClick={handleHideHeader}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              title="ヘッダーを隠す"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
          
          {isHeaderPeeking && !isHeaderVisible && (
            <div className="text-center py-1">
              <div className="text-xs text-gray-500">
                タップまたは下にスワイプで表示
              </div>
            </div>
          )}
        </div>
      </div>

      {/* インジケーター - クリック可能 */}
      {!isHeaderVisible && !isHeaderPeeking && (
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={handleIndicatorClick}
            className="bg-gray-800 bg-opacity-75 hover:bg-opacity-90 text-white px-3 py-1 rounded-b-lg text-xs transition-all cursor-pointer"
          >
            ↓ タップでメニュー表示
          </button>
        </div>
      )}

      {/* ゲームコンポーネント */}
      <div className={`transition-all duration-300 ${isHeaderVisible ? 'pt-16' : 'pt-0'}`}>
        <SudokuGame onHeaderVisibilityChange={handleGameStateChange} />
      </div>
    </>
  )
}
