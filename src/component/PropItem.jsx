/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";
import { FaTrashAlt, FaUndoAlt, FaExpandAlt } from "react-icons/fa";

function PropItem({
  prop,
  onUpdate,
  onDelete,
  containerWidth,
  containerHeight,
}) {
  const [position, setPosition] = useState(prop.position || { x: 100, y: 100 });
  const [size, setSize] = useState(prop.size || null);
  const [rotation, setRotation] = useState(prop.rotation || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const rotateStart = useRef({ x: 0, y: 0, angle: 0, startAngle: 0 });
  const propRef = useRef(null);

  // Sync state with prop changes (only when not actively interacting)
  useEffect(() => {
    if (!isDragging && !isResizing && !isRotating) {
      if (prop.position) setPosition(prop.position);
      if (prop.size) setSize(prop.size);
      if (prop.rotation !== undefined) setRotation(prop.rotation);
    }
  }, [
    prop.position,
    prop.size,
    prop.rotation,
    isDragging,
    isResizing,
    isRotating,
  ]);

  const handleImageLoad = (e) => {
    if (size) return;
    const img = e.target;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const maxWidth = containerWidth * 0.4;
    const maxHeight = containerHeight * 0.4;
    let width = naturalWidth;
    let height = naturalHeight;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    width *= scale;
    height *= scale;

    setSize({ width, height });
    onUpdate({ ...prop, size: { width, height }, position, rotation });
  };

  const handleMouseDown = (e, type) => {
    e.stopPropagation();
    e.preventDefault();

    if (type === "move") {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    } else if (type === "resize") {
      setIsResizing(true);
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      };
    } else if (type === "rotate") {
      setIsRotating(true);
      if (propRef.current) {
        const rect = propRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const startAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        rotateStart.current = {
          x: e.clientX,
          y: e.clientY,
          angle: rotation,
          startAngle: startAngle,
        };
      } else {
        rotateStart.current = {
          x: e.clientX,
          y: e.clientY,
          angle: rotation,
          startAngle: 0,
        };
      }
    }
  };

  useEffect(() => {
    const handleMove = (e) => {
      e.preventDefault();

      if (isDragging) {
        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;
        const maxX = containerWidth - size.width;
        const maxY = containerHeight - size.height;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        const newWidth = resizeStart.current.width + deltaX;
        const newHeight = resizeStart.current.height + deltaY;

        setSize({
          width: Math.max(40, Math.min(newWidth, containerWidth - position.x)),
          height: Math.max(
            40,
            Math.min(newHeight, containerHeight - position.y)
          ),
        });
      }

      if (isRotating && propRef.current) {
        const rect = propRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        // Calculate the difference from the starting angle and add it to the initial rotation
        const angleDelta = currentAngle - (rotateStart.current.startAngle || 0);
        setRotation(rotateStart.current.angle + angleDelta);
      }
    };

    const handleUp = () => {
      if (isDragging || isResizing || isRotating) {
        onUpdate({ ...prop, position, size, rotation });
      }
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    document.addEventListener("mousemove", handleMove, { passive: false });
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [
    isDragging,
    isResizing,
    isRotating,
    position,
    size,
    rotation,
    prop,
    onUpdate,
    containerWidth,
    containerHeight,
  ]);

  return (
    <div
      ref={propRef}
      className="absolute select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: size ? `${size.width}px` : "auto",
        height: size ? `${size.height}px` : "auto",
        cursor: isDragging ? "grabbing" : "move",
        zIndex: 20,
      }}
      onMouseDown={(e) => handleMouseDown(e, "move")}
    >
      {/* Inner wrapper (rotatable) */}
      <div
        className="relative"
        style={{
          width: "100%",
          height: "100%",
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center center",
        }}
      >
        <img
          src={prop.url}
          alt={prop.name}
          onLoad={handleImageLoad}
          style={{
            width: "100%",
            height: "100%",
            // objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
            display: "block",
          }}
          draggable={false}
        />

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center bg-pink-500 rounded-tl-full cursor-nwse-resize"
          onMouseDown={(e) => handleMouseDown(e, "resize")}
        >
          <FaExpandAlt color="white" size={12} />
        </div>

        {/* Rotate Handle */}
        <div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-6 h-6 flex items-center justify-center bg-yellow-500 rounded-full cursor-grab"
          onMouseDown={(e) => handleMouseDown(e, "rotate")}
        >
          <FaUndoAlt color="white" size={12} />
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(prop.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600"
        >
          <FaTrashAlt size={10} />
        </button>
      </div>
    </div>
  );
}

export default PropItem;
