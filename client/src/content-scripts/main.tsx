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
    document.getElementById("commentator-input-container")?.remove();

    const platform = createPlatform();

    const container = document.createElement("div");
    container.id = "commentator-input-container";
    container.style.position = "absolute";

    // プラットフォームごとの位置を適用
    if (position.top) container.style.top = position.top;
    if (position.bottom) container.style.bottom = position.bottom;
    if (position.right) container.style.right = position.right;
    if (position.left) container.style.left = position.left;

    container.style.zIndex = "2147483647";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "4px";
    container.style.background = "rgba(0, 0, 0, 0.7)";
    container.style.padding = "4px 6px";
    container.style.borderRadius = "6px";
    container.style.opacity = "0.8";
    container.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    container.style.pointerEvents = "auto";
    container.style.userSelect = "none";

    // ドラッグハンドル
    const handle = document.createElement("div");
    handle.title = "ドラッグして移動";
    handle.style.cssText = "width:8px;height:16px;cursor:grab;display:flex;flex-direction:column;justify-content:space-between;flex-shrink:0;";
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.style.cssText = "width:8px;height:2px;background:rgba(255,255,255,0.5);border-radius:1px;";
      handle.appendChild(dot);
    }

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

      // bottom/right → left/top に変換してドラッグ管理しやすくする
      const rect = container.getBoundingClientRect();
      const parentRect = playerElement.getBoundingClientRect();
      startLeft = rect.left - parentRect.left;
      startTop = rect.top - parentRect.top;
      startX = e.clientX;
      startY = e.clientY;

      container.style.left = `${startLeft}px`;
      container.style.top = `${startTop}px`;
      container.style.right = "";
      container.style.bottom = "";
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      container.style.left = `${startLeft + dx}px`;
      container.style.top = `${startTop + dy}px`;
    });

    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      handle.style.cursor = "grab";
    });

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "コメントを入力...";
    input.style.background = "white";
    input.style.color = "#333";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "3px";
    input.style.padding = "3px 7px";
    input.style.fontSize = "13px";
    input.style.width = "160px";

    const button = document.createElement("button");
    button.innerText = "送信";
    button.style.background = "#ff0000";
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "3px";
    button.style.padding = "3px 8px";
    button.style.cursor = "pointer";
    button.style.fontSize = "12px";

    let isSubmitting = false;

    const submit = async () => {
      if (isSubmitting) return;
      const content = input.value.trim();
      if (!content) return;

      const video = platform?.getActiveVideo();
      const videoId = platform?.getVideoId();
      if (!video || !videoId) return;

      const playback_time_ms = Math.floor(video.currentTime * 1000);

      // 重複描画防止
      const submitId = `${playback_time_ms}-${content}`;
      renderedCommentIds.add(submitId);
      displayComment(content);

      isSubmitting = true;
      button.disabled = true;
      button.innerText = "...";

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
        // エラーログ削除
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

    input.addEventListener("focus", () => { container.style.opacity = "1"; });
    input.addEventListener("blur", () => { container.style.opacity = "0.3"; });

    container.appendChild(handle);
    container.appendChild(input);
    container.appendChild(button);
    playerElement.appendChild(container);
  }

  let lastProcessedTimeMs = -1;

  function init() {
    const platform = createPlatform();
    if (!platform) {
      // 対応していないサイト
      return;
    }

    const video = platform.getActiveVideo();
    const player = platform.getPlayerElement(video);

    if (!video || !player) {
      setTimeout(init, 2000); // プレイヤーが出るまで少し長めにリトライ
      return;
    }

    if (player.querySelector("#commentator-overlay")) return;

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
        document.getElementById("commentator-input-container")?.remove();
        setTimeout(init, 1000);
      }
    }).observe(document, { subtree: true, childList: true });
  }

  init();
}
