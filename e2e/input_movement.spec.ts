import { test, expect } from '@playwright/test';

test('input field should be in document.body and movable', async ({ page }) => {
  await page.setContent(`
    <html>
      <body style="margin: 0; padding: 0; height: 1000px; overflow: hidden;">
        <div id="video-player" style="width: 500px; height: 300px; background: black; position: relative;">
          <video></video>
        </div>
        <script>
          function createInputForm(position) {
            const HOST_ID = "commentator-input-host";
            let host = document.createElement("div");
            host.id = HOST_ID;
            host.style.cssText = "display:contents !important;position:fixed;z-index:2147483647;";
            document.body.prepend(host);

            const observer = new MutationObserver(() => {
              if (host && host.parentElement !== document.body) {
                document.body.prepend(host);
              }
            });
            observer.observe(document.body, { childList: true });

            const shadow = host.attachShadow({ mode: "open" });
            const container = document.createElement("div");
            container.id = "commentator-input-container";
            container.style.cssText = "position:fixed !important;z-index:2147483647 !important;width:200px;height:40px;background:red;left:20px;top:20px;";
            
            const handle = document.createElement("div");
            handle.title = "ドラッグして移動";
            handle.style.cssText = "width:20px;height:20px;background:blue;cursor:grab;";
            
            let dragging = false;
            let startX, startY, startLeft, startTop;
            
            handle.addEventListener("mousedown", (e) => {
              dragging = true;
              const rect = container.getBoundingClientRect();
              startLeft = rect.left;
              startTop = rect.top;
              startX = e.clientX;
              startY = e.clientY;
              container.style.left = startLeft + "px";
              container.style.top = startTop + "px";
            });
            
            window.addEventListener("mousemove", (e) => {
              if (!dragging) return;
              container.style.left = (startLeft + e.clientX - startX) + "px";
              container.style.top = (startTop + e.clientY - startY) + "px";
            });
            
            window.addEventListener("mouseup", () => { dragging = false; });
            
            container.appendChild(handle);
            shadow.appendChild(container);
          }
          
          createInputForm({ left: '20px', top: '20px' });
        </script>
      </body>
    </html>
  `);

  const host = page.locator('#commentator-input-host');

  // 1. body の直下にあることを確認
  const parentName = await host.evaluate(el => el.parentElement?.tagName);
  expect(parentName).toBe('BODY');

  // 2. ドラッグして移動できることを確認
  const container = host.locator('div#commentator-input-container');
  const handle = host.locator('div[title="ドラッグして移動"]');

  const initialBox = await container.boundingBox();
  expect(initialBox).not.toBeNull();

  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(500, 500);
  await page.mouse.up();

  const movedBox = await container.boundingBox();
  expect(movedBox).not.toBeNull();
  expect(movedBox!.x).not.toBe(initialBox!.x);

  // 3. MutationObserver が機能しているか（bodyの最後に移動させても先頭に戻るか）
  await page.evaluate(() => {
    const host = document.getElementById('commentator-input-host');
    document.body.appendChild(host!);
  });

  // prepend なので最初の子であるはず
  const firstChildId = await page.evaluate(() => document.body.firstElementChild?.id);
  expect(firstChildId).toBe('commentator-input-host');
});
