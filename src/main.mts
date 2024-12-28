import './style.css'
import {App} from "./app.mjs";

const DOM_CONTENT_LOADED_EVENT = "DOMContentLoaded";

function main() {
  document.removeEventListener(DOM_CONTENT_LOADED_EVENT, main);
  const root: HTMLDivElement = document.querySelector<HTMLDivElement>('#app')!;
  App.start(root);
}

if (document.readyState === "loading") {
  document.addEventListener(DOM_CONTENT_LOADED_EVENT, main);
} else {
  main();
}
