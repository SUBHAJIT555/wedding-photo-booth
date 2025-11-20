import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BottomSheet from "./BottomSheet";
import { props as availableProps, frames } from "../constant/propsAndFrames";
import { IoCheckmarkCircle } from "react-icons/io5";
import PropTypes from "prop-types";

// Memoized Prop Item Component
const PropItem = memo(function PropItem({
  prop,
  index,
  isSelected,
  onToggleProp,
}) {
  return (
    <motion.button
      key={prop.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onToggleProp(prop)}
      className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
        isSelected
          ? "bg-gradient-to-br from-[#e91e63]/10 to-[#f06292]/10 border-2 border-[#e91e63] shadow-md"
          : "bg-white border-2 border-gray-200 hover:border-[#e91e63]/50 hover:shadow-md"
      }`}
      style={
        isSelected
          ? {
              boxShadow: "0 4px 12px rgba(233, 30, 99, 0.2)",
            }
          : {}
      }
    >
      {/* Checkmark Badge */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#e91e63] to-[#f06292] rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <IoCheckmarkCircle className="text-sm text-white" />
        </motion.div>
      )}
      <img
        src={prop.thumbnail}
        alt={prop.name}
        loading="eager"
        className="object-contain mb-2 w-full h-20 md:h-24"
        decoding="async"
      />
      <span
        className={`text-xs text-center font-krylon ${
          isSelected ? "text-[#e91e63] font-semibold" : "text-gray-700"
        }`}
      >
        {prop.name}
      </span>
    </motion.button>
  );
});

PropItem.propTypes = {
  prop: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggleProp: PropTypes.func.isRequired,
};

// Memoized Frame Item Component
const FrameItem = memo(function FrameItem({
  frame,
  index,
  isSelected,
  onApplyFrame,
  onRemoveFrame,
}) {
  return (
    <motion.button
      key={frame.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => (isSelected ? onRemoveFrame() : onApplyFrame(frame))}
      className={`relative flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
        isSelected
          ? "bg-gradient-to-br from-[#e91e63]/10 to-[#f06292]/10 border-2 border-[#e91e63] shadow-lg"
          : "bg-white border-2 border-gray-200 hover:border-[#e91e63]/50 hover:shadow-md"
      }`}
      style={
        isSelected
          ? {
              boxShadow: "0 6px 20px rgba(233, 30, 99, 0.3)",
            }
          : {}
      }
    >
      {/* Checkmark Badge */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-[#e91e63] to-[#f06292] rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <IoCheckmarkCircle className="text-xs text-white md:text-base" />
        </motion.div>
      )}
      <img
        src={frame.thumbnail}
        alt={frame.name}
        loading="eager"
        className="object-contain mb-2 w-full h-24 rounded-lg md:h-32"
        decoding="async"
      />
      <span
        className={`text-xs md:text-sm text-center font-krylon ${
          isSelected ? "text-[#e91e63] font-semibold" : "text-gray-700"
        }`}
      >
        {frame.name}
      </span>
    </motion.button>
  );
});

FrameItem.propTypes = {
  frame: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onApplyFrame: PropTypes.func.isRequired,
  onRemoveFrame: PropTypes.func.isRequired,
};

// Image preloading utility
const preloadImages = (imageUrls) => {
  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

const PropsFramesBottomSheet = memo(function PropsFramesBottomSheet({
  isOpen,
  capturedImage,
  activeTab,
  selectedFrame,
  //   selectedProps,
  onClose,
  onTabChange,
  onToggleProp,
  onApplyFrame,
  onRemoveFrame,
  isPropSelected,
}) {
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // Reset preload state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setImagesPreloaded(false);
    }
  }, [isOpen]);

  // Preload all images when the sheet opens
  useEffect(() => {
    if (isOpen && capturedImage && !imagesPreloaded) {
      // Preload all prop thumbnails
      const propThumbnails = availableProps.map((prop) => prop.thumbnail);
      // Preload all frame thumbnails
      const frameThumbnails = frames.map((frame) => frame.thumbnail);

      // Preload images in batches to avoid blocking
      const allThumbnails = [...propThumbnails, ...frameThumbnails];

      // Preload in smaller batches with a slight delay to prevent UI blocking
      const batchSize = 10;
      let currentIndex = 0;

      const preloadBatch = () => {
        const batch = allThumbnails.slice(
          currentIndex,
          currentIndex + batchSize
        );
        preloadImages(batch);
        currentIndex += batchSize;

        if (currentIndex < allThumbnails.length) {
          // Use requestIdleCallback if available, otherwise setTimeout
          if (window.requestIdleCallback) {
            requestIdleCallback(preloadBatch, { timeout: 100 });
          } else {
            setTimeout(preloadBatch, 50);
          }
        } else {
          setImagesPreloaded(true);
        }
      };

      // Start preloading
      if (window.requestIdleCallback) {
        requestIdleCallback(preloadBatch, { timeout: 100 });
      } else {
        setTimeout(preloadBatch, 0);
      }
    }
  }, [isOpen, capturedImage, imagesPreloaded]);

  // Memoize the props list to prevent unnecessary re-renders
  const propsList = useMemo(() => {
    return availableProps.map((prop, index) => (
      <PropItem
        key={prop.id}
        prop={prop}
        index={index}
        isSelected={isPropSelected(prop)}
        onToggleProp={onToggleProp}
      />
    ));
  }, [isPropSelected, onToggleProp]);

  // Memoize the frames list to prevent unnecessary re-renders
  const framesList = useMemo(() => {
    return frames.map((frame, index) => (
      <FrameItem
        key={frame.id}
        frame={frame}
        index={index}
        isSelected={selectedFrame?.id === frame.id}
        onApplyFrame={onApplyFrame}
        onRemoveFrame={onRemoveFrame}
      />
    ));
  }, [selectedFrame, onApplyFrame, onRemoveFrame]);

  return (
    <BottomSheet
      isOpen={isOpen && capturedImage}
      onClose={onClose}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      {/* Tabs */}
      <div className="flex gap-2 p-1 mb-4 bg-gray-100 rounded-2xl">
        <motion.button
          onClick={() => onTabChange("props")}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 py-3 px-4 text-center font-krylon text-base md:text-lg rounded-xl transition-all duration-300 ${
            activeTab === "props"
              ? "bg-gradient-to-r from-[#e91e63] to-[#f06292] text-white shadow-lg"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
          style={
            activeTab === "props"
              ? {
                  boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)",
                }
              : {}
          }
        >
          Props
        </motion.button>
        <motion.button
          onClick={() => onTabChange("frames")}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 py-3 px-4 text-center font-krylon text-base md:text-lg rounded-xl transition-all duration-300 ${
            activeTab === "frames"
              ? "bg-gradient-to-r from-[#e91e63] to-[#f06292] text-white shadow-lg"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
          style={
            activeTab === "frames"
              ? {
                  boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)",
                }
              : {}
          }
        >
          Frames
        </motion.button>
      </div>

      {/* Content - Keep both tabs mounted but hidden for instant switching */}
      <div className="overflow-y-auto flex-1 px-4 -mx-4">
        {/* Props Tab */}
        <div
          className={`overflow-y-auto flex-1 px-4 -mx-4 h-[350px] ${
            activeTab === "props" ? "block" : "hidden"
          }`}
        >
          <div className="grid grid-cols-3 gap-5 p-4">{propsList}</div>
        </div>

        {/* Frames Tab */}
        <div
          className={`grid grid-cols-3 gap-5 p-4 ${
            activeTab === "frames" ? "block" : "hidden"
          }`}
        >
          {framesList}
        </div>
      </div>
    </BottomSheet>
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
