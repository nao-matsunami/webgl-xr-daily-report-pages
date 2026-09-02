import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const outputDir = path.join(rootDir, "outputs");
const marker = "<!-- mobile-preset-controls:v1 -->";

const snippet = `${marker}
<style>
  .mobile-preset-controls {
    position: fixed;
    left: max(10px, env(safe-area-inset-left));
    right: max(10px, env(safe-area-inset-right));
    bottom: max(10px, env(safe-area-inset-bottom));
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    gap: 7px;
    pointer-events: none;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  .mobile-preset-controls button {
    pointer-events: auto;
    appearance: none;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 999px;
    min-width: 38px;
    height: 38px;
    padding: 0 12px;
    background: rgba(8, 10, 14, 0.68);
    color: rgba(255, 255, 255, 0.92);
    font: 700 13px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.34);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    touch-action: manipulation;
  }
  .mobile-preset-controls button:active,
  .mobile-preset-controls button.is-active {
    background: rgba(255, 221, 128, 0.86);
    color: #101014;
    border-color: rgba(255, 255, 255, 0.72);
  }
  @media (hover: hover) and (pointer: fine) {
    .mobile-preset-controls { opacity: 0.42; transition: opacity 160ms ease; }
    .mobile-preset-controls:hover { opacity: 1; }
  }
  @media (max-width: 520px) {
    .mobile-preset-controls { gap: 6px; }
    .mobile-preset-controls button { min-width: 34px; height: 36px; padding: 0 10px; font-size: 12px; }
  }
</style>
<div class="mobile-preset-controls" aria-label="Preset controls">
  <button type="button" data-mobile-key="1" aria-label="Preset 1">1</button>
  <button type="button" data-mobile-key="2" aria-label="Preset 2">2</button>
  <button type="button" data-mobile-key="3" aria-label="Preset 3">3</button>
  <button type="button" data-mobile-key="4" aria-label="Preset 4">4</button>
  <button type="button" data-mobile-key="5" aria-label="Preset 5">5</button>
  <button type="button" data-mobile-key="Space" aria-label="Pulse">Pulse</button>
</div>
<script>
(() => {
  const dock = document.currentScript.previousElementSibling;
  if (!dock || dock.dataset.ready === 'true') return;
  dock.dataset.ready = 'true';
  const sendKey = (keyName) => {
    const isSpace = keyName === 'Space';
    const key = isSpace ? ' ' : keyName;
    const code = isSpace ? 'Space' : 'Digit' + keyName;
    const eventInit = { key, code, bubbles: true, cancelable: true };
    window.dispatchEvent(new KeyboardEvent('keydown', eventInit));
    document.dispatchEvent(new KeyboardEvent('keydown', eventInit));
    if (isSpace) {
      window.setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', eventInit));
        document.dispatchEvent(new KeyboardEvent('keyup', eventInit));
      }, 140);
    }
  };
  dock.querySelectorAll('button').forEach((button) => {
    const keyName = button.dataset.mobileKey;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      dock.querySelectorAll('button').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      sendKey(keyName);
    });
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
})();
</script>`;

async function main() {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  let changed = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;

    const filePath = path.join(outputDir, entry.name);
    let html = await fs.readFile(filePath, "utf8");
    if (html.includes(marker)) continue;
    if (!/<\/body>/i.test(html)) {
      skipped += 1;
      continue;
    }

    html = html.replace(/<\/body>/i, `${snippet}\n</body>`);
    await fs.writeFile(filePath, html, "utf8");
    changed += 1;
  }

  console.log(`Mobile preset controls injected: ${changed} changed, ${skipped} skipped.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
