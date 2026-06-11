import { App }         from './App.js';
import { PaneSplitter } from './ui/PaneSplitter.js';

// DOM 読み込み完了後にアプリケーションを起動する
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();

  new PaneSplitter(
    document.getElementById('pane-resizer'),
    document.querySelector('.output-panel'),
  );
});
