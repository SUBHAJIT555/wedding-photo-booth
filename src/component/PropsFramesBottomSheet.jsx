import { memo } from "react";
import { motion } from "framer-motion";
import BottomSheet from "./BottomSheet";
import { props as availableProps, frames } from "../constant/propsAndFrames";
import { IoCheckmarkCircle } from "react-icons/io5";

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

      {/* Content */}
      <div className="overflow-y-auto flex-1 px-4 -mx-4">
        {activeTab === "props" ? (
          <div className="overflow-y-auto flex-1 px-4 -mx-4 h-[350px]">
            <div className="grid grid-cols-3 gap-5 p-4">
              {availableProps &&
                availableProps.map((prop, index) => {
                  const isSelected = isPropSelected(prop);
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
                        src={prop.url}
                        alt={prop.name}
                        className="object-contain mb-2 w-full h-20 md:h-24"
                      />
                      <span
                        className={`text-xs text-center font-krylon ${
                          isSelected
                            ? "text-[#e91e63] font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {prop.name}
                      </span>
                    </motion.button>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 p-4">
            {frames &&
              frames.map((frame, index) => {
                const isSelected = selectedFrame?.id === frame.id;
                return (
                  <motion.button
                    key={frame.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      isSelected ? onRemoveFrame() : onApplyFrame(frame)
                    }
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
                      src={frame.url}
                      alt={frame.name}
                      className="object-contain mb-2 w-full h-24 rounded-lg md:h-32"
                    />
                    <span
                      className={`text-xs md:text-sm text-center font-krylon ${
                        isSelected
                          ? "text-[#e91e63] font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {frame.name}
                    </span>
                  </motion.button>
                );
              })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
});

export default PropsFramesBottomSheet;
