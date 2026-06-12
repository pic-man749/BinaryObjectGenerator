/**
 * キャンバス上のマウス・ホイールイベントを処理し、App へ委譲する。
 * ホイールズームはキャンバスペイン（.canvas-section）全体で有効にする。
 */
export class CanvasView {
  /**
   * @param {HTMLCanvasElement} canvasEl
   * @param {import('../App.js').App} app
   * @param {import('./CanvasRenderer.js').CanvasRenderer} renderer
   */
  constructor(canvasEl, app, renderer) {
    this._canvas      = canvasEl;
    this._app         = app;
    this._renderer    = renderer;
    this._drawing     = false;
    this._button      = 0;
    // ホイールズームをキャンバスペイン全体に適用するためペイン要素を取得する
    this._canvasPane  = canvasEl.closest('.canvas-section');

    this._onPointerDown  = this._onPointerDown.bind(this);
    this._onPointerMove  = this._onPointerMove.bind(this);
    this._onPointerUp    = this._onPointerUp.bind(this);
    this._onWheel        = this._onWheel.bind(this);

    this._canvas.addEventListener('pointerdown',  this._onPointerDown);
    this._canvas.addEventListener('pointermove',  this._onPointerMove);
    this._canvas.addEventListener('pointerup',    this._onPointerUp);
    // ホイールリスナーはペイン全体に登録する
    this._canvasPane.addEventListener('wheel', this._onWheel, { passive: false });
    // 右クリックメニューを抑制する
    this._canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** イベントリスナーを解除する。 */
  dispose() {
    this._canvas.removeEventListener('pointerdown', this._onPointerDown);
    this._canvas.removeEventListener('pointermove', this._onPointerMove);
    this._canvas.removeEventListener('pointerup',   this._onPointerUp);
    this._canvasPane.removeEventListener('wheel',   this._onWheel);
  }

  /** @param {PointerEvent} e */
  _onPointerDown(e) {
    // 左クリック（0）と右クリック（2）のみ処理する
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    // ドラッグ中にキャンバス外へカーソルが出ても描画を継続するためにキャプチャする
    this._canvas.setPointerCapture(e.pointerId);
    this._drawing = true;
    this._button  = e.button;
    const { col, row } = this._toPixelCoords(e);
    this._app.handlePointerDown(col, row, e.button);
  }

  /** @param {PointerEvent} e */
  _onPointerMove(e) {
    if (!this._drawing) return;
    e.preventDefault();
    const { col, row } = this._toPixelCoords(e);
    this._app.handlePointerMove(col, row, this._button);
  }

  /** @param {PointerEvent} e */
  _onPointerUp(e) {
    if (!this._drawing) return;
    this._drawing = false;
    this._app.handlePointerUp();
  }

  /** @param {WheelEvent} e */
  _onWheel(e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    this._app.handleZoomDelta(delta);
  }

  /**
   * ポインタイベントのオフセット座標をピクセル座標に変換する。
   * @param {PointerEvent} e
   * @returns {{ col: number, row: number }}
   */
  _toPixelCoords(e) {
    const rect = this._canvas.getBoundingClientRect();
    const ps   = this._renderer.pixelSize;
    const col  = Math.floor((e.clientX - rect.left) / ps);
    const row  = Math.floor((e.clientY - rect.top)  / ps);
    return { col, row };
  }
}
