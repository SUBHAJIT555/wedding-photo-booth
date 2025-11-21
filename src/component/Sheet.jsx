import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import PropTypes from "prop-types";
export default function Sheet({
  isOpen,
  onClose,
  children,
  side = "bottom", // "top" | "bottom"
}) {
  const isTop = side === "top";

  const sheetVariants = {
    hidden: { y: isTop ? "-100%" : "100%" },
    visible: { y: 0 },
    exit: { y: isTop ? "-100%" : "100%" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className={`
              fixed 
              ${isTop ? "top-0 rounded-b-3xl" : "bottom-0 rounded-t-3xl"} 
              left-0 right-0
              bg-gradient-to-b from-white via-[#faf9f6] to-white
              shadow-2xl
              z-[50]
              mx-4
            `}
            style={{
              maxHeight: "75vh",
            }}
          >
            {/* Handle line */}
            <div
              className={`absolute ${
                isTop ? "bottom-0 mb-3" : "top-0 mt-3"
              } left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-300 rounded-full`}
            />

            {/* Close Button */}
            <div
              className={`flex ${
                isTop
                  ? "justify-end pt-4 px-4 pb-2"
                  : "justify-end pt-4 px-4 pb-2"
              }`}
            >
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition-all duration-200"
              >
                <IoMdClose className="text-lg" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-4 pb-5 h-full">{children}</div>
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
