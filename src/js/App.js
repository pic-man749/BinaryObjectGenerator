import { PixelBuffer }        from './domain/PixelBuffer.js';
import { HistoryManager }     from './domain/HistoryManager.js';
import { PencilTool }         from './domain/tools/PencilTool.js';
import { FillTool }           from './domain/tools/FillTool.js';
import { BinaryDataEncoder }  from './domain/BinaryDataEncoder.js';
import { CodeGenerator }      from './domain/CodeGenerator.js';
import { HppParser }          from './domain/HppParser.js';
import { StorageManager,DEFAULT_INCLUDE_PATH } from './domain/StorageManager.js';
import { CanvasRenderer }     from './ui/CanvasRenderer.js';
import { CanvasView }         from './ui/CanvasView.js';
import { ToolbarView }        from './ui/ToolbarView.js';
import { OutputView }         from './ui/OutputView.js';

const MIN_PIXEL_SIZE = 1;
const MAX_PIXEL_SIZE = 32;

/**
 * アプリケーション全体の状態を管理し、各コンポーネントを協調させる。
 */
export class App {
  constructor() {
    /** @type {PixelBuffer} */
    this._buffer  = new PixelBuffer(128, 64, 0);
    /** @type {HistoryManager} */
    this._history = new HistoryManager(50);
    /** @type {PencilTool} */
    this._pencil  = new PencilTool();
    /** @type {FillTool} */
    this._fill    = new FillTool();
    /** @type {BinaryDataEncoder} */
    this._encoder = new BinaryDataEncoder();
    /** @type {CodeGenerator} */
    this._codegen = new CodeGenerator();
    /** @type {HppParser} */
    this._parser  = new HppParser();

    /** @type {'pencil'|'fill'} */
    this._activeTool  = 'pencil';
    /** @type {0|1} */
    this._activeColor = 1;
    /** @type {string} */
    this._includePath = DEFAULT_INCLUDE_PATH;

    /** @type {StorageManager} */
    this._storage     = new StorageManager();
    /** @type {CanvasRenderer|null} */
    this._renderer    = null;
    /** @type {ToolbarView|null} */
    this._toolbarView = null;
    /** @type {OutputView|null} */
    this._outputView  = null;
    /** @type {number|null} 自動保存デバウンス用タイマー */
    this._saveTimer   = null;
  }

  /** DOM が準備完了後に呼び出す初期化処理。 */
  init() {
    const canvasEl = document.getElementById('main-canvas');

    this._renderer    = new CanvasRenderer(canvasEl);
    this._toolbarView = new ToolbarView(this);
    this._outputView  = new OutputView(this);
    new CanvasView(canvasEl, this, this._renderer);

    // 保存済み状態を復元する
    const saved = this._storage.load();
    if (saved) {
      this._buffer = new PixelBuffer(saved.width, saved.height);
      this._buffer.data = saved.data;
      this._toolbarView.updateCanvasSize(saved.width, saved.height);
      this._outputView.setName(saved.name);
      this._includePath = saved.includePath;
      this._outputView.setIncludePath(saved.includePath);
    } else {
      // キャンバス状態がなくてもインクルードパスは独立して保存されている可能性がある
      const savedPath = this._storage.loadIncludePath();
      this._includePath = savedPath;
      this._outputView.setIncludePath(savedPath);
    }

    const initialPixelSize = this._calcInitialPixelSize();
    this._renderer.setPixelSize(initialPixelSize, this._buffer);
    this._toolbarView.updateZoomLabel(initialPixelSize);
    this._toolbarView.updateUndoRedo(false, false);
    if (saved) {
      this._outputView.refreshCode();
    }
  }

  // ─── ポインタイベントハンドラ ───────────────────────────────────────

  /** @param {number} col @param {number} row */
  handlePointerDown(col, row) {
    this._history.push(this._buffer);
    if (this._activeTool === 'pencil') {
      this._pencil.onPointerDown(this._buffer, col, row, this._activeColor);
    } else {
      this._fill.execute(this._buffer, col, row, this._activeColor);
    }
    this._renderer.render(this._buffer);
    this._updateUndoRedoButtons();
  }

  /** @param {number} col @param {number} row */
  handlePointerMove(col, row) {
    if (this._activeTool !== 'pencil') return;
    this._pencil.onPointerMove(this._buffer, col, row, this._activeColor);
    this._renderer.render(this._buffer);
  }

  handlePointerUp() {
    this._pencil.onPointerUp();
    this._scheduleSave();
    this._outputView?.refreshCode();
  }

  // ─── ツール・カラー変更 ────────────────────────────────────────────

  /** @param {'pencil'|'fill'} toolName */
  handleToolChange(toolName) {
    this._activeTool = toolName;
  }

  /** @param {0|1} color */
  handleColorChange(color) {
    this._activeColor = color;
  }

  // ─── Undo / Redo ──────────────────────────────────────────────────

