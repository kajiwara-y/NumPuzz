import { useState } from "react";
import PhotoUpload from "./PhotoUpload";
import PuzzleEditor from "./PuzzleEditor";
import {
  PhotoAnalysisResult,
  createPuzzleFromPhoto,
  isValidSudokuPuzzle,
  clearCurrentGame,
  createInitialState,
  saveCurrentGame,
} from "../utils/sudoku";

export default function CreatePuzzle() {
  const [step, setStep] = useState<"upload" | "edit">("upload");
  const [photoAnalysisResult, setPhotoAnalysisResult] =
    useState<PhotoAnalysisResult | null>(null);

  // 写真解析完了
  const handlePhotoAnalyzed = (result: PhotoAnalysisResult) => {
    setPhotoAnalysisResult(result);

    if (result.success && result.grid) {
      setStep("edit");
    } else {
      alert("画像の解析に失敗しました。もう一度お試しください。");
    }
  };

  // 問題編集完了
  const handlePuzzleSaved = (editedGrid: number[][]) => {
    try {
      if (!isValidSudokuPuzzle(editedGrid)) {
        alert("無効な数独問題です。ルール違反を修正してください。");
        return;
      }

      // 新しい問題を作成（解答も自動生成される）
      const newPuzzle = createPuzzleFromPhoto(
        editedGrid,
        undefined,
        photoAnalysisResult?.originalImage
      );

      // 現在のゲームをクリアして新しい問題を保存
      clearCurrentGame();
      const initialState = createInitialState(newPuzzle);
      saveCurrentGame(initialState);

      // メインゲーム画面にリダイレクト
      window.location.href = "/";
    } catch (error) {
      // エラーの型チェックを追加
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'
      alert(`問題の作成に失敗しました: ${errorMessage}`);
      console.error("Puzzle creation error:", error);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    if (step === "edit") {
      setStep("upload");
      setPhotoAnalysisResult(null);
    } else {
      // メインページに戻る
      window.location.href = "/";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* ステップ表示 */}
      <div className="mb-6 flex items-center space-x-4">
        <div
          className={`flex items-center space-x-2 ${
            step === "upload" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "upload" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            1
          </div>
          <span className="font-medium">写真アップロード</span>
        </div>

        <div className="flex-1 h-px bg-gray-300"></div>

        <div
          className={`flex items-center space-x-2 ${
            step === "edit" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "edit" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            2
          </div>
          <span className="font-medium">問題の確認・修正</span>
        </div>
      </div>

      {/* メインコンテンツ */}
      {step === "upload" ? (
        <PhotoUpload
          onPhotoAnalyzed={handlePhotoAnalyzed}
          onCancel={handleCancel}
        />
      ) : (
        photoAnalysisResult?.grid && (
          <PuzzleEditor
            initialGrid={photoAnalysisResult.grid}
            confidence={photoAnalysisResult.confidence}
            onSave={handlePuzzleSaved}
            onCancel={handleCancel}
          />
        )
      )}
    </div>
  );
}
