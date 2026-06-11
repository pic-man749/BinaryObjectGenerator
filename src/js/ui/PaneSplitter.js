/**
 * 2ペイン間のリサイザーによるドラッグリサイズを管理する。
 */
export class PaneSplitter {
  /**
   * @param {HTMLElement} resizerEl  ドラッグハンドル要素
   * @param {HTMLElement} targetPane 幅を変更するペイン要素（右側）
   */
  constructor(resizerEl, targetPane) {
    this._resizer    = resizerEl;
    this._target     = targetPane;
    this._dragging   = false;
    this._startX     = 0;
    this._startWidth = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp   = this._onPointerUp.bind(this);

    this._resizer.addEventListener('pointerdown', this._onPointerDown);
  }

  /** @param {PointerEvent} e */
  _onPointerDown(e) {
    e.preventDefault();
    this._dragging   = true;
    this._startX     = e.clientX;
    this._startWidth = this._target.offsetWidth;

    this._resizer.classList.add('is-dragging');
    this._resizer.setPointerCapture(e.pointerId);

    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup',   this._onPointerUp);
  }

  /** @param {PointerEvent} e */
  _onPointerMove(e) {
    if (!this._dragging) return;
    // リサイザーを右に動かすと右ペインが縮小する
    const delta    = this._startX - e.clientX;
    const newWidth = this._startWidth + delta;

    const minWidth = parseInt(getComputedStyle(this._target).minWidth, 10) || 260;
    const maxWidth = this._target.parentElement.offsetWidth * 0.75;
    const clamped  = Math.max(minWidth, Math.min(maxWidth, newWidth));

    this._target.style.width = `${clamped}px`;
  }

  /** @param {PointerEvent} e */
  _onPointerUp(e) {
    if (!this._dragging) return;
    this._dragging = false;
    this._resizer.classList.remove('is-dragging');
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup',   this._onPointerUp);
  }
}
