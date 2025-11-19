import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropItem from "./PropItem";
import CountdownOverlay from "./CountdownOverlay";
import PropTypes from "prop-types";

const VideoImageContainer = memo(function VideoImageContainer({
  capturedImage,
  finalImage,
  videoRef,
  imageRef,
  imageContainerRef,
  isRestarting,
  imageDimensions,
  selectedProps,
  countdown,
  onUpdateProp,
  onDeleteProp,
  onImageLoad,
}) {
  // Memoize props list to prevent unnecessary re-renders
  const propsList = useMemo(
    () =>
      selectedProps.map((prop) => (
        <div key={prop.id} style={{ pointerEvents: "auto" }}>
          <PropItem
            prop={prop}
            imageDimensions={imageDimensions}
            onUpdate={onUpdateProp}
            onDelete={onDeleteProp}
            containerWidth={imageDimensions.width}
            containerHeight={imageDimensions.height}
          />
        </div>
      )),
    [selectedProps, imageDimensions, onUpdateProp, onDeleteProp]
  );
  return (
    <div
      ref={imageContainerRef}
      className="flex relative justify-center items-center w-full"
      style={{
        maxWidth: "70vw",
        aspectRatio: "2/3",
        maxHeight: "85vh",
        minHeight: "60vh",
      }}
    >
      <AnimatePresence mode="wait">
        {!capturedImage ? (
          <motion.div
            key="video"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
            style={{
              aspectRatio: "2/3",
              maxHeight: "85vh",
              minHeight: "60vh",
            }}
          >
            <video
              ref={videoRef}
              className="object-cover w-full h-full bg-black rounded-2xl shadow-2xl"
              autoPlay
              muted
              playsInline
              style={{
                opacity: isRestarting ? 0.5 : 1,
                transition: "opacity 0.3s ease",
                display: "block",
                aspectRatio: "2/3",
                objectFit: "cover",
                maxHeight: "85vh",
                minHeight: "60vh",
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="image"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-full h-full"
            style={{
              aspectRatio: "2/3",
              maxHeight: "85vh",
              minHeight: "60vh",
            }}
          >
            <img
              ref={imageRef}
              src={finalImage || capturedImage}
              alt="Captured"
              className="object-contain w-full h-full rounded-2xl border-4 border-white shadow-2xl pointer-events-none"
              style={{
                display: "block",
                aspectRatio: "2/3",
                objectFit: "contain",
                maxHeight: "85vh",
                minHeight: "60vh",
              }}
              onLoad={onImageLoad}
            />
            {/* Props overlay - positioned absolutely over the image */}
            {imageDimensions.width > 0 && selectedProps.length > 0 && (
              <div
                className="absolute inset-0"
                style={{ borderRadius: "1rem", pointerEvents: "none" }}
              >
                {propsList}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <CountdownOverlay countdown={countdown} />
    </div>
  );
});

VideoImageContainer.propTypes = {
  capturedImage: PropTypes.string,
  finalImage: PropTypes.string,
  videoRef: PropTypes.object,
  imageRef: PropTypes.object,
  imageContainerRef: PropTypes.object,
  isRestarting: PropTypes.bool,
  imageDimensions: PropTypes.object,
  selectedProps: PropTypes.array,
  countdown: PropTypes.number,
  onUpdateProp: PropTypes.func,
  onDeleteProp: PropTypes.func,
  onImageLoad: PropTypes.func,
};

export default VideoImageContainer;
