import { test, expect } from '@playwright/test';

// Use a specific user agent to or bypass bot detection
test.use({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
});

test('capture direct youtube screenshot with commentator ui', async ({ page }) => {
  test.setTimeout(120000);

  // 1. Navigate to a stable YouTube video (Nature 4K)
  // This one is very stable and has beautiful high-contrast scenes
  await page.goto('https://www.youtube.com/watch?v=aqz-KE-bpKQ', { waitUntil: 'domcontentloaded' });

  // 2. Wait for the video element
  try {
    await page.waitForSelector('video', { timeout: 60000 });
  } catch (e) {
    console.log('Video element not found');
    await page.screenshot({ path: 'test-results/debug_unavailable.png' });
    throw e;
  }

  // 3. Prepare the appearance
  await page.evaluate(() => {
    // Hide UI noise
    const selectors = ['#masthead-container', '#sidebar', '#comments', '.video-ads', '.ytp-ad-module', '.ytp-chrome-top', '.ytp-chrome-bottom'];
    selectors.forEach(s => {
      const el = document.querySelector(s);
      if (el) (el as HTMLElement).style.display = 'none';
    });

    const video = document.querySelector('video');
    if (video) {
      video.pause();
      video.currentTime = 60; // Skip intro if any
    }

    // Background should be black for the video area if it's not full screen
    document.body.style.backgroundColor = '#000';

    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: '999999'
    });
    document.body.appendChild(container);

    const comments = [
      { text: '神作画！', top: '15%', left: '70%', color: '#ff00ff' },
      { text: '最高すぎる...', top: '30%', left: '40%', color: '#00ffff' },
      { text: 'ここ好き', top: '45%', left: '80%', color: '#ffff00' },
      { text: '泣いた', top: '20%', left: '25%', color: '#ffffff' },
      { text: '鳥肌確定ｗｗｗ', top: '65%', left: '55%', color: '#00ff00' }
    ];

    comments.forEach(c => {
      const span = document.createElement('span');
      span.textContent = c.text;
      Object.assign(span.style, {
        position: 'absolute', top: c.top, left: c.left, fontSize: '42px',
        fontWeight: 'bold', color: c.color, textShadow: '0 0 10px #000, 0 0 20px rgba(0,0,0,0.5)',
        fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif'
      });
      container.appendChild(span);
    });

    const ui = document.createElement('div');
    Object.assign(ui.style, {
      position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', background: 'rgba(5, 5, 5, 0.95)', padding: '12px 28px',
      borderRadius: '50px', border: '1px solid rgba(255,255,255,0.2)', width: '520px',
      alignItems: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.9)', zIndex: '999999',
      backdropFilter: 'blur(15px)'
    });

    const text = document.createElement('div');
    text.textContent = '最高のシーンにコメントを送信...';
    Object.assign(text.style, { color: 'rgba(255,255,255,0.6)', flex: '1', fontSize: '16px' });

    const btn = document.createElement('div');
    btn.textContent = '送信';
    Object.assign(btn.style, { color: '#00ffff', fontWeight: 'bold', fontSize: '16px' });

    ui.appendChild(text);
    ui.appendChild(btn);
    document.body.appendChild(ui);
  });

  // 4. Capture
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'client/public/youtube_service_real.png' });
  console.log('Saved client/public/youtube_service_real.png');
});
