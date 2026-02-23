import { Platform } from "./base";
import { YouTubePlatform } from "./youtube";
import { NetflixPlatform } from "./netflix";
import { AmazonPlatform } from "./amazon";

export function createPlatform(): Platform | null {
  const url = window.location.href;
  if (url.includes("youtube.com")) return new YouTubePlatform();
  if (url.includes("netflix.com")) return new NetflixPlatform();
  if (url.includes("amazon.co.jp") || url.includes("amazon.com")) return new AmazonPlatform();
  return null;
}
