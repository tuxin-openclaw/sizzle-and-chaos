import { useCallback, useEffect, useState } from "react";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

function getDocument(): FullscreenDocument {
  return document as FullscreenDocument;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0
  );
}

/**
 * Best-effort fullscreen for mobile browsers.
 *
 * Android Chrome/Edge support the Element Fullscreen API. iOS Safari does not
 * expose it for web pages, so the UI falls back to "Add to Home Screen"
 * instructions; installed PWAs launch without browser chrome.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const update = () => {
      const doc = getDocument();
      const element = document.documentElement as FullscreenElement;
      const fullscreenElement = doc.fullscreenElement ?? doc.webkitFullscreenElement;
      setIsFullscreen(Boolean(fullscreenElement));
      setStandalone(isStandaloneDisplay());
      setSupported(
        Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled || element.webkitRequestFullscreen),
      );
    };

    update();
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    standaloneQuery.addEventListener?.("change", update);
    return () => {
      document.removeEventListener("fullscreenchange", update);
      document.removeEventListener("webkitfullscreenchange", update);
      standaloneQuery.removeEventListener?.("change", update);
    };
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    if (typeof document === "undefined") return false;
    const doc = getDocument();
    if (doc.fullscreenElement || doc.webkitFullscreenElement) return true;
    if (isStandaloneDisplay()) return true;

    const element = document.documentElement as FullscreenElement;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else {
        return false;
      }
    } catch {
      return false;
    }

    try {
      const orientation = screen.orientation as LockableOrientation;
      await orientation?.lock?.("landscape");
    } catch {
      // Orientation locking is optional and unsupported in many browsers.
    }
    return true;
  }, []);

  const exit = useCallback(async (): Promise<void> => {
    const doc = getDocument();
    try {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    } catch {
      /* ignore */
    }
    try {
      (screen.orientation as LockableOrientation)?.unlock?.();
    } catch {
      /* ignore */
    }
  }, []);

  return { isFullscreen, standalone, supported, request, exit };
}
