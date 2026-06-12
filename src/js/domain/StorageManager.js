/** localStorage のキー */
const STORAGE_KEY = 'binaryObjectGenerator.state';
/** 保存データのバージョン */
const SCHEMA_VERSION = 1;

/**
 * キャンバス状態を localStorage に保存・復元する。
 */
export class StorageManager {
  /**
   * 現在の状態を localStorage に保存する。
   * @param {import('./PixelBuffer.js').PixelBuffer} buffer
   * @param {string} name 図形名称
   */
  save(buffer, name) {
    try {
      const payload = {
        version: SCHEMA_VERSION,
        width:   buffer.width,
        height:  buffer.height,
        data:    this._encode(buffer.data),
        name,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage が利用できない環境（プライベートブラウジング等）では無視する
    }
  }

  /**
   * localStorage から保存済みの状態を読み込む。
   * @returns {{ width: number, height: number, data: Uint8Array, name: string }|null}
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
      if (data.length !== width * Math.ceil(height / 8)) return null;

      return { width, height, data: this._toPixelData(data, width, height), name: name || 'bitmap' };
    } catch {
      return null;
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

  /**
   * BinaryData 形式のバイト配列を PixelBuffer 用の行優先ピクセルデータに変換する。
   * （BinaryDataEncoder の逆変換）
   * @param {Uint8Array} binaryData 列優先・LSB上端のバイト列
   * @param {number}     width
   * @param {number}     height
   * @returns {Uint8Array} 行優先ピクセルデータ（値は 0 または 1）
   */
  _toPixelData(binaryData, width, height) {
    const pagesPerCol = Math.ceil(height / 8);
    const pixels      = new Uint8Array(width * height);

    for (let col = 0; col < width; col++) {
      for (let page = 0; page < pagesPerCol; page++) {
        const byte = binaryData[col * pagesPerCol + page];
        for (let bit = 0; bit < 8; bit++) {
          const row = page * 8 + bit;
          if (row < height) {
            pixels[row * width + col] = (byte >> bit) & 1;
          }
        }
      }
    }

    return pixels;
  }
}
