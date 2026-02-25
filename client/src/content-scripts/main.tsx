import { Comment } from "../types";
import { createPlatform } from "./platforms/factory";

// 多重初期化防止
if ((window as any).__COMMENTATOR_INITIALIZED__) {
  // すでに初期化済み
} else {
  (window as any).__COMMENTATOR_INITIALIZED__ = true;

  const API_URL = import.meta.env.VITE_API_URL;

  let currentVideoId: string | null = null;
  let comments: Comment[] = [];
  let loadedChunks: Set<number> = new Set();
  let renderedCommentIds: Set<string> = new Set(); // 描画済みID管理

  async function fetchComments(videoId: string, startMs: number, endMs: number) {
    try {
      const response = await fetch(`${API_URL}?video_id=${videoId}&start=${startMs}&end=${endMs}`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data: Comment[] = await response.json();
      return data;
    } catch (error) {
      return [];
    }
  }

  async function loadChunk(videoId: string, timeMs: number) {
    const chunkSize = 5 * 60 * 1000; // 5分
    const chunkIndex = Math.floor(timeMs / chunkSize) * chunkSize;

    if (loadedChunks.has(chunkIndex)) return true;

    const newComments = await fetchComments(videoId, chunkIndex, chunkIndex + chunkSize);

    // 重複を避けてマージ
    const existingIds = new Set(comments.map(c => `${c.playback_time_ms}-${c.content}`));
    const uniqueNew = newComments.filter(c => !existingIds.has(`${c.playback_time_ms}-${c.content}`));

    comments = [...comments, ...uniqueNew].sort((a, b) => a.playback_time_ms - b.playback_time_ms);
    loadedChunks.add(chunkIndex);
    return true;
  }

  function createOverlay(playerElement: HTMLElement) {
    document.getElementById("commentator-overlay")?.remove();

    if (!document.getElementById("commentator-styles")) {
      const style = document.createElement("style");
      style.id = "commentator-styles";
      style.innerHTML = `
        @keyframes commentator-flow {
          from { transform: translateX(0); }
          to { transform: translateX(var(--move-distance)); }
        }
        .commentator-text {
          position: absolute;
          white-space: nowrap;
          color: yellow !important;
          text-shadow: 2px 2px 2px #000, -2px -2px 2px #000, 2px -2px 2px #000, -2px 2px 2px #000 !important;
          font-size: 32px;
          font-weight: bold;
          font-family: "Arial", sans-serif;
          z-index: 2147483647 !important;
          pointer-events: none;
          will-change: transform;
        }
      `;
      document.head.appendChild(style);
    }

    const overlay = document.createElement("div");
    overlay.id = "commentator-overlay";
    overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;overflow:hidden;";
    playerElement.appendChild(overlay);
    return overlay;
  }

  function displayComment(text: string) {
    let overlay = document.getElementById("commentator-overlay");
    if (!overlay) {
      const platform = createPlatform();
      const video = platform?.getActiveVideo();
      const player = platform?.getPlayerElement(video);
      if (player) overlay = createOverlay(player as HTMLElement);
    }

    if (!overlay) return;

    const commentEl = document.createElement("div");
    commentEl.className = "commentator-text";
    commentEl.innerText = text;
    commentEl.style.top = `${15 + Math.random() * 60}%`;
    commentEl.style.left = "100%";

    overlay.appendChild(commentEl);

    const commentWidth = commentEl.scrollWidth || 400;
    const playerWidth = (overlay as HTMLElement).offsetWidth || window.innerWidth;
    const moveDistance = playerWidth + commentWidth + 200;

    commentEl.style.setProperty("--move-distance", `-${moveDistance}px`);
    commentEl.style.animation = "commentator-flow 8s linear forwards";
    commentEl.addEventListener("animationend", () => commentEl.remove());
    setTimeout(() => commentEl.remove(), 10000);
  }

  function createInputForm(playerElement: HTMLElement, position: { top?: string; bottom?: string; right?: string; left?: string }) {
    const HOST_ID = "commentator-input-host";
    let host = document.getElementById(HOST_ID);
    if (host) host.remove();

    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.cssText = "position:fixed !important;top:0;left:0;width:0;height:0;z-index:2147483647 !important;pointer-events:none !important;overflow:visible !important;display:block !important;transform:none !important;filter:none !important;";
    document.documentElement.appendChild(host);

    const observer = new MutationObserver(() => {
      if (host && host.parentElement !== document.documentElement) {
        document.documentElement.appendChild(host);
      }
    });
    observer.observe(document.documentElement, { childList: true });

    const shadow = host.attachShadow({ mode: "open" });
    const platform = createPlatform();

    const container = document.createElement("div");
    container.id = "commentator-input-container";

    const styleEl = document.createElement("style");
    shadow.appendChild(styleEl);

    // 輝度計算ヘルパー
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

    // スタイル適用関数
    const applyStyles = (opacity: number, color: string, bgColor: string) => {
      const r = parseInt(bgColor.slice(1, 3), 16);
      const g = parseInt(bgColor.slice(3, 5), 16);
      const b = parseInt(bgColor.slice(5, 7), 16);

      const isDarkBg = getLuminance(bgColor) < 0.4;
      const themeColor = "#ff4b2b"; // 基調色を固定

      // Placeholderの色を動的に変更
      styleEl.innerHTML = `
        input::placeholder { color: ${isDarkBg ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} !important; }
      `;

      // setProperty を使用して確実に !important を適用
      const s = container.style;
      s.setProperty("position", "fixed", "important");
      s.setProperty("z-index", "2147483647", "important");
      s.setProperty("display", "flex", "important");
      s.setProperty("align-items", "center", "important");
      s.setProperty("gap", "12px", "important");
      s.setProperty("background", `rgba(${r}, ${g}, ${b}, 0.75)`, "important");
      s.setProperty("backdrop-filter", "blur(12px) saturate(180%)", "important");
      s.setProperty("-webkit-backdrop-filter", "blur(12px) saturate(180%)", "important");
      s.setProperty("padding", "10px 16px", "important");
      s.setProperty("border-radius", "16px", "important");
      s.setProperty("border", `1px solid ${isDarkBg ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"}`, "important");
      s.setProperty("box-shadow", "0 8px 32px rgba(0, 0, 0, 0.4)", "important");
      s.setProperty("pointer-events", "auto", "important");
      s.setProperty("user-select", "none", "important");
      s.setProperty("transition", "opacity 0.3s ease, transform 0.2s ease", "important");
      s.setProperty("left", position.left || "auto", "important");
      s.setProperty("top", position.top || "auto", "important");
      s.setProperty("right", position.right || "auto", "important");
      s.setProperty("bottom", position.bottom || "auto", "important");
      s.setProperty("width", "auto", "important");
      s.setProperty("height", "auto", "important");
      s.setProperty("opacity", opacity.toString(), "important");
      s.setProperty("color", isDarkBg ? "white" : "black", "important");

      if (input) {
        input.style.setProperty("color", isDarkBg ? "white" : "black", "important");
        input.style.setProperty("background", isDarkBg ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)", "important");
        input.style.setProperty("border", `1px solid ${themeColor}${isDarkBg ? "44" : "66"}`, "important");
      }
      if (button) {
        button.style.setProperty("background", `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`, "important");
        button.style.setProperty("box-shadow", `0 4px 12px ${themeColor}4d`, "important");
        button.style.setProperty("color", "white", "important"); // 送信ボタンは常に白文字
        button.style.setProperty("border", "1px solid rgba(255, 255, 255, 0.25)", "important");

        const svg = button.querySelector('svg');
        if (svg) svg.style.setProperty("color", "white", "important");
      }
    };

    // 初期値の読み込み
    chrome.storage.local.get(['inputOpacity', 'inputBgColor'], (result) => {
      const currentOpacity = result.inputOpacity !== undefined ? result.inputOpacity : 0.7;
      const currentColor = '#ff4b2b'; // デフォルトに固定
      const currentBgColor = result.inputBgColor || '#0f0f0f';
      applyStyles(currentOpacity, currentColor, currentBgColor);
    });

    // 設定変更の監視
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && (changes.inputOpacity || changes.inputBgColor)) {
        chrome.storage.local.get(['inputOpacity', 'inputBgColor'], (result) => {
          const currentOpacity = result.inputOpacity !== undefined ? result.inputOpacity : 0.7;
          const currentColor = '#ff4b2b'; // デフォルトに固定
          const currentBgColor = result.inputBgColor || '#0f0f0f';
          applyStyles(currentOpacity, currentColor, currentBgColor);
        });
      }
    });

    // ドラッグハンドル
    const handle = document.createElement("div");
    handle.title = "ドラッグして移動";
    handle.style.cssText = "width:12px;display:grid;grid-template-columns:1fr 1fr;gap:3px;cursor:grab;opacity:0.5;transition:opacity 0.2s;flex-shrink:0;";
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement("div");
      dot.style.cssText = "width:3px;height:3px;background:white;border-radius:50%;";
      handle.appendChild(dot);
    }
    handle.onmouseenter = () => { handle.style.opacity = "1"; };
    handle.onmouseleave = () => { handle.style.opacity = "0.5"; };

    // ドラッグロジック
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      handle.style.cursor = "grabbing";
      container.style.transform = "scale(1.02)";

      const rect = container.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;

      container.style.setProperty("left", `${startLeft}px`, "important");
      container.style.setProperty("top", `${startTop}px`, "important");
      container.style.setProperty("right", "auto", "important");
      container.style.setProperty("bottom", "auto", "important");
    });

    const moveHandler = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      container.style.setProperty("left", `${startLeft + dx}px`, "important");
      container.style.setProperty("top", `${startTop + dy}px`, "important");
    };

    const upHandler = () => {
      if (!dragging) return;
      dragging = false;
      handle.style.cursor = "grab";
      container.style.transform = "none";
    };

    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "コメントを入力...";
    input.style.cssText = `
      background: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 10px !important;
      padding: 8px 14px !important;
      font-size: 14px !important;
      width: 320px !important;
      outline: none !important;
      transition: background 0.2s, border-color 0.2s !important;
      font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    `;
    input.onfocus = () => {
      input.style.background = "rgba(255, 255, 255, 0.15) !important";
      input.style.borderColor = "rgba(255, 255, 255, 0.4) !important";
      container.style.opacity = "1";
    };
    input.onblur = () => {
      input.style.background = "rgba(255, 255, 255, 0.1) !important";
      input.style.borderColor = "rgba(255, 255, 255, 0.2) !important";
      chrome.storage.local.get(['inputOpacity'], (result) => {
        container.style.opacity = (result.inputOpacity !== undefined ? result.inputOpacity : 0.7).toString();
      });
    };

    const button = document.createElement("button");
    button.title = "送信 (Enter)";
    const bs = button.style;
    bs.setProperty("cursor", "pointer", "important");
    bs.setProperty("transition", "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", "important");
    bs.setProperty("white-space", "nowrap", "important");
    bs.setProperty("display", "flex", "important");
    bs.setProperty("align-items", "center", "important");
    bs.setProperty("gap", "6px", "important");
    bs.setProperty("letter-spacing", "0.3px", "important");
    bs.setProperty("font-weight", "700", "important");
    bs.setProperty("border-radius", "10px", "important");
    bs.setProperty("padding", "8px", "important"); // アイコンのみなので均等に
    bs.setProperty("font-size", "13px", "important");
    bs.setProperty("color", "white", "important");
    bs.setProperty("border", "1px solid rgba(255, 255, 255, 0.25)", "important");
    bs.setProperty("line-height", "0", "important"); // アイコンの垂直中央揃えのため

    // SVGを手動生成 (innerHTMLを避ける)
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "18"); // アイコンのみなので少し大きく
    svg.setAttribute("height", "18");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    // アイコン自体の微調整
    svg.style.display = "block";

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", "22"); line.setAttribute("y1", "2"); line.setAttribute("x2", "11"); line.setAttribute("y2", "13");
    svg.appendChild(line);

    const poly = document.createElementNS(svgNS, "polygon");
    poly.setAttribute("points", "22 2 15 22 11 13 2 9 22 2");
    svg.appendChild(poly);

    button.appendChild(svg);
    button.onmouseenter = () => {
      button.style.filter = "brightness(1.2) saturate(1.1)";
      button.style.transform = "translateY(-2px) scale(1.02)";
      button.style.boxShadow = (button.style.boxShadow || "").replace(/rgba?\(.*?\)/, (match) => match.replace(/0\.\d+/, "0.6"));
    };
    button.onmouseleave = () => {
      button.style.filter = "none";
      button.style.transform = "none";
      chrome.storage.local.get(['inputColor'], (result) => {
        const color = result.inputColor || '#ff4b2b';
        button.style.boxShadow = `0 4px 12px ${color}4d !important`;
      });
    };
    button.onmousedown = () => { button.style.transform = "translateY(1px) scale(0.96)"; };
    button.onmouseup = () => { button.style.transform = "translateY(-2px) scale(1.02)"; };

    let isSubmitting = false;

    const submit = async () => {
      if (isSubmitting) return;
      const content = input.value.trim();
      if (!content) return;

      const video = platform?.getActiveVideo();
      const videoId = platform?.getVideoId();
      if (!video || !videoId) return;

      const playback_time_ms = Math.floor(video.currentTime * 1000);

      const submitId = `${playback_time_ms}-${content}`;
      renderedCommentIds.add(submitId);
      displayComment(content);

      isSubmitting = true;
      button.disabled = true;
      button.style.opacity = "0.7";
      button.style.cursor = "wait";
      const btnText = button.querySelector('span');
      if (btnText) btnText.innerText = "•••";

      try {
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            video_id: videoId,
            playback_time_ms,
            content,
            user_name: "User"
          })
        });
        input.value = "";
      } catch (error) {
        // ignore
      } finally {
        isSubmitting = false;
        button.disabled = false;
        button.style.opacity = "1";
        button.style.cursor = "pointer";
        const btnText = button.querySelector('span');
        if (btnText) btnText.innerText = "送信";
        input.focus();
      }
    };

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      submit();
    });

    let isComposing = false;
    input.addEventListener("compositionstart", () => { isComposing = true; });
    input.addEventListener("compositionend", () => { setTimeout(() => isComposing = false, 10); });

    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter" && !isComposing) {
        submit();
      }
    });

    container.appendChild(handle);
    container.appendChild(input);
    container.appendChild(button);
    shadow.appendChild(container);
  }

  let lastProcessedTimeMs = -1;

  function init() {
    const platform = createPlatform();
    if (!platform) {
      return;
    }

    const video = platform.getActiveVideo();
    const player = platform.getPlayerElement(video);

    if (!video || !player) {
      setTimeout(init, 2000);
      return;
    }

    if (player.querySelector("#commentator-overlay") || document.getElementById("commentator-input-host")) return;

    createOverlay(player);
    createInputForm(player, platform.getInputPosition());

    let isProcessing = false;
    video.addEventListener("timeupdate", async () => {
      const videoId = platform.getVideoId();
      if (!videoId) {
        return;
      }

      if (isProcessing) return;
      isProcessing = true;

      if (videoId !== currentVideoId) {
        currentVideoId = videoId;
        comments = [];
        loadedChunks.clear();
        renderedCommentIds.clear();
        lastProcessedTimeMs = -1;
      }

      const currentTimeMs = Math.floor(video.currentTime * 1000);

      if (currentTimeMs < lastProcessedTimeMs - 500 || currentTimeMs > lastProcessedTimeMs + 5000) {
        renderedCommentIds.clear();
        lastProcessedTimeMs = currentTimeMs - 1;
      }

      await loadChunk(videoId, currentTimeMs);

      const upcoming = comments.filter(c =>
        c.playback_time_ms > lastProcessedTimeMs &&
        c.playback_time_ms <= currentTimeMs
      );

      upcoming.forEach(c => {
        const commentId = `${c.playback_time_ms}-${c.content}`;
        if (!renderedCommentIds.has(commentId)) {
          displayComment(c.content);
          renderedCommentIds.add(commentId);
        }
      });

      lastProcessedTimeMs = currentTimeMs;
      isProcessing = false;
    });

    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        document.getElementById("commentator-overlay")?.remove();
        document.getElementById("commentator-input-host")?.remove();
        setTimeout(init, 1000);
      }
    }).observe(document, { subtree: true, childList: true });
  }

  init();
}
