/**
 * ツールバーの UI イベントを処理し、App へ委譲する。
 */
export class ToolbarView {
  /**
   * @param {import('../App.js').App} app
   */
  constructor(app) {
    this._app = app;

    this._btnPencil     = document.getElementById('btn-pencil');
    this._btnFill       = document.getElementById('btn-fill');
    this._btnColorBlack = document.getElementById('btn-color-black');
    this._btnColorWhite = document.getElementById('btn-color-white');
    this._btnUndo       = document.getElementById('btn-undo');
    this._btnRedo       = document.getElementById('btn-redo');
    this._inputWidth    = document.getElementById('input-width');
    this._inputHeight   = document.getElementById('input-height');
    this._btnApplySize  = document.getElementById('btn-apply-size');
    this._btnResetBlack = document.getElementById('btn-reset-black');
    this._btnResetWhite = document.getElementById('btn-reset-white');
    this._btnZoomOut    = document.getElementById('btn-zoom-out');
    this._btnZoomIn     = document.getElementById('btn-zoom-in');
    this._zoomSlider    = document.getElementById('zoom-slider');

    this._bindEvents();
    this._bindKeyboard();
  }

  _bindEvents() {
    this._btnPencil.addEventListener('click', () => this._selectTool('pencil'));
    this._btnFill.addEventListener('click',   () => this._selectTool('fill'));

    this._btnColorBlack.addEventListener('click', () => this._selectColor(0));
    this._btnColorWhite.addEventListener('click', () => this._selectColor(1));

    this._btnUndo.addEventListener('click', () => this._app.handleUndo());
    this._btnRedo.addEventListener('click', () => this._app.handleRedo());

    this._btnApplySize.addEventListener('click', () => {
      const w = this._clampSize(parseInt(this._inputWidth.value,  10));
      const h = this._clampSize(parseInt(this._inputHeight.value, 10));
      this._inputWidth.value  = w;
      this._inputHeight.value = h;
      this._app.handleCanvasResize(w, h);
    });

    this._btnResetBlack.addEventListener('click', () => this._app.handleCanvasReset(0));
    this._btnResetWhite.addEventListener('click', () => this._app.handleCanvasReset(1));

    this._btnZoomOut.addEventListener('click', () => this._app.handleZoomDelta(-1));
    this._btnZoomIn.addEventListener('click',  () => this._app.handleZoomDelta(+1));

    this._zoomSlider.addEventListener('input', () => {
      const pixelSize = parseInt(this._zoomSlider.value, 10);
      this._app.handleZoomByIndex(pixelSize);
    });
  }

  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // テキスト入力中はキーバインドを無効にする
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this._app.handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        this._app.handleRedo();
      } else if (e.key === 'p' || e.key === 'P') {
        this._selectTool('pencil');
      } else if (e.key === 'f' || e.key === 'F') {
        this._selectTool('fill');
      }
    });
  }

  /** @param {'pencil'|'fill'} toolName */
  _selectTool(toolName) {
    this._app.handleToolChange(toolName);
    this._btnPencil.classList.toggle('active', toolName === 'pencil');
    this._btnFill.classList.toggle('active',   toolName === 'fill');
    this._btnPencil.setAttribute('aria-pressed', String(toolName === 'pencil'));
    this._btnFill.setAttribute('aria-pressed',   String(toolName === 'fill'));
  }

  /** @param {0|1} color */
  _selectColor(color) {
    this._app.handleColorChange(color);
    this._btnColorBlack.classList.toggle('active', color === 0);
    this._btnColorWhite.classList.toggle('active', color === 1);
    this._btnColorBlack.setAttribute('aria-pressed', String(color === 0));
    this._btnColorWhite.setAttribute('aria-pressed', String(color === 1));
  }

  /**
   * Undo/Redo ボタンの有効・無効状態を更新する。
   * @param {boolean} canUndo
   * @param {boolean} canRedo
   */
  updateUndoRedo(canUndo, canRedo) {
    this._btnUndo.disabled = !canUndo;
    this._btnRedo.disabled = !canRedo;
  }

  /**
   * ズームラベルとスライダーを更新する。
   * @param {number} pixelSize
   */
  updateZoomLabel(pixelSize) {
    const label = document.getElementById('zoom-label');
    if (label) label.textContent = `${pixelSize}×`;
    this._zoomSlider.value = pixelSize;
  }

  /**
   * キャンバスサイズ入力欄を更新する。
   * @param {number} width
   * @param {number} height
   */
  updateCanvasSize(width, height) {
    this._inputWidth.value  = width;
    this._inputHeight.value = height;
  }

  /**
   * 値を 1〜256 の範囲にクランプする。
   * @param {number} value
   * @returns {number}
   */
  _clampSize(value) {
    if (!Number.isFinite(value) || value < 1)   return 1;
    if (value > 256) return 256;
    return value;
  }
}
