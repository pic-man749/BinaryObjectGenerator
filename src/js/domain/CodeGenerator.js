/** バイトデータ出力の1行あたり最大バイト数 */
const BYTES_PER_LINE = 8;

/**
 * BinaryGFX::BinaryData 形式の .hpp ヘッダファイルコードを生成する。
 */
export class CodeGenerator {
  /**
   * @param {string}     name        C++識別子（バリデーション済みであること）
   * @param {number}     width
   * @param {number}     height
   * @param {Uint8Array} data        BinaryDataEncoder が出力したバイト配列
   * @param {string}     lineEnding  改行コード（例: '\r\n', '\n'）
   * @returns {string}
   */
  generate(name, width, height, data, lineEnding = '\r\n') {
    const guardName = `BINARYGFX_BINARYOBJECT_${name.toUpperCase()}_HPP_`;
    const dataLines = this._formatDataArray(data);

    return [
      `#ifndef ${guardName}`,
      `#define ${guardName}`,
      ``,
      `#include "BinaryGFX/Core/Binary/BinaryData.hpp"`,
      `#include <cstdint>`,
      ``,
      `static const uint8_t ${name}_data[] = {`,
      ...dataLines,
      `};`,
      ``,
      `static constexpr BinaryGFX::BinaryData ${name} = {`,
      `    ${width},`,
      `    ${height},`,
      `    ${name}_data`,
      `};`,
      ``,
      `#endif`,
      ``,
    ].join(lineEnding);
  }

  /**
   * バイト配列を 16 バイトごとに改行してフォーマットする。
   * @param {Uint8Array} data
   * @returns {string[]}
   */
  _formatDataArray(data) {
    const lines = [];
    for (let i = 0; i < data.length; i += BYTES_PER_LINE) {
      const chunk = Array.from(data.slice(i, i + BYTES_PER_LINE));
      const hex   = chunk.map(b => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`);
      lines.push(`    ${hex.join(', ')},`);
    }
    return lines;
  }
}
