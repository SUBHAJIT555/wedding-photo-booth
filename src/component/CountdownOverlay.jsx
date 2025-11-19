import { motion } from "framer-motion";
import PropTypes from "prop-types";

function CountdownOverlay({ countdown }) {
  if (!countdown) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex absolute inset-0 justify-center items-center bg-black bg-opacity-50 rounded-2xl"
      style={{
        aspectRatio: "2/3",
        maxHeight: "85vh",
        minHeight: "60vh",
      }}
    >
      <motion.p
        key={countdown}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="text-9xl font-bold text-primary md:text-[12rem] lg:text-[14rem] font-dm-serif"
      >
        {countdown}
      </motion.p>
    </motion.div>
  );
}

CountdownOverlay.propTypes = {
  countdown: PropTypes.number, // Can be null when not counting down
};

export default CountdownOverlay;
