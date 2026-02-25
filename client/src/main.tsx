import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'

const Popup = () => {
  const [opacity, setOpacity] = useState(0.7);
  const [bgColor, setBgColor] = useState('#0f0f0f');

  useEffect(() => {
    // 初期値の読み込み
    chrome.storage.local.get(['inputOpacity', 'inputBgColor'], (result) => {
      if (result.inputOpacity !== undefined) setOpacity(result.inputOpacity);
      if (result.inputBgColor !== undefined) setBgColor(result.inputBgColor);
    });
  }, []);

  // 輝度計算
  const getLuminance = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const getContrastColor = (hex: string) => {
    return getLuminance(hex) > 0.45 ? "#000000" : "#ffffff";
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setOpacity(val);
    chrome.storage.local.set({ inputOpacity: val });
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBgColor(val);
    chrome.storage.local.set({ inputBgColor: val });
  };

  const color = '#ff4b2b'; // デフォルトのテーマカラー
  const bgContrast = getContrastColor(bgColor);

  return (
    <div style={{ padding: '20px', minWidth: '240px', fontFamily: "'Inter', sans-serif", background: bgColor, color: bgContrast, borderRadius: '12px', transition: 'background 0.3s, color 0.3s' }}>
      <h1 style={{ fontSize: '20px', margin: '0 0 16px 0', fontWeight: 'bold', background: `linear-gradient(135deg, ${bgContrast} 0%, ${bgContrast}88 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Settings
      </h1>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', opacity: 0.7 }}>通常時の不透明度: {Math.round(opacity * 100)}%</label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={opacity}
          onChange={handleOpacityChange}
          style={{ width: '100%', cursor: 'pointer', accentColor: color }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', opacity: 0.7 }}>背景色 (パディング部分)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="color"
            value={bgColor}
            onChange={handleBgColorChange}
            style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{bgColor.toUpperCase()}</span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${bgContrast}22`, paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: `${bgContrast}66` }}>v0.1.0</span>
        <a
          href="https://sakamoto051.github.io/commentator/privacy.html"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '12px', color: `${bgContrast}88`, textDecoration: 'none' }}
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
)
