import { BasePlatform } from "./base";

export class AmazonPlatform extends BasePlatform {
  getVideoId(): string | null {
    const url = window.location.href;
    // ASIN 抽出: /dp/B0..., /gp/video/detail/B0..., /watch/B0... などをカバー
    const asinMatch = url.match(/\/(detail|watch|video|dp|product|gp\/video\/detail)\/([A-Z0-9]{10})/);
    if (asinMatch) return asinMatch[2];

    // gti (Global Title Id) 抽出
    const gtiMatch = url.match(/[?&]gti=([^&]+)/);
    if (gtiMatch) return gtiMatch[1];

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("asin") || urlParams.get("titleId") || urlParams.get("gti");
  }

  getActiveVideo(): HTMLVideoElement | null {
    // Amazon の複数のプレイヤー構造に対応
    const video =
      (document.querySelector(".rendererContainer video") as HTMLVideoElement | null) ||
      (document.querySelector(".webPlayerContainer video") as HTMLVideoElement | null) ||
      (document.querySelector(".scalingVideoContainer video") as HTMLVideoElement | null) ||
      (document.querySelector(".watch-video video") as HTMLVideoElement | null) ||
      (document.querySelector("#native-video") as HTMLVideoElement | null);

    return video || this.getGenericVideo();
  }

  getPlayerElement(video?: HTMLVideoElement | null): HTMLElement | null {
    const v = video ?? this.getActiveVideo();
    return (
      (document.querySelector(".cascadesContainer") as HTMLElement | null) ||
      (document.querySelector(".webPlayerContainer") as HTMLElement | null) ||
      (document.querySelector(".scalingVideoContainer") as HTMLElement | null) ||
      (document.querySelector("#dv-web-player") as HTMLElement | null) ||
      (document.querySelector("#native-player") as HTMLElement | null) ||
      (v?.parentElement?.parentElement as HTMLElement | null) ||
      null
    );
  }
}
