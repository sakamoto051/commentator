import { BasePlatform } from "./base";

export class NetflixPlatform extends BasePlatform {
  getVideoId(): string | null {
    const match = window.location.href.match(/\/watch\/(\d+)/);
    return match ? match[1] : null;
  }

  getActiveVideo(): HTMLVideoElement | null {
    return this.getGenericVideo();
  }

  getPlayerElement(video?: HTMLVideoElement | null): HTMLElement | null {
    const v = video ?? this.getActiveVideo();
    return (
      (document.querySelector(".watch-video") as HTMLElement | null) ||
      (v?.parentElement?.parentElement as HTMLElement | null) ||
      null
    );
  }

}
