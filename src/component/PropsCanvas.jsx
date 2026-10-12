/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import { FaExpandAlt, FaTrashAlt, FaUndoAlt } from "react-icons/fa";

const FRAME_RATIO = 2 / 3;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function fitSize(aspect, preferredWidth = 0.4) {
  const safeAspect = aspect > 0.05 ? aspect : 1;
  let w = preferredWidth;
  let h = (w * FRAME_RATIO) / safeAspect;
  if (h > 0.58) {
    h = 0.58;
    w = h * safeAspect * (1 / FRAME_RATIO);
  }
  w = clamp(w, 0.12, 1);
  h = clamp(h, 0.08, 1);
  return { w, h };
}

function placeInFrame(w, h, index) {
  const step = (index % 5) * 0.04;
  const x = clamp((1 - w) / 2 + (index % 2 === 0 ? step : -step * 0.4), 0, 1 - w);
  const y = clamp((1 - h) / 2 + step * 0.55, 0, 1 - h);
  return { x, y };
}

function applyScale(orig, scale, boxWidth) {
  const minW = Math.min(orig.w, 72 / Math.max(boxWidth, 1));
  const maxScale = Math.min(1 / orig.w, 1 / orig.h);
  const minScale = Math.min(maxScale, minW / orig.w);
  const nextScale = clamp(scale, minScale, maxScale);
  const w = orig.w * nextScale;
  const h = orig.h * nextScale;
  let cx = orig.x + orig.w / 2;
  let cy = orig.y + orig.h / 2;
  cx = clamp(cx, w / 2, 1 - w / 2);
  cy = clamp(cy, h / 2, 1 - h / 2);
  return {
    x: cx - w / 2,
    y: cy - h / 2,
    w,
    h,
  };
}

