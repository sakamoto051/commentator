export interface Platform {
  getVideoId(): string | null;
  getPlayerElement(video?: HTMLVideoElement | null): HTMLElement | null;
  getActiveVideo(): HTMLVideoElement | null;
  getInputPosition(): {
    top?: string;
    bottom?: string;
    right?: string;
    left?: string;
  };
}

export abstract class BasePlatform implements Platform {
  abstract getVideoId(): string | null;
  abstract getPlayerElement(video?: HTMLVideoElement | null): HTMLElement | null;
  abstract getActiveVideo(): HTMLVideoElement | null;
  getInputPosition(): {
    top?: string;
    bottom?: string;
    right?: string;
    left?: string;
  } {
    return { bottom: "80px", right: "20px" };
  }

  protected getGenericVideo(): HTMLVideoElement | null {
    const videos = Array.from(document.querySelectorAll("video"));
    if (videos.length === 0) return null;
    if (videos.length === 1) return videos[0];

    return (
      videos.find((v) => !v.paused && v.readyState >= 2) ||
      videos.find((v) => v.offsetWidth > 0 && v.offsetHeight > 0) ||
      videos[0] ||
      null
    );
  }
}
