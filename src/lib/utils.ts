import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function scrollToBottom(element: HTMLElement) {
  element.scrollTop = element.scrollHeight;
}

export function isIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function postMessageToParent(data: { type: string; [key: string]: unknown }) {
  if (isIframe() && window.parent) {
    window.parent.postMessage(data, "*");
  }
}