  handleUndo() {
    if (!this._history.canUndo()) return;
    this._history.pushRedo(this._buffer);
    this._buffer = this._history.undo();
    this._pencil.onPointerUp();
    this._renderer.render(this._buffer);
    this._updateUndoRedoButtons();
    this._scheduleSave();
    this._outputView?.refreshCode();
  }

  handleRedo() {
    if (!this._history.canRedo()) return;
    const next = this._history.redo();
    // redo スタックをクリアしない pushUndo で現在状態を undo スタックに保存する
    this._history.pushUndo(this._buffer);
    this._buffer = next;
    this._pencil.onPointerUp();
    this._renderer.render(this._buffer);
    this._updateUndoRedoButtons();
    this._scheduleSave();
    this._outputView?.refreshCode();
  }

  // ─── キャンバス操作 ────────────────────────────────────────────────

  /**
   * @param {number} width
   * @param {number} height
   */
  handleCanvasResize(width, height) {
    this._history.push(this._buffer);
    this._buffer.resize(width, height, 0);
    this._renderer.render(this._buffer);
    this._updateUndoRedoButtons();
    this._scheduleSave();
    this._outputView?.refreshCode();
  }

  /** @param {0|1} color */
  handleCanvasReset(color) {
    this._history.push(this._buffer);
    this._buffer.clear(color);
    this._renderer.render(this._buffer);
    this._updateUndoRedoButtons();
    this._scheduleSave();
    this._outputView?.refreshCode();
  }

  // ─── ズーム ────────────────────────────────────────────────────────

  /** @param {number} delta +1 で拡大、-1 で縮小 */
  handleZoomDelta(delta) {
    this._applyZoom(this._renderer.pixelSize + delta);
  }

  /** @param {number} pixelSize スライダーが指定するピクセルサイズ */
  handleZoomByIndex(pixelSize) {
    this._applyZoom(pixelSize);
  }

  /** @param {number} pixelSize 適用するピクセルサイズ */
  _applyZoom(pixelSize) {
    const clamped = Math.max(MIN_PIXEL_SIZE, Math.min(MAX_PIXEL_SIZE, pixelSize));
    if (clamped === this._renderer.pixelSize) return;
    this._renderer.setPixelSize(clamped, this._buffer);
    this._toolbarView.updateZoomLabel(clamped);
  }

  // ─── ファイルロード ─────────────────────────────────────────────────

  /**
   * .hpp ファイルの文字列を解析してキャンバスに反映する。
   * @param {string} source ファイル内容
   * @returns {string|null} エラーメッセージ（成功時は null）
   */
  handleLoadHpp(source) {
    let parsed;
    try {
      parsed = this._parser.parse(source);
    } catch (err) {
      return err.message;
    }

    this._history.push(this._buffer);
    this._buffer = new PixelBuffer(parsed.width, parsed.height);
    this._buffer.data = parsed.pixels;
    this._toolbarView.updateCanvasSize(parsed.width, parsed.height);
    this._outputView?.setName(parsed.name);
    this._renderer.setPixelSize(this._renderer.pixelSize, this._buffer);
    this._renderer.render(this._buffer);
    this._updateUndoRedoButtons();
    this._outputView?.refreshCode();
    return null;
  }

  // ─── コード生成 ─────────────────────────────────────────────────────

  /**
   * @param {string} name       C++識別子（OutputView 側でバリデーション済み）
   * @param {string} lineEnding 改行コード（'\r\n' または '\n'）
   * @returns {string}
   */
  handleGenerate(name, lineEnding) {
    const data = this._encoder.encode(this._buffer);
    return this._codegen.generate(
      name,
      this._buffer.width,
      this._buffer.height,
      data,
      this._includePath,
      lineEnding,
    );
  }

  /**
   * インクルードパスが変更されたときに呼び出す。
   * @param {string} path
   */
  handleIncludePathChange(path) {
    this._includePath = path;
    this._scheduleSave();
  }

  // ─── 内部ユーティリティ ─────────────────────────────────────────────

  _updateUndoRedoButtons() {
    this._toolbarView.updateUndoRedo(
      this._history.canUndo(),
      this._history.canRedo(),
    );
  }

  /**
   * 500ms のデバウンスで localStorage へ保存する。
   * ドラッグ中の過剰な書き込みを防ぐ。
   */
  _scheduleSave() {
    if (this._saveTimer !== null) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      const name = this._outputView?.getName() ?? 'bitmap';
      this._storage.save(this._buffer, name, this._includePath);
    }, 500);
  }

  /**
   * キャンバス表示領域に収まる初期ピクセルサイズを計算する。
   * @returns {number}
   */
  _calcInitialPixelSize() {
    const container = document.getElementById('canvas-container');
    const padding   = 48;
    const aw = (container?.clientWidth  ?? 600) - padding;
    const ah = (container?.clientHeight ?? 400) - padding;
    const maxPs = Math.floor(Math.min(aw / this._buffer.width, ah / this._buffer.height));
    return Math.max(MIN_PIXEL_SIZE, Math.min(MAX_PIXEL_SIZE, maxPs));
  }
}
