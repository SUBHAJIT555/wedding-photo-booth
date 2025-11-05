/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";

function PropItem({
  prop,
  onUpdate,
  onDelete,
  containerWidth,
  containerHeight,
}) {
  const [position, setPosition] = useState(prop.position || { x: 0, y: 0 });
  const [size, setSize] = useState(prop.size || { width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const propRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.classList.contains("resize-handle")) {
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      });
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    // Use refs to track current values without causing re-renders
    const currentPositionRef = { ...position };
    const currentSizeRef = { ...size };

    const handleMove = (clientX, clientY) => {
      if (isDragging) {
        const newX = clientX - dragStart.x;
        const newY = clientY - dragStart.y;

        // Constrain to container bounds
        const maxX = containerWidth - currentSizeRef.width;
        const maxY = containerHeight - currentSizeRef.height;

        currentPositionRef.x = Math.max(0, Math.min(newX, maxX));
        currentPositionRef.y = Math.max(0, Math.min(newY, maxY));

        setPosition({ ...currentPositionRef });
      } else if (isResizing) {
        const deltaX = clientX - resizeStart.x;
        const deltaY = clientY - resizeStart.y;
        const scale = Math.max(0.5, Math.min(3, 1 + (deltaX + deltaY) / 200));

        const newWidth = resizeStart.width * scale;
        const newHeight = resizeStart.height * scale;

        // Ensure it doesn't go outside bounds
        const maxWidth = containerWidth - currentPositionRef.x;
        const maxHeight = containerHeight - currentPositionRef.y;

        currentSizeRef.width = Math.min(newWidth, maxWidth);
        currentSizeRef.height = Math.min(newHeight, maxHeight);

        setSize({ ...currentSizeRef });
      }
    };

    const handleMouseMove = (e) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        onUpdate({
          ...prop,
          position: { ...currentPositionRef },
          size: { ...currentSizeRef },
        });
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    const handleTouchEnd = () => {
      handleMouseUp();
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDragging,
    isResizing,
    dragStart,
    resizeStart,
    containerWidth,
    containerHeight,
    prop,
    onUpdate,
  ]);

  return (
    <div
      ref={propRef}
      className="absolute cursor-move pointer-events-auto select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 10,
        transform: "translate(0, 0)",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (e.target.classList.contains("resize-handle")) {
          setIsResizing(true);
          setResizeStart({
            x: touch.clientX,
            y: touch.clientY,
            width: size.width,
            height: size.height,
          });
        } else {
          setIsDragging(true);
          setDragStart({
            x: touch.clientX - position.x,
            y: touch.clientY - position.y,
          });
        }
        e.preventDefault();
      }}
    >
      <img
        src={prop.url}
        alt={prop.name}
        className="object-contain w-full h-full pointer-events-none"
        draggable={false}
      />
      {/* Resize handle */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-6 h-6 bg-[#e91e63] rounded-tl-full cursor-nwse-resize"
        style={{ touchAction: "none" }}
      />
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(prop.id);
        }}
        className="flex absolute -top-2 -right-2 justify-center items-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full hover:bg-red-600"
      >
        ×
      </button>
    </div>
  );
}

export default PropItem;
