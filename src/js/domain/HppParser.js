/**
 * BinaryObject Generator が生成した .hpp ファイルを解析し、
 * キャンバス状態を復元するためのデータを抽出する。
 */
export class HppParser {
  /**
   * @param {string} source .hpp ファイルの文字列
   * @returns {{ name: string, width: number, height: number, pixels: Uint8Array }}
   * @throws {Error} 解析に失敗した場合
   */
  parse(source) {
    const name              = this._parseName(source);
    const { width, height } = this._parseDimensions(source, name);
    const byteData          = this._parseByteData(source, name);
    const pixels            = this._decodeToPixels(byteData, width, height);
    return { name, width, height, pixels };
  }

  /**
   * BinaryData 変数名を抽出する。
   * @param {string} source
   * @returns {string}
   */
  _parseName(source) {
    const match = source.match(/static\s+constexpr\s+BinaryGFX::BinaryData\s+(\w+)\s*=/);
    if (!match) throw new Error('BinaryData の定義が見つかりません。');
    return match[1];
  }

  /**
   * 幅と高さを抽出する。
   * @param {string} source
   * @param {string} name
   * @returns {{ width: number, height: number }}
   */
  _parseDimensions(source, name) {
    const structPattern = new RegExp(
      `static\\s+constexpr\\s+BinaryGFX::BinaryData\\s+${name}\\s*=\\s*\\{([^}]+)\\}`,
    );
    const match = source.match(structPattern);
    if (!match) throw new Error('BinaryData 構造体の内容が解析できません。');

    const numbers = match[1].match(/\d+/g);
    if (!numbers || numbers.length < 2) throw new Error('幅・高さの値が見つかりません。');

    const width  = parseInt(numbers[0], 10);
    const height = parseInt(numbers[1], 10);
    if (width < 1 || width > 256 || height < 1 || height > 256) {
      throw new Error(`キャンバスサイズが範囲外です（${width}×${height}）。`);
    }

    return { width, height };
  }

  /**
   * バイト配列を抽出する。
   * @param {string} source
   * @param {string} name
   * @returns {number[]}
   */
  _parseByteData(source, name) {
    const arrayPattern = new RegExp(
      `static\\s+const\\s+uint8_t\\s+${name}_data\\[\\]\\s*=\\s*\\{([^}]*)\\}`,
    );
    const match = source.match(arrayPattern);
    if (!match) throw new Error(`"${name}_data" 配列が見つかりません。`);

    const hexMatches = match[1].match(/0[xX][0-9A-Fa-f]{1,2}/g);
    if (!hexMatches || hexMatches.length === 0) throw new Error('バイトデータが見つかりません。');

    return hexMatches.map(h => parseInt(h, 16));
  }

  /**
   * BinaryData 形式のバイト列を行優先ピクセルデータに変換する。
   * @param {number[]} byteData 列優先・LSB上端のバイト列
   * @param {number}   width
   * @param {number}   height
   * @returns {Uint8Array}
   */
  _decodeToPixels(byteData, width, height) {
    const pagesPerCol    = Math.ceil(height / 8);
    const expectedLength = width * pagesPerCol;
    if (byteData.length !== expectedLength) {
      throw new Error(
        `データ長が不正です（期待: ${expectedLength} バイト、実際: ${byteData.length} バイト）。`,
      );
    }

    const pixels = new Uint8Array(width * height);
    for (let col = 0; col < width; col++) {
      for (let page = 0; page < pagesPerCol; page++) {
        const byte = byteData[col * pagesPerCol + page];
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
