/** C++識別子の正規表現 */
const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * 出力パネルの UI イベントを処理する。
 */
export class OutputView {
  /**
   * @param {import('../App.js').App} app
   */
  constructor(app) {
    this._app = app;

    this._inputName        = document.getElementById('input-name');
    this._nameError        = document.getElementById('name-error');
    this._selectLineEnding = document.getElementById('select-line-ending');
    this._btnGenerate      = document.getElementById('btn-generate');
    this._textarea         = document.getElementById('output-textarea');
    this._btnCopy          = document.getElementById('btn-copy');
    this._btnDownload      = document.getElementById('btn-download');
    this._btnLoadHpp       = document.getElementById('btn-load-hpp');
    this._inputFileHpp     = document.getElementById('input-file-hpp');
    this._loadHppStatus    = document.getElementById('load-hpp-status');
    // textarea は改行コードを正規化するため、生成コードを別途保持する
    this._lastGeneratedCode = '';

    this._bindEvents();
    this._validateName();
  }

  _bindEvents() {
    this._inputName.addEventListener('input',  () => this._validateName());
    this._btnGenerate.addEventListener('click', () => this._generate());
    this._btnCopy.addEventListener('click',     () => this._copy());
    this._btnDownload.addEventListener('click', () => this._download());

    // .hpp ファイル読み込みボタン → 非表示のファイル入力をトリガー
    this._btnLoadHpp.addEventListener('click', () => {
      this._inputFileHpp.value = '';
      this._inputFileHpp.click();
    });

    // ファイル選択後に FileReader で読み込み、App に渡す
    this._inputFileHpp.addEventListener('change', () => {
      const file = this._inputFileHpp.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const source  = e.target.result;
        const errMsg  = this._app.handleLoadHpp(source);
        if (errMsg) {
          this._setLoadStatus(errMsg, true);
        } else {
          this._setLoadStatus(`${file.name} を読み込みました。`);
        }
      };
      reader.onerror = () => {
        this._setLoadStatus('ファイルの読み込みに失敗しました。', true);
      };
      reader.readAsText(file, 'UTF-8');
    });
  }

  /** 図形名称の入力をバリデーションし、UI に反映する。 */
  _validateName() {
    const value = this._inputName.value;
    const valid = IDENTIFIER_PATTERN.test(value);

    if (!value) {
      this._showError('名称を入力してください。');
    } else if (!valid) {
      this._showError('英字・数字・アンダースコアのみ使用でき、先頭は英字またはアンダースコアにしてください。');
    } else {
      this._clearError();
    }

    this._btnGenerate.disabled = !valid || !value;
  }

  /** コードを生成してテキストエリアに表示する。 */
  _generate() {
    const name       = this._inputName.value;
    if (!IDENTIFIER_PATTERN.test(name)) return;

    const lineEnding        = this._selectLineEnding.value === 'CRLF' ? '\r\n' : '\n';
    const code              = this._app.handleGenerate(name, lineEnding);
    // textarea は改行コードを正規化するため、元のコードを保持してからセットする
    this._lastGeneratedCode = code;
    this._textarea.value    = code;
    this._btnCopy.disabled     = false;
    this._btnDownload.disabled = false;
  }

  /** 生成コードをクリップボードにコピーする。 */
  async _copy() {
    const code = this._lastGeneratedCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      this._showCopyFeedback();
    } catch {
      // Clipboard API が利用できない場合のフォールバック
      this._textarea.select();
      document.execCommand('copy');
    }
  }

  /** コピー完了のフィードバックをボタンに一時表示する。 */
  _showCopyFeedback() {
    const btn = this._btnCopy;
    const original = btn.textContent;
    btn.textContent = 'コピーしました';
    setTimeout(() => { btn.textContent = original; }, 1500);
  }

  /** 生成コードを .hpp ファイルとしてダウンロードする。 */
  _download() {
    const code = this._lastGeneratedCode;
    if (!code) return;

    const name = this._inputName.value;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);

    const anchor   = document.createElement('a');
    anchor.href     = url;
    anchor.download = `${name}.hpp`;
    anchor.click();

    // Blob URL は使用後に解放する
    URL.revokeObjectURL(url);
  }

  /**
   * @param {string} message
   */
  _showError(message) {
    this._nameError.textContent = message;
    this._inputName.classList.add('error');
  }

  _clearError() {
    this._nameError.textContent = '';
    this._inputName.classList.remove('error');
  }

  /**
   * .hpp 読み込みのステータスメッセージを表示する。
   * @param {string}  message
   * @param {boolean} isError
   */
  _setLoadStatus(message, isError = false) {
    this._loadHppStatus.textContent = message;
    this._loadHppStatus.classList.toggle('load-hpp-status--error', isError);
  }

  /** @returns {string} 現在入力されている図形名称 */
  getName() {
    return this._inputName.value;
  }

  /**
   * 図形名称を外部からセットする（保存済み状態の復元時に使用）。
   * @param {string} name
   */
  setName(name) {
    this._inputName.value = name;
    this._validateName();
  }
}
