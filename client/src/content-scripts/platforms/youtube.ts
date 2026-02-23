import { BasePlatform } from "./base";

export class YouTubePlatform extends BasePlatform {
  getVideoId(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v");
  }

  getActiveVideo(): HTMLVideoElement | null {
    const video = document.querySelector(".html5-main-video") as HTMLVideoElement | null;
    return video || this.getGenericVideo();
  }

  getPlayerElement(video?: HTMLVideoElement | null): HTMLElement | null {
    const v = video ?? this.getActiveVideo();
    return (
      (document.querySelector(".html5-video-player") as HTMLElement | null) ||
      v?.closest(".html5-video-container") as HTMLElement | null ||
      v?.parentElement as HTMLElement | null ||
      null
    );
  }

}
