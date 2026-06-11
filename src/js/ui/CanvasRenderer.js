/** グリッド線を表示するピクセルサイズの最小値 */
const GRID_MIN_PIXEL_SIZE = 4;

/** ピクセルの色定義 */
const COLOR_PIXEL_WHITE = '#FFFFFF';
const COLOR_PIXEL_BLACK = '#1A1A2E';
const COLOR_GRID        = 'rgba(255, 255, 255, 0.08)';

/**
 * PixelBuffer の内容を HTML Canvas 要素にレンダリングする。
 */
export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvasEl
   */
  constructor(canvasEl) {
    this._canvas = canvasEl;
    this._ctx    = canvasEl.getContext('2d');
    /** @type {number} 1 ピクセルあたりのスクリーンピクセル数 */
    this._pixelSize = 4;
  }

  /** @returns {number} */
  get pixelSize() {
    return this._pixelSize;
  }

  /**
   * ズーム倍率を変更してキャンバスをリサイズする。
   * @param {number} pixelSize
   * @param {import('../domain/PixelBuffer.js').PixelBuffer} buffer
   */
  setPixelSize(pixelSize, buffer) {
    this._pixelSize = pixelSize;
    this._resizeCanvas(buffer.width, buffer.height);
    this.render(buffer);
  }

  /**
   * PixelBuffer の内容を Canvas に描画する。
   * @param {import('../domain/PixelBuffer.js').PixelBuffer} buffer
   */
  render(buffer) {
    const { width, height } = buffer;
    const ps  = this._pixelSize;
    const ctx = this._ctx;

    this._resizeCanvas(width, height);

    // ピクセルを描画する
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        ctx.fillStyle = buffer.getPixel(col, row) === 1
          ? COLOR_PIXEL_WHITE
          : COLOR_PIXEL_BLACK;
        ctx.fillRect(col * ps, row * ps, ps, ps);
      }
    }

    // グリッド線を描画する（ピクセルサイズが十分大きい場合のみ）
    if (ps >= GRID_MIN_PIXEL_SIZE) {
      ctx.strokeStyle = COLOR_GRID;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      for (let col = 0; col <= width; col++) {
        ctx.moveTo(col * ps + 0.5, 0);
        ctx.lineTo(col * ps + 0.5, height * ps);
      }
      for (let row = 0; row <= height; row++) {
        ctx.moveTo(0,        row * ps + 0.5);
        ctx.lineTo(width * ps, row * ps + 0.5);
      }
      ctx.stroke();
    }
  }

  /**
   * キャンバス要素のサイズをピクセルバッファに合わせる。
   * @param {number} width
   * @param {number} height
   */
  _resizeCanvas(width, height) {
    const ps = this._pixelSize;
    const w  = width  * ps;
    const h  = height * ps;
    if (this._canvas.width !== w || this._canvas.height !== h) {
      this._canvas.width  = w;
      this._canvas.height = h;
    }
  }
}
