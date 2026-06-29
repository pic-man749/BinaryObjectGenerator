/** localStorage のキー（キャンバス状態） */
const STORAGE_KEY = 'binaryObjectGenerator.state';
/** localStorage のキー（インクルードパス） */
const INCLUDE_PATH_KEY = 'binaryObjectGenerator.includePath';
/** インクルードパスのデフォルト値 */
export const DEFAULT_INCLUDE_PATH = 'BinaryGFX/Core/Binary/BinaryData.hpp';
/** 保存データのバージョン */
const SCHEMA_VERSION = 1;

/**
 * キャンバス状態を localStorage に保存・復元する。
 */
export class StorageManager {
  /**
   * 現在の状態を localStorage に保存する。
   * @param {import('./PixelBuffer.js').PixelBuffer} buffer
   * @param {string} name        図形名称
   * @param {string} includePath インクルードパス
   */
  save(buffer, name, includePath) {
    try {
      const payload = {
        version: SCHEMA_VERSION,
        width:   buffer.width,
        height:  buffer.height,
        data:    this._encode(buffer.data),
        name,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(INCLUDE_PATH_KEY, includePath);
    } catch {
      // localStorage が利用できない環境（プライベートブラウジング等）では無視する
    }
  }

  /**
   * localStorage から保存済みの状態を読み込む。
   * @returns {{ width: number, height: number, data: Uint8Array, name: string, includePath: string }|null}
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const payload = JSON.parse(raw);
      if (payload.version !== SCHEMA_VERSION) return null;

      const { width, height, name } = payload;
      if (!Number.isInteger(width)  || width  < 1 || width  > 256) return null;
      if (!Number.isInteger(height) || height < 1 || height > 256) return null;

      const data = this._decode(payload.data);
      if (data.length !== width * height) return null;

      const includePath = this.loadIncludePath();
      return { width, height, data, name: name || 'bitmap', includePath };
    } catch {
      return null;
    }
  }

  /**
   * localStorage からインクルードパスを読み込む。
   * 保存されていない場合はデフォルト値を返す。
   * @returns {string}
   */
  loadIncludePath() {
    try {
      return localStorage.getItem(INCLUDE_PATH_KEY) ?? DEFAULT_INCLUDE_PATH;
    } catch {
      return DEFAULT_INCLUDE_PATH;
    }
  }

  /** 保存済みデータを削除する。 */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 無視する
    }
  }

  /**
   * Uint8Array を Base64 文字列にエンコードする。
   * @param {Uint8Array} bytes
   * @returns {string}
   */
  _encode(bytes) {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }

  /**
   * Base64 文字列を Uint8Array にデコードする。
   * @param {string} base64
   * @returns {Uint8Array}
   */
  _decode(base64) {
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

}
