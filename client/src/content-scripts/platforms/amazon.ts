import { BasePlatform } from "./base";

export class AmazonPlatform extends BasePlatform {
  getVideoId(): string | null {
    const url = window.location.href;
    const asinMatch = url.match(/\/(detail|watch|video|dp|product)\/([A-Z0-9]{10})/);
    if (asinMatch) return asinMatch[2];
    const gtiMatch = url.match(/[?&]gti=([^&]+)/);
    if (gtiMatch) return gtiMatch[1];
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("asin") || urlParams.get("titleId");
  }

  getActiveVideo(): HTMLVideoElement | null {
    const video =
      (document.querySelector(".rendererContainer video") as HTMLVideoElement | null) ||
      (document.querySelector(".watch-video video") as HTMLVideoElement | null);
    return video || this.getGenericVideo();
  }

  getPlayerElement(video?: HTMLVideoElement | null): HTMLElement | null {
    const v = video ?? this.getActiveVideo();
    return (
      (document.querySelector(".cascadesContainer") as HTMLElement | null) ||
      (document.querySelector("#dv-web-player") as HTMLElement | null) ||
      (document.querySelector("#native-player") as HTMLElement | null) ||
      (v?.parentElement?.parentElement as HTMLElement | null) ||
      null
    );
  }

}
