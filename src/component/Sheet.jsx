import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useEffect, useRef } from "react";
import { enableDragScroll } from "../utils/dragScroll";
import PropTypes from "prop-types";

export default function Sheet({ isOpen, onClose, children, side = "bottom" }) {
  const isTop = side === "top";
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      enableDragScroll(scrollRef.current);
      scrollRef.current.style.cursor = "grab";
    }
  }, [isOpen]);

  const sheetVariants = {
    hidden: { y: isTop ? "-100%" : "100%" },
    visible: { y: 0 },
    exit: { y: isTop ? "-100%" : "100%" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40]"
            onClick={onClose}
          />

          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`
              fixed 
              ${isTop ? "top-0 rounded-b-3xl" : "bottom-0 rounded-t-3xl"} 
              left-0 right-0 bg-white mx-4 z-[50]
            `}
            style={{ maxHeight: "75vh" }}
          >
            {/* Close */}
            <div className="flex justify-end p-4">
              <button
                onClick={onClose}
                className="w-9 h-9 bg-gray-800 text-white rounded-full flex items-center justify-center"
              >
                <IoMdClose className="text-lg" />
              </button>
            </div>

            {/* REAL scrollable container */}
            <div
              ref={scrollRef}
              className="overflow-y-auto px-4 pb-5 h-full select-none"
              style={{
                WebkitOverflowScrolling: "auto", // Chromium fallback
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

Sheet.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node,
  side: PropTypes.string,
};
