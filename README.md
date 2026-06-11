# BinaryObject Generator

**https://pic-man749.github.io/BinaryObjectGenerator/**

[BinaryGFX](https://github.com/pic-man749/BinaryGFX) の `BinaryObject` で使用する `BinaryGFX::BinaryData` 形式のヘッダファイルを、ブラウザ上のGUIで作成・出力するツールです。

## 使い方

1. **キャンバスに図形を描く**
   - ペンシルツール：クリックまたはドラッグでピクセルを描画
   - 塗りつぶしツール：クリックした位置から同色領域を塗りつぶし
   - 描画色（白 / 黒）はツールバーで切り替え可能
   - Undo: `Ctrl+Z` / Redo: `Ctrl+Y`

2. **図形名称を入力する**
   - 出力パネルの「図形名称」欄に C++ 識別子を入力（例: `my_icon`）

3. **コードを生成する**
   - 「コードを生成」ボタンを押すと `.hpp` コードが出力される
   - 「コピー」ボタンでクリップボードにコピー、または「.hpp ダウンロード」でファイルとして保存

## 出力形式

```cpp
#ifndef BINARYGFX_BINARYOBJECT_MY_ICON_HPP_
#define BINARYGFX_BINARYOBJECT_MY_ICON_HPP_

#include "BinaryGFX/Core/Binary/BinaryData.hpp"
#include <cstdint>

static const uint8_t my_icon_data[] = {
    0xFF, 0x81, ...
};

static constexpr BinaryGFX::BinaryData my_icon = {
    16, 16, my_icon_data
};

#endif
```
