import { useEffect, RefObject } from "react";

type Options = { button?: 0 | 1 | 2 };

export function useDragScroll(
  ref: RefObject<HTMLElement>,
  opts: Options = { button: 0 }
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onPointerDown = (e: PointerEvent) => {
      // only start panning if the pointer is on the scroller background,
      // not on a draggable/card area
      const target = e.target as HTMLElement;
      if (target.closest("[data-dnd-area]") || 
          target.closest("button") || 
          target.closest("input") || 
          target.closest("select") ||
          target.closest("[data-draggable]")) {
        return;
      }

      if (opts.button !== undefined && e.button !== opts.button) return;

      isDown = true;
      el.setPointerCapture(e.pointerId);
      startX = e.clientX;
      scrollLeft = (el as HTMLElement).scrollLeft;
      (el as HTMLElement).style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      (el as HTMLElement).scrollLeft = scrollLeft - dx;
    };

    const onPointerUp = (e: PointerEvent) => {
      isDown = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      (el as HTMLElement).style.cursor = "";
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointerleave", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointerleave", onPointerUp);
    };
  }, [ref, opts.button]);
}
