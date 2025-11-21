import { memo, useEffect, useMemo, useRef } from "react";
import Sheet from "./Sheet";
import { props as availableProps, frames } from "../constant/propsAndFrames";
import { IoCheckmarkCircle } from "react-icons/io5";
import PropTypes from "prop-types";

// ===== Drag Scroll Helper (works on Raspberry Pi Chromium) =====
function enableDragScroll(el) {
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

// ===== Memoized Prop Item =====
const PropItem = memo(function PropItem({ prop, isSelected, onToggleProp }) {
  return (
    <button
      key={prop.id}
      onClick={() => onToggleProp(prop)}
      className={`relative flex flex-col items-center p-3 rounded-xl ${
        isSelected
          ? "bg-gradient-to-br from-[#e91e63]/10 to-[#f06292]/10 border-2 border-[#e91e63] shadow-md"
          : "bg-white border-2 border-gray-200 hover:border-[#e91e63]/50 hover:shadow-md"
      }`}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#e91e63] to-[#f06292] rounded-full flex items-center justify-center shadow-lg z-10">
          <IoCheckmarkCircle className="text-sm text-white" />
        </div>
      )}
      <img
        src={prop.urlSmall}
        alt={prop.name}
        className="object-contain mb-2 w-full h-20 md:h-24"
      />
      <span
        className={`text-xs text-center font-krylon ${
          isSelected ? "text-[#e91e63] font-semibold" : "text-gray-700"
        }`}
      >
        {prop.name}
      </span>
    </button>
  );
});

// ===== Memoized Frame Item =====
const FrameItem = memo(function FrameItem({
  frame,
  isSelected,
  onApplyFrame,
  onRemoveFrame,
}) {
  return (
    <button
      key={frame.id}
      onClick={() => (isSelected ? onRemoveFrame() : onApplyFrame(frame))}
      className={`relative flex flex-col items-center p-2 rounded-xl ${
        isSelected
          ? "bg-gradient-to-br from-[#e91e63]/10 to-[#f06292]/10 border-2 border-[#e91e63] shadow-lg"
          : "bg-white border-2 border-gray-200 hover:border-[#e91e63]/50 hover:shadow-md"
      }`}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-[#e91e63] to-[#f06292] rounded-full flex items-center justify-center shadow-lg z-10">
          <IoCheckmarkCircle className="text-xs text-white md:text-base" />
        </div>
      )}
      <img
        src={frame.urlSmall}
        alt={frame.name}
        className="object-contain mb-2 w-full h-24 rounded-lg md:h-32"
      />
      <span
        className={`text-xs md:text-sm text-center font-krylon ${
          isSelected ? "text-[#e91e63] font-semibold" : "text-gray-700"
        }`}
      >
        {frame.name}
      </span>
    </button>
  );
});

PropItem.propTypes = {
  prop: PropTypes.object,
  isSelected: PropTypes.bool,
  onToggleProp: PropTypes.func,
};

FrameItem.propTypes = {
  frame: PropTypes.object,
  isSelected: PropTypes.bool,
  onApplyFrame: PropTypes.func,
  onRemoveFrame: PropTypes.func,
};

// ===== Bottom Sheet Component =====
const PropsFramesBottomSheet = memo(function PropsFramesBottomSheet({
  isOpen,
  capturedImage,
  activeTab,
  selectedFrame,
  onClose,
  onTabChange,
  onToggleProp,
  onApplyFrame,
  onRemoveFrame,
  isPropSelected,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) enableDragScroll(scrollRef.current);
  }, [activeTab]);

  const propsList = useMemo(
    () =>
      availableProps.map((prop, index) => (
        <PropItem
          key={prop.id}
          prop={prop}
          index={index}
          isSelected={isPropSelected(prop)}
          onToggleProp={onToggleProp}
        />
      )),
    [isPropSelected, onToggleProp]
  );

  const framesList = useMemo(
    () =>
      frames.map((frame, index) => (
        <FrameItem
          key={frame.id}
          frame={frame}
          index={index}
          isSelected={selectedFrame?.id === frame.id}
          onApplyFrame={onApplyFrame}
          onRemoveFrame={onRemoveFrame}
        />
      )),
    [selectedFrame, onApplyFrame, onRemoveFrame]
  );

  return (
    <Sheet
      side="top"
      isOpen={isOpen && capturedImage}
      onClose={onClose}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <div className="flex gap-2 p-1 mb-4 bg-gray-100 rounded-2xl">
        <button
          onClick={() => onTabChange("props")}
          className={`flex-1 py-3 px-4 rounded-xl ${
            activeTab === "props" ? "bg-[#e91e63] text-white" : "bg-gray-200"
          }`}
        >
          Props
        </button>
        <button
          onClick={() => onTabChange("frames")}
          className={`flex-1 py-3 px-4 rounded-xl ${
            activeTab === "frames" ? "bg-[#e91e63] text-white" : "bg-gray-200"
          }`}
        >
          Frames
        </button>
      </div>

      <div className="flex-1 px-2">
        {activeTab === "props" && (
          <div
            ref={scrollRef}
            className="h-[720px] overflow-y-auto bg-white rounded-xl p-2 hide-scrollbar"
            style={{ cursor: "grab", WebkitOverflowScrolling: "touch" }}
          >
            <div className="grid grid-cols-3 gap-10">{propsList}</div>
          </div>
        )}
        {activeTab === "frames" && (
          <div className="grid grid-cols-3 gap-4 p-2">{framesList}</div>
        )}
      </div>
    </Sheet>
  );
});

PropsFramesBottomSheet.propTypes = {
  isOpen: PropTypes.bool,
  capturedImage: PropTypes.string,
  activeTab: PropTypes.string,
  selectedFrame: PropTypes.object,
  onClose: PropTypes.func,
  onTabChange: PropTypes.func,
  onToggleProp: PropTypes.func,
  onApplyFrame: PropTypes.func,
  onRemoveFrame: PropTypes.func,
  isPropSelected: PropTypes.func,
};

export default PropsFramesBottomSheet;
