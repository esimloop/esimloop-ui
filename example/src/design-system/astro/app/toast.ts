/**
 * Minimal toast queue. Import in a client script:
 *
 *   import { toast } from "../design-system/astro/app/toast";
 *   toast({ title: "Saved", text: "Your changes are live.", tone: "success" });
 *
 * Requires <ToastHost /> on the page. Markup mirrors .ds-toast so a toast looks
 * identical whether it is rendered server-side or raised here.
 */
export type ToastTone = "success" | "error" | "info";

export interface ToastOptions {
  title: string;
  text?: string;
  tone?: ToastTone;
  /** Milliseconds before it dismisses itself. 0 keeps it until dismissed. */
  duration?: number;
}

const MARK: Record<ToastTone, string> = {
  success: "check",
  error: "warn",
  info: "info",
};

function region(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-ds-toasts]");
}

function icon(name: string): string {
  return '<svg class="ds-icon ds-icon--sm" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
}

export function toast({ title, text, tone = "info", duration = 5000 }: ToastOptions): () => void {
  const host = region();
  if (!host) {
    // Better a console line than a silently swallowed message.
    console.warn("toast(): no <ToastHost /> on this page.");
    return () => {};
  }

  const el = document.createElement("div");
  el.className = "ds-toast ds-toast--" + tone;
  el.innerHTML =
    '<span class="ds-toast__mark">' + icon(MARK[tone]) + "</span>" +
    '<div class="ds-toast__body">' +
    '<div class="ds-toast__title"></div>' +
    (text ? '<div class="ds-toast__text"></div>' : "") +
    "</div>" +
    '<button class="ds-btn ds-btn--xs ds-btn--ghost ds-btn--square" type="button" aria-label="Dismiss">' +
    icon("x") +
    "</button>";

  // Text goes through textContent, never innerHTML: a toast often carries a
  // value the user typed.
  el.querySelector(".ds-toast__title")!.textContent = title;
  if (text) el.querySelector(".ds-toast__text")!.textContent = text;

  let closed = false;
  const dismiss = () => {
    if (closed) return;
    closed = true;
    el.dataset.leaving = "";
    const remove = () => el.remove();
    el.addEventListener("animationend", remove, { once: true });
    setTimeout(remove, 400); // reduced-motion disables the animation
  };

  el.querySelector("button")!.addEventListener("click", dismiss);
  host.append(el);
  if (duration > 0) setTimeout(dismiss, duration);

  return dismiss;
}
