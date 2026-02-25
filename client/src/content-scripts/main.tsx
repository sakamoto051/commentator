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
    // html直下に配置し、fixedかつサイズ0で一切のレイアウト干渉を排除
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
      left: ${position.left || "auto"} !important;
      top: ${position.top || "auto"} !important;
      right: ${position.right || "auto"} !important;
      bottom: ${position.bottom || "auto"} !important;
      width: auto !important;
      height: auto !important;
      opacity: 0.9;
    `;

    // ドラッグハンドル (スタイリッシュなドットデザイン)
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
      container.style.opacity = "0.7";
    };

    const button = document.createElement("button");
    button.innerText = "送信";
    button.style.cssText = `
      background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%) !important;
      color: white !important;
      border: none !important;
      border-radius: 10px !important;
      padding: 8px 18px !important;
      cursor: pointer !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      transition: transform 0.2s, filter 0.2s !important;
      white-space: nowrap !important;
      box-shadow: 0 4px 12px rgba(255, 75, 43, 0.3) !important;
    `;
    button.onmouseenter = () => { button.style.filter = "brightness(1.1)"; button.style.transform = "translateY(-1px)"; };
    button.onmouseleave = () => { button.style.filter = "none"; button.style.transform = "none"; };
    button.onmousedown = () => { button.style.transform = "translateY(1px) scale(0.98)"; };
    button.onmouseup = () => { button.style.transform = "translateY(-1px)"; };

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
      button.innerText = "•••";

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
        button.innerText = "送信";
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

    // 初期透明度
    container.style.opacity = "0.7";
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
