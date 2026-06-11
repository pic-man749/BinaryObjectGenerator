import { App } from './App.js';

// DOM 読み込み完了後にアプリケーションを起動する
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
