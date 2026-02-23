import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '16px', minWidth: '200px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Commentator</h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>動画にコメントを残そう</p>
      <div style={{ borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '16px' }}>
        <a
          href="https://sakamoto051.github.io/commentator/privacy.html"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '12px', color: '#007bff', textDecoration: 'none' }}
        >
          プライバシーポリシー
        </a>
      </div>
    </div>
  </React.StrictMode>,
)
