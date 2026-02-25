import { test, expect } from '@playwright/test';

test('verify new stylish UI on youtube', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('https://www.youtube.com/watch?v=aqz-KE-bpKQ', { waitUntil: 'networkidle' });

  await page.waitForSelector('video');

  // インジェクション
  await page.evaluate(() => {
    // 既存のホストがあれば削除
    document.getElementById('commentator-input-host')?.remove();

    const HOST_ID = "commentator-input-host";
    const host = document.createElement("div");
    host.id = HOST_ID;
    host.style.cssText = "position:fixed !important;top:0;left:0;width:0;height:0;z-index:2147483647 !important;pointer-events:none !important;overflow:visible !important;display:block !important;transform:none !important;filter:none !important;";
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    const container = document.createElement("div");
    container.id = "commentator-input-container";

    // スタイル (main.tsx からコピー)
    container.style.cssText = `
      position: fixed !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      background: rgba(15, 15, 15, 0.75) !important;
      backdrop-filter: blur(12px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
      padding: 10px 16px !important;
      border-radius: 16px !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
      pointer-events: auto !important;
      user-select: none !important;
      transition: opacity 0.3s ease, transform 0.2s ease !important;
      left: 100px !important;
      top: 100px !important;
      width: auto !important;
      height: auto !important;
    `;

    const handle = document.createElement("div");
    handle.style.cssText = "width:12px;display:grid;grid-template-columns:1fr 1fr;gap:3px;cursor:grab;opacity:0.5;flex-shrink:0;";
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement("div");
      dot.style.cssText = "width:3px;height:3px;background:white;border-radius:50%;";
      handle.appendChild(dot);
    }

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "コメントを入力...";
    input.style.cssText = "background: rgba(255, 255, 255, 0.1) !important;color: white !important;border: 1px solid rgba(255, 255, 255, 0.2) !important;border-radius: 10px !important;padding: 8px 14px !important;font-size: 14px !important;width: 320px !important;outline: none !important;";

    const button = document.createElement("button");
    button.innerText = "送信";
    button.style.cssText = "background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%) !important;color: white !important;border: none !important;border-radius: 10px !important;padding: 8px 18px !important;font-size: 14px !important;font-weight: 600 !important;white-space: nowrap !important;box-shadow: 0 4px 12px rgba(255, 75, 43, 0.3) !important;";

    container.appendChild(handle);
    container.appendChild(input);
    container.appendChild(button);
    shadow.appendChild(container);
  });

  await page.screenshot({ path: 'test-results/ui_redesign.png' });
});
