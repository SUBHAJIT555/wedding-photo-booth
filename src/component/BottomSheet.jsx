/* eslint-disable react/prop-types */
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";

function BottomSheet({ isOpen, onClose, activeTab, onTabChange, children }) {
  // activeTab and onTabChange are kept for API consistency
  void activeTab;
  void onTabChange;

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-white via-[#faf9f6] to-white rounded-t-[2.5rem] shadow-2xl z-[50] mx-4"
            style={{
              maxHeight: "75vh",
              boxShadow:
                "0 -10px 40px rgba(0, 0, 0, 0.2), 0 -5px 15px rgba(233, 30, 99, 0.1)",
            }}
          >
            {/* Decorative Top Border */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-[#e91e63] to-transparent rounded-full" />

            {/* Header with Close Button */}
            <div className="flex relative justify-end items-start px-4 pt-4 pb-2">
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#5d4037] text-white shadow-lg hover:bg-[#4a3329] transition-all duration-200 z-10"
                style={{
                  boxShadow:
                    "0 4px 12px rgba(93, 64, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                }}
              >
                <IoMdClose className="text-lg" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex overflow-hidden flex-col px-4 pb-4 h-full">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
