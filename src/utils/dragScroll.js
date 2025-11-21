// utils/dragScroll.js
export function enableDragScroll(el) {
  let pos = { top: 0, y: 0 };
  let isDragging = false;

  const mouseDown = (e) => {
    isDragging = true;
    pos = { top: el.scrollTop, y: e.clientY };
    el.style.cursor = "grabbing";
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mouseup", mouseUp);
  };

  const mouseMove = (e) => {
    if (!isDragging) return;
    const dy = e.clientY - pos.y;
    el.scrollTop = pos.top - dy;
  };

  const mouseUp = () => {
    isDragging = false;
    el.style.cursor = "grab";
    document.removeEventListener("mousemove", mouseMove);
    document.removeEventListener("mouseup", mouseUp);
  };

  el.addEventListener("mousedown", mouseDown);
}
