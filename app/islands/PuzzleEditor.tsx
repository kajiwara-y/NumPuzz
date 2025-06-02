import { useState } from "react";
import { solveSudoku, hasUniqueSolution } from "../utils/sudoku";

interface PuzzleEditorProps {
  initialGrid: number[][];
  confidence?: number;
  onSave: (grid: number[][]) => void;
  onCancel: () => void;
}

export default function PuzzleEditor({
  initialGrid,
  confidence = 0,
  onSave,
  onCancel,
}: PuzzleEditorProps) {
  const [grid, setGrid] = useState<number[][]>(
    initialGrid.map((row) => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState<"ui" | "text">("ui");
  const [textInput, setTextInput] = useState("");
  const [textError, setTextError] = useState<string | null>(null);

  // グリッドを文字列に変換
  const gridToString = (currentGrid: number[][]) => {
    return currentGrid
      .map((row) =>
        row.map((cell) => (cell === 0 ? "." : cell.toString())).join("")
      )
      .join("\n");
  };

  // 文字列をグリッドに変換
  const stringToGrid = (str: string): number[][] | null => {
    try {
      const lines = str
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      if (lines.length !== 9) {
        throw new Error("9行である必要があります");
      }

      const newGrid: number[][] = [];

      for (let i = 0; i < 9; i++) {
        const line = lines[i].trim();

        if (line.length !== 9) {
          throw new Error(`${i + 1}行目は9文字である必要があります`);
        }

        const row: number[] = [];
        for (let j = 0; j < 9; j++) {
          const char = line[j];
          if (char === "." || char === "0" || char === " ") {
            row.push(0);
          } else if (char >= "1" && char <= "9") {
            row.push(parseInt(char));
          } else {
            throw new Error(
              `${i + 1}行目${
                j + 1
              }列目: 無効な文字 '${char}' (1-9または.を使用してください)`
            );
          }
        }
        newGrid.push(row);
      }

      return newGrid;
    } catch (error) {
      return null;
    }
  };

  // エディットモード切り替え時の処理
  const handleModeChange = (newMode: "ui" | "text") => {
    if (newMode === "text" && editMode === "ui") {
      // UIモードからテキストモードに切り替え
      setTextInput(gridToString(grid));
      setTextError(null);
    } else if (newMode === "ui" && editMode === "text") {
      // テキストモードからUIモードに切り替え
      const newGrid = stringToGrid(textInput);
      if (newGrid) {
        setGrid(newGrid);
        validateGrid(newGrid);
        setTextError(null);
      } else {
        setTextError("無効な形式です。修正してから切り替えてください。");
        return; // 切り替えをキャンセル
      }
    }
    setEditMode(newMode);
  };

  // テキスト入力の変更処理
  const handleTextChange = (value: string) => {
    setTextInput(value);

    const newGrid = stringToGrid(value);
    if (newGrid) {
      setTextError(null);
      // リアルタイムでプレビューを更新（オプション）
    } else {
      setTextError("形式が正しくありません");
    }
  };

  // テキストから適用
  const applyTextChanges = () => {
    const newGrid = stringToGrid(textInput);
    if (newGrid) {
      setGrid(newGrid);
      validateGrid(newGrid);
      setTextError(null);
    } else {
      setTextError("無効な形式です。修正してください。");
    }
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (number: number) => {
    if (!selectedCell) return;

    const [row, col] = selectedCell;
    const newGrid = grid.map((r, rowIndex) =>
      r.map((cell, colIndex) =>
        rowIndex === row && colIndex === col ? number : cell
      )
    );

    setGrid(newGrid);

    // 簡単なバリデーション
    validateGrid(newGrid);
  };

  const validateGrid = (currentGrid: number[][]) => {
    const newErrors = new Set<string>();

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const num = currentGrid[row][col];
        if (num !== 0) {
          // 行チェック
          for (let c = 0; c < 9; c++) {
            if (c !== col && currentGrid[row][c] === num) {
              newErrors.add(`${row}-${col}`);
            }
          }

          // 列チェック
          for (let r = 0; r < 9; r++) {
            if (r !== row && currentGrid[r][col] === num) {
              newErrors.add(`${row}-${col}`);
            }
          }

          // 3x3ブロックチェック
          const blockRow = Math.floor(row / 3) * 3;
          const blockCol = Math.floor(col / 3) * 3;

          for (let r = blockRow; r < blockRow + 3; r++) {
            for (let c = blockCol; c < blockCol + 3; c++) {
              if ((r !== row || c !== col) && currentGrid[r][c] === num) {
                newErrors.add(`${row}-${col}`);
              }
            }
          }
        }
      }
    }

    setErrors(newErrors);
  };

  const getCellClassName = (row: number, col: number) => {
    const baseClasses =
      "w-8 h-8 sm:w-10 sm:h-10 border border-gray-400 flex items-center justify-center text-sm sm:text-base font-medium cursor-pointer transition-colors";

    const isSelected =
      selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    const hasError = errors.has(`${row}-${col}`);

    // 3x3ブロックの境界線
    const thickBorderClasses = [];
    if (row % 3 === 0 && row !== 0)
      thickBorderClasses.push("border-t-2 border-t-gray-800");
    if (col % 3 === 0 && col !== 0)
      thickBorderClasses.push("border-l-2 border-l-gray-800");
    if (row === 8) thickBorderClasses.push("border-b-2 border-b-gray-800");
    if (col === 8) thickBorderClasses.push("border-r-2 border-r-gray-800");

    let colorClasses = "";
    if (hasError) {
      colorClasses = "bg-red-100 text-red-700 border-red-300";
    } else if (isSelected) {
      colorClasses = "bg-blue-200 text-blue-900";
    } else {
      colorClasses = "bg-white text-gray-700 hover:bg-gray-50";
    }

    return `${baseClasses} ${colorClasses} ${thickBorderClasses.join(" ")}`;
  };

  const handleSave = () => {
    let finalGrid = grid;

    // テキストモードの場合は最新のテキストを適用
    if (editMode === "text") {
      const newGrid = stringToGrid(textInput);
      if (!newGrid) {
        setTextError("無効な形式です。修正してください。");
        return;
      }
      finalGrid = newGrid;
      validateGrid(finalGrid);
    }

    if (errors.size > 0) {
      alert("エラーがある箇所を修正してください");
      return;
    }

    // 解答が生成できるかチェック
    try {
      const solution = solveSudoku(finalGrid);
      if (!solution) {
        alert("この問題は解くことができません。数字を見直してください。");
        return;
      }

      // 一意解かチェック（オプション）
      if (!hasUniqueSolution(finalGrid)) {
        const proceed = confirm(
          "この問題は複数の解答を持つ可能性があります。続行しますか？"
        );
        if (!proceed) return;
      }

      onSave(finalGrid);
    } catch (error) {
      alert("問題の検証中にエラーが発生しました。");
      console.error("Validation error:", error);
    }
  };

  // プリセットパターンの挿入
  const insertPreset = (preset: "empty" | "sample") => {
    let newGrid: number[][];

    if (preset === "empty") {
      newGrid = Array(9)
        .fill(null)
        .map(() => Array(9).fill(0));
    } else {
      // サンプルパターン
      newGrid = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ];
    }

    if (editMode === "text") {
      setTextInput(gridToString(newGrid));
      setTextError(null);
    } else {
      setGrid(newGrid);
      validateGrid(newGrid);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        ✏️ 問題の確認・修正
      </h2>

      {/* 信頼度表示 */}
      {confidence > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            AI解析の信頼度:{" "}
            <span className="font-medium">{Math.round(confidence * 100)}%</span>
            {confidence < 0.8 && (
              <span className="ml-2 text-orange-600">
                （信頼度が低いため、内容を確認してください）
              </span>
            )}
          </p>
        </div>
      )}

      {/* 編集モード切り替え */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">編集モード:</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`px-3 py-1 text-sm rounded transition-colors ${
              editMode === "ui"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => handleModeChange("ui")}
          >
            🎯 UI編集
          </button>
          <button
            className={`px-3 py-1 text-sm rounded transition-colors ${
              editMode === "text"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => handleModeChange("text")}
          >
            📝 テキスト編集
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ナンプレボード */}
        <div className="flex-1">
          <div className="inline-block bg-gray-800 p-1 rounded-lg">
            <div className="grid grid-cols-9 gap-0 bg-white rounded">
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={getCellClassName(rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={editMode === "text"}
                  >
                    {cell === 0 ? "" : cell}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 編集コントロール */}
        <div className="lg:w-80">
          {editMode === "ui" ? (
            // UI編集モード
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  数字入力
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                    <button
                      key={number}
                      className="w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
                      onClick={() => handleNumberInput(number)}
                      disabled={!selectedCell}
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                  onClick={() => handleNumberInput(0)}
                  disabled={!selectedCell}
                >
                  セルクリア
                </button>
              </div>

              <div>
                <button
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                  onClick={() => insertPreset("empty")}
                >
                  全てクリア
                </button>
              </div>

              <div>
                <button
                  className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
                  onClick={() => insertPreset("sample")}
                >
                  サンプル挿入
                </button>
              </div>

              {/* エラー表示 */}
              {errors.size > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-1">エラー</h4>
                  <p className="text-sm text-red-600">
                    {errors.size}箇所にルール違反があります
                  </p>
                </div>
              )}

              {/* 使用方法 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  UI編集の使用方法
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• セルをクリックして選択</li>
                  <li>• 数字ボタンで入力</li>
                  <li>• 空白にする場合は「セルクリア」</li>
                  <li>• 赤色のセルはルール違反です</li>
                </ul>
              </div>
            </div>
          ) : (
            // テキスト編集モード
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  テキスト編集
                </h3>
                <textarea
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={textInput}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="9x9の数独を入力してください&#10;例:&#10;53..7....&#10;6..195...&#10;.98....6.&#10;8...6...3&#10;4..8.3..1&#10;7...2...6&#10;.6....28.&#10;...419..5&#10;....8..79"
                  spellCheck={false}
                />

                {textError && (
                  <p className="text-sm text-red-600 mt-1">{textError}</p>
                )}
              </div>

              <div>
                <button
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                  onClick={applyTextChanges}
                  disabled={!!textError}
                >
                  テキストを適用
                </button>
              </div>

              {/* プリセット */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">プリセット</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                    onClick={() => insertPreset("empty")}
                  >
                    空のグリッド
                  </button>
                  <button
                    className="py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
                    onClick={() => insertPreset("sample")}
                  >
                    サンプル
                  </button>
                </div>
              </div>

              {/* テキスト編集の説明 */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  テキスト編集の使用方法
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 9行×9列で入力してください</li>
                  <li>• 数字は1-9、空白は「.」「0」「スペース」</li>
                  <li>• 各行は改行で区切ってください</li>
                  <li>• コピー&ペーストも可能です</li>
                </ul>
              </div>

              {/* 現在のフォーマット例 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  フォーマット例
                </h4>
                <pre className="text-xs text-gray-600 font-mono">
                  {`53..7....
6..195...
.98....6.
8...6...3
4..8.3..1
7...2...6
.6....28.
...419..5
....8..79`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 保存・キャンセルボタン */}
      <div className="mt-6 flex gap-3 justify-end">
        <button
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button
          className={`px-6 py-2 rounded-lg transition-colors font-medium ${
            errors.size > 0 || (editMode === "text" && textError)
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
          onClick={handleSave}
          disabled={errors.size > 0 || (editMode === "text" && !!textError)}
        >
          この問題で開始
        </button>
      </div>
    </div>
  );
}