function PropsCanvas({ items, selectedId, onItemsChange, onSelect }) {
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const onItemsChangeRef = useRef(onItemsChange);
  const onSelectRef = useRef(onSelect);
  onItemsChangeRef.current = onItemsChange;
  onSelectRef.current = onSelect;

  useEffect(() => {
    const onMove = (event) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (event.pointerType === "mouse" && event.buttons === 0) {
        dragRef.current = null;
        return;
      }
      event.preventDefault();

      if (drag.type === "move") {
        const dx = (event.clientX - drag.startX) / drag.box.width;
        const dy = (event.clientY - drag.startY) / drag.box.height;
        onItemsChangeRef.current((prev) =>
          prev.map((item) =>
            item.id === drag.id
              ? {
                  ...item,
                  x: clamp(drag.orig.x + dx, 0, 1 - drag.orig.w),
                  y: clamp(drag.orig.y + dy, 0, 1 - drag.orig.h),
                }
              : item
          )
        );
        return;
      }

      if (drag.type === "resize") {
        const dist =
          Math.hypot(event.clientX - drag.center.x, event.clientY - drag.center.y) ||
          1;
        const next = applyScale(drag.orig, dist / drag.startDist, drag.box.width);
        onItemsChangeRef.current((prev) =>
          prev.map((item) => (item.id === drag.id ? { ...item, ...next } : item))
        );
        return;
      }

      if (drag.type === "rotate") {
        const angle = Math.atan2(
          event.clientY - drag.center.y,
          event.clientX - drag.center.x
        );
        const rotation =
          drag.orig.rotation + ((angle - drag.startAngle) * 180) / Math.PI;
        onItemsChangeRef.current((prev) =>
          prev.map((item) =>
            item.id === drag.id ? { ...item, rotation } : item
          )
        );
      }
    };

    const onUp = (event) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const bringToFront = (id) => {
    onItemsChangeRef.current((prev) => {
      const maxZ = prev.reduce((max, item) => Math.max(max, item.z || 0), 0);
      return prev.map((item) =>
        item.id === id ? { ...item, z: maxZ + 1 } : item
      );
    });
    onSelectRef.current(id);
  };

  const onPropPointerDown = (item, event) => {
    if (dragRef.current) return;
    const handle = event.target.closest?.("[data-handle]")?.dataset.handle;
    event.stopPropagation();
    event.preventDefault();

    if (handle === "delete") {
      dragRef.current = null;
      onSelectRef.current(null);
      onItemsChangeRef.current((prev) => prev.filter((entry) => entry.id !== item.id));
      return;
    }

    if (!item.aspect || !item.h) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    bringToFront(item.id);
    const box = rootRef.current?.getBoundingClientRect();
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!box?.width || !bounds.width) return;

    const center = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
    dragRef.current = {
      pointerId: event.pointerId,
      id: item.id,
      type: handle || "move",
      startX: event.clientX,
      startY: event.clientY,
      orig: {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        rotation: item.rotation || 0,
      },
      box,
      center,
      startDist: Math.hypot(event.clientX - center.x, event.clientY - center.y) || 1,
      startAngle: Math.atan2(event.clientY - center.y, event.clientX - center.x),
    };
  };

  const onImageLoad = (item, event) => {
    if (item.aspect) return;
    const aspect = event.currentTarget.naturalWidth / event.currentTarget.naturalHeight;
    if (!aspect) return;
    const { w, h } = fitSize(aspect, item.w || 0.4);
    const placed = placeInFrame(w, h, item.jitterIndex || 0);
    onItemsChangeRef.current((prev) =>
      prev.map((entry) =>
        entry.id === item.id && !entry.aspect
          ? { ...entry, aspect, w, h, ...placed }
          : entry
      )
    );
  };

  const ordered = [...items].sort((a, b) => (a.z || 0) - (b.z || 0));

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      style={{ touchAction: "none" }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onSelectRef.current(null);
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {ordered.map((item) => {
        const selected = item.id === selectedId;
        return (
          <div
            key={item.id}
            className="absolute select-none"
            style={{
              left: `${item.x * 100}%`,
              top: `${item.y * 100}%`,
              width: `${item.w * 100}%`,
              height: `${(item.h || item.w) * 100}%`,
              transform: `rotate(${item.rotation || 0}deg)`,
              transformOrigin: "center center",
              zIndex: item.z || 1,
              touchAction: "none",
              opacity: item.aspect ? 1 : 0,
            }}
            onPointerDown={(event) => onPropPointerDown(item, event)}
          >
            <img
              src={item.src}
              alt={item.name}
              draggable={false}
              onLoad={(event) => onImageLoad(item, event)}
              className="block w-full h-full pointer-events-none"
              style={{ objectFit: "contain" }}
            />
            {selected && item.aspect && (
              <>
                <button
                  type="button"
                  data-handle="rotate"
                  aria-label={`Rotate ${item.name}`}
                  className="absolute z-10 flex items-center justify-center rounded-full bg-white text-[#FF5900] shadow-md"
                  style={{
                    width: 32,
                    height: 32,
                    top: 0,
                    left: "50%",
                    transform: "translate(-50%, -70%)",
                    touchAction: "none",
                  }}
                >
                  <FaUndoAlt size={13} />
                </button>
                <button
                  type="button"
                  data-handle="delete"
                  aria-label={`Remove ${item.name}`}
                  className="absolute z-10 flex items-center justify-center rounded-full bg-white text-[#FF5900] shadow-md"
                  style={{
                    width: 32,
                    height: 32,
                    top: 0,
                    right: 0,
                    transform: "translate(40%, -40%)",
                    touchAction: "none",
                  }}
                >
                  <FaTrashAlt size={12} />
                </button>
                <button
                  type="button"
                  data-handle="resize"
                  aria-label={`Resize ${item.name}`}
                  className="absolute z-10 flex items-center justify-center rounded-full bg-white text-[#FF5900] shadow-md"
                  style={{
                    width: 32,
                    height: 32,
                    right: 0,
                    bottom: 0,
                    transform: "translate(40%, 40%)",
                    touchAction: "none",
                  }}
                >
                  <FaExpandAlt size={12} />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { fitSize, placeInFrame };
export default PropsCanvas;
