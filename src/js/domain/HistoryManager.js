/**
 * PixelBuffer のスナップショットを管理し、Undo/Redo 機能を提供する。
 */
export class HistoryManager {
  /** @param {number} maxSize 最大履歴数 */
  constructor(maxSize = 50) {
    this._maxSize = maxSize;
    /** @type {import('./PixelBuffer.js').PixelBuffer[]} */
    this._undoStack = [];
    /** @type {import('./PixelBuffer.js').PixelBuffer[]} */
    this._redoStack = [];
  }

  /**
   * 現在の PixelBuffer のクローンをスタックに積む。
   * 新たな変更が加わるため、redo スタックはクリアする。
   * @param {import('./PixelBuffer.js').PixelBuffer} pixelBuffer
   */
  push(pixelBuffer) {
    this._undoStack.push(pixelBuffer.clone());
    if (this._undoStack.length > this._maxSize) {
      this._undoStack.shift();
    }
    this._redoStack = [];
  }

  /**
   * 直前のスナップショットを取り出して返す。
   * 呼び出し元は現在の状態を redo スタックに渡すこと（App が担当）。
   * @returns {import('./PixelBuffer.js').PixelBuffer|null}
   */
  undo() {
    return this._undoStack.pop() ?? null;
  }

  /**
   * undo 直後に現在状態を redo スタックへ保存する。
   * @param {import('./PixelBuffer.js').PixelBuffer} pixelBuffer
   */
  pushRedo(pixelBuffer) {
    this._redoStack.push(pixelBuffer.clone());
  }

  /**
   * redo 操作時に現在状態を undo スタックへ保存する。
   * push と異なり redo スタックをクリアしない。
   * @param {import('./PixelBuffer.js').PixelBuffer} pixelBuffer
   */
  pushUndo(pixelBuffer) {
    this._undoStack.push(pixelBuffer.clone());
    if (this._undoStack.length > this._maxSize) {
      this._undoStack.shift();
    }
  }

  /**
   * redo スタックから次のスナップショットを取り出して返す。
   * @returns {import('./PixelBuffer.js').PixelBuffer|null}
   */
  redo() {
    return this._redoStack.pop() ?? null;
  }

  /** @returns {boolean} */
  canUndo() {
    return this._undoStack.length > 0;
  }

  /** @returns {boolean} */
  canRedo() {
    return this._redoStack.length > 0;
  }

  /** undo/redo 履歴をすべてクリアする。 */
  clear() {
    this._undoStack = [];
    this._redoStack = [];
  }
}
