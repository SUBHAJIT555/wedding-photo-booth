/* eslint-disable react/prop-types */
import { memo } from "react";
import { motion } from "framer-motion";
import { IoRefresh, IoImages, IoCheckmarkCircle } from "react-icons/io5";

const CaptureActionButtons = memo(function CaptureActionButtons({
  capturedImage,
  loading,
  isRestarting,
  propsButtonClicked,
  onCapture,
  onRetake,
  onPropsClick,
  onSubmit,
}) {
  if (!capturedImage) {
    return (
      <motion.div
        key="capture-button"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="flex gap-4 mt-4 md:gap-6 md:mt-6"
      >
        <motion.button
          onClick={onCapture}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            px-[14vw] py-[4vw] md:px-16 md:py-5 
            text-[5vw] md:text-[3vw] lg:text-4xl font-semibold 
            text-white bg-[#e91e63] hover:bg-[#c2185b] 
            transition-all duration-300 shadow-lg hover:shadow-xl 
            rounded-tl-2xl rounded-br-2xl 
            font-krylon tracking-wider cursor-none
            ${loading ? "opacity-50 " : ""}
          `}
        >
          {loading ? "Capturing..." : "Capture"}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="action-buttons"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 justify-center items-center px-4 mt-6 w-full md:gap-6 md:mt-8"
    >
      <motion.button
        onClick={onRetake}
        disabled={isRestarting}
        whileHover={
          !isRestarting
            ? {
                scale: 1.05,
                y: -2,
                boxShadow: "0 10px 25px rgba(93, 64, 55, 0.3)",
              }
            : {}
        }
        whileTap={
          !isRestarting
            ? {
                scale: 0.92,
                y: 2,
                boxShadow: "0 2px 8px rgba(93, 64, 55, 0.2)",
              }
            : {}
        }
        className={`
          w-20 h-20 md:w-24 md:h-24
          border-2 border-[#5d4037] text-[#5d4037] 
          rounded-2xl 
          hover:bg-[#5d4037] hover:text-white 
          transition-all duration-200 cursor-none
          flex items-center justify-center
          bg-white/80 backdrop-blur-sm
          relative
          ${isRestarting ? "opacity-75 " : ""}
        `}
        style={{
          boxShadow:
            "0 8px 16px rgba(93, 64, 55, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        }}
      >
        {isRestarting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <IoRefresh className="text-4xl md:text-5xl" />
          </motion.div>
        ) : (
          <IoRefresh className="text-4xl md:text-5xl" />
        )}
      </motion.button>

      <div className="relative w-20 h-20 md:w-24 md:h-24">
        {!propsButtonClicked && (
          <>
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-[#ffd700]"
              animate={{
                opacity: [0, 0.8, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                boxShadow: "0 0 20px rgba(255, 215, 0, 0.6)",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-[#ffd700]"
              animate={{
                opacity: [0, 0.6, 0],
                scale: [1, 1.25, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              style={{
                boxShadow: "0 0 30px rgba(255, 215, 0, 0.4)",
              }}
            />
          </>
        )}
        <motion.button
          onClick={onPropsClick}
          whileHover={{
            scale: 1.05,
            y: -2,
            boxShadow: !propsButtonClicked
              ? "0 10px 25px rgba(93, 64, 55, 0.3), 0 0 20px rgba(255, 215, 0, 0.6)"
              : "0 10px 25px rgba(93, 64, 55, 0.3)",
          }}
          whileTap={{
            scale: 0.92,
            y: 2,
            boxShadow: "0 2px 8px rgba(93, 64, 55, 0.2)",
          }}
          animate={
            !propsButtonClicked
              ? {
                  scale: [1, 1.05, 1],
                }
              : {}
          }
          transition={
            !propsButtonClicked
              ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : {}
          }
          className="
            w-full h-full border-2 border-[#5d4037] text-[#5d4037] 
            rounded-2xl 
            hover:bg-[#5d4037] hover:text-white 
            transition-all duration-200 cursor-none
            flex items-center justify-center
            relative overflow-hidden
            bg-white/80 backdrop-blur-sm
          "
          style={{
            boxShadow: !propsButtonClicked
              ? "0 8px 16px rgba(93, 64, 55, 0.25), 0 0 15px rgba(255, 215, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.5)"
              : "0 8px 16px rgba(93, 64, 55, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
          }}
        >
          <IoImages className="relative z-10 text-4xl md:text-5xl" />
          {!propsButtonClicked && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffd700]/20 to-transparent rounded-2xl"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
        </motion.button>
      </div>

      <motion.button
        onClick={onSubmit}
        whileHover={{
          scale: 1.05,
          y: -2,
          boxShadow: "0 10px 25px rgba(93, 64, 55, 0.3)",
        }}
        whileTap={{
          scale: 0.92,
          y: 2,
          boxShadow: "0 2px 8px rgba(93, 64, 55, 0.2)",
        }}
        className="
          w-20 h-20 md:w-24 md:h-24
          border-2 border-[#5d4037] text-[#5d4037] 
          rounded-2xl 
          hover:bg-[#5d4037] hover:text-white 
          transition-all duration-200 cursor-none
          flex items-center justify-center
          bg-white/80 backdrop-blur-sm
          relative
        "
        style={{
          boxShadow:
            "0 8px 16px rgba(93, 64, 55, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        }}
      >
        <IoCheckmarkCircle className="text-4xl md:text-5xl" />
      </motion.button>
    </motion.div>
  );
});

export default CaptureActionButtons;
