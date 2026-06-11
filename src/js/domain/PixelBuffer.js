/**
 * ピクセルデータを保持・操作するモデルクラス。
 * DOM への依存を持たない純粋なデータモデル。
 */
export class PixelBuffer {
  /**
   * @param {number} width  幅（ピクセル）
   * @param {number} height 高さ（ピクセル）
   * @param {0|1}   fill   初期値（0: 黒、1: 白）
   */
  constructor(width, height, fill = 0) {
    this.width  = width;
    this.height = height;
    // 行優先で格納する: data[row * width + col]
    this.data = new Uint8Array(width * height).fill(fill);
  }

  /**
   * 指定座標のピクセル値を返す。
   * @param {number} col
   * @param {number} row
   * @returns {0|1}
   */
  getPixel(col, row) {
    return this.data[row * this.width + col];
  }

  /**
   * 指定座標のピクセル値を設定する。
   * 範囲外の場合は何もしない。
   * @param {number} col
   * @param {number} row
   * @param {0|1}   value
   */
  setPixel(col, row, value) {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return;
    this.data[row * this.width + col] = value;
  }

  /**
   * 全ピクセルを指定値で塗りつぶす。
   * @param {0|1} value
   */
  clear(value) {
    this.data.fill(value);
  }

  /**
   * キャンバスサイズを変更する。
   * 既存範囲のデータは保持し、縮小時は範囲外を破棄、拡大時は fillValue で埋める。
   * @param {number} newWidth
   * @param {number} newHeight
   * @param {0|1}   fillValue
   */
  resize(newWidth, newHeight, fillValue = 0) {
    const newData    = new Uint8Array(newWidth * newHeight).fill(fillValue);
    const copyWidth  = Math.min(this.width, newWidth);
    const copyHeight = Math.min(this.height, newHeight);

    for (let row = 0; row < copyHeight; row++) {
      for (let col = 0; col < copyWidth; col++) {
        newData[row * newWidth + col] = this.data[row * this.width + col];
      }
    }

    this.width  = newWidth;
    this.height = newHeight;
    this.data   = newData;
  }

  /**
   * 同じ内容の新しい PixelBuffer を返す。
   * @returns {PixelBuffer}
   */
  clone() {
    const copy  = new PixelBuffer(this.width, this.height);
    copy.data   = new Uint8Array(this.data);
    return copy;
  }
}
