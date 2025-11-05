/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function BottomSheet({ isOpen, onClose, activeTab, onTabChange, children }) {
  // activeTab and onTabChange are kept for API consistency
  void activeTab;
  void onTabChange;
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleTouchStart = (e) => {
      if (e.target.closest(".bottom-sheet-content")) return;
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    };

    const handleTouchMove = (e) => {
      if (!isDragging.current) return;
      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      // Only allow dragging down (positive deltaY)
      if (deltaY > 0) {
        setDragY(deltaY);
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      // If dragged down more than 100px, close the sheet
      if (dragY > 100) {
        onClose();
      }
      setDragY(0);
    };

    const sheet = sheetRef.current;
    if (sheet) {
      sheet.addEventListener("touchstart", handleTouchStart, { passive: true });
      sheet.addEventListener("touchmove", handleTouchMove, { passive: true });
      sheet.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    return () => {
      if (sheet) {
        sheet.removeEventListener("touchstart", handleTouchStart);
        sheet.removeEventListener("touchmove", handleTouchMove);
        sheet.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [isOpen, dragY, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[40]"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{
              y: dragY > 0 ? `${dragY}px` : 0,
            }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 bg-[#faf9f6] rounded-t-3xl shadow-2xl z-[50] ml-6 mr-6"
            style={{
              maxHeight: "70vh",
              borderTop: "4px solid #e91e63",
              borderLeft: "4px solid #e91e63",
              borderRight: "4px solid #e91e63",
              touchAction: "none",
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1 rounded-full bg-primary" />
            </div>

            {/* Content */}
            <div className="flex overflow-hidden flex-col h-full bottom-sheet-content">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
