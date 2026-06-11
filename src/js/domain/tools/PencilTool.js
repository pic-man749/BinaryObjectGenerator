/**
 * ペンシルツール。
 * マウスドラッグによるピクセル描画を担当する。
 * ブレゼンハムアルゴリズムで前回座標との間を補間し、高速ドラッグでも描画が途切れないようにする。
 */
export class PencilTool {
  constructor() {
    /** @type {number|null} */
    this._prevCol = null;
    /** @type {number|null} */
    this._prevRow = null;
  }

  /**
   * マウスボタン押下時に呼び出す。
   * @param {import('../PixelBuffer.js').PixelBuffer} buffer
   * @param {number} col
   * @param {number} row
   * @param {0|1} color
   */
  onPointerDown(buffer, col, row, color) {
    buffer.setPixel(col, row, color);
    this._prevCol = col;
    this._prevRow = row;
  }

  /**
   * マウス移動中（ドラッグ中）に呼び出す。
   * @param {import('../PixelBuffer.js').PixelBuffer} buffer
   * @param {number} col
   * @param {number} row
   * @param {0|1} color
   */
  onPointerMove(buffer, col, row, color) {
    if (this._prevCol === null) return;
    this._drawLine(buffer, this._prevCol, this._prevRow, col, row, color);
    this._prevCol = col;
    this._prevRow = row;
  }

  /** マウスボタン解放時に呼び出す。 */
  onPointerUp() {
    this._prevCol = null;
    this._prevRow = null;
  }

  /**
   * ブレゼンハムの直線アルゴリズムで 2 点間のピクセルを描画する。
   * @param {import('../PixelBuffer.js').PixelBuffer} buffer
   * @param {number} x0
   * @param {number} y0
   * @param {number} x1
   * @param {number} y1
   * @param {0|1} color
   */
  _drawLine(buffer, x0, y0, x1, y1, color) {
    const dx  = Math.abs(x1 - x0);
    const dy  = Math.abs(y1 - y0);
    const sx  = x0 < x1 ? 1 : -1;
    const sy  = y0 < y1 ? 1 : -1;
    let err   = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      buffer.setPixel(x, y, color);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 <  dx) { err += dx; y += sy; }
    }
  }
}
