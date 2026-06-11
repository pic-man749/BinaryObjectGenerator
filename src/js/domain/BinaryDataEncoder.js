/**
 * PixelBuffer を BinaryGFX::BinaryData 形式のバイト配列に変換する。
 *
 * データレイアウト: 列優先（column-major）、LSB が上端（row 0 が bit0）
 *   pagesPerCol = ceil(height / 8)
 *   byte = data[col * pagesPerCol + page]
 *   pixel(col, row): (byte >> (row % 8)) & 0x01
 */
export class BinaryDataEncoder {
  /**
   * @param {import('./PixelBuffer.js').PixelBuffer} buffer
   * @returns {Uint8Array}
   */
  encode(buffer) {
    const { width, height } = buffer;
    const pagesPerCol = Math.ceil(height / 8);
    const result      = new Uint8Array(width * pagesPerCol);

    for (let col = 0; col < width; col++) {
      for (let page = 0; page < pagesPerCol; page++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const row = page * 8 + bit;
          if (row < height && buffer.getPixel(col, row) === 1) {
            byte |= (1 << bit);
          }
        }
        result[col * pagesPerCol + page] = byte;
      }
    }

    return result;
  }
}
