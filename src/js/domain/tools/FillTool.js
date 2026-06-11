/**
 * 塗りつぶしツール。
 * BFS（幅優先探索）による 4 近傍フラッドフィルを実装する。
 */
export class FillTool {
  /**
   * 指定座標を起点にフラッドフィルを実行する。
   * ターゲット色と塗りつぶし色が同じ場合は何もしない（無限ループ防止）。
   * @param {import('../PixelBuffer.js').PixelBuffer} buffer
   * @param {number} col
   * @param {number} row
   * @param {0|1} color
   */
  execute(buffer, col, row, color) {
    const targetColor = buffer.getPixel(col, row);
    if (targetColor === color) return;

    const { width, height } = buffer;
    // 訪問済みフラグ（Uint8Array で省メモリ）
    const visited = new Uint8Array(width * height);
    const queue   = [{ c: col, r: row }];
    visited[row * width + col] = 1;

    while (queue.length > 0) {
      const { c, r } = queue.shift();
      buffer.setPixel(c, r, color);

      const neighbors = [
        { c: c - 1, r },
        { c: c + 1, r },
        { c,        r: r - 1 },
        { c,        r: r + 1 },
      ];

      for (const n of neighbors) {
        if (n.c < 0 || n.c >= width || n.r < 0 || n.r >= height) continue;
        const idx = n.r * width + n.c;
        if (visited[idx]) continue;
        if (buffer.getPixel(n.c, n.r) !== targetColor) continue;
        visited[idx] = 1;
        queue.push(n);
      }
    }
  }
}
