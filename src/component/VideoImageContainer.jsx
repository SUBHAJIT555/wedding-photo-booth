import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropItem from "./PropItem";
import CountdownOverlay from "./CountdownOverlay";
import PropTypes from "prop-types";
import { INNER_HOLE } from "../pages/Capture";

const FRAME_W = 2363;
const FRAME_H = 3544;

const VideoImageContainer = memo(function VideoImageContainer({
  capturedImage,
  finalImage,
  videoRef,
  imageRef,
  imageContainerRef,
  isRestarting,
  imageDimensions,
  selectedProps,
  selectedFrame,
  countdown,
  onUpdateProp,
  onDeleteProp,
  onImageLoad,
}) {
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
      className="flex relative justify-center items-center w-full rounded-2xl bg-white "
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
            style={{ aspectRatio: "2/3" }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="object-cover w-full h-full bg-black rounded-2xl shadow-2xl"
              style={{
                opacity: isRestarting ? 0.5 : 1,
                transition: "opacity 0.3s ease",
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
            style={{ aspectRatio: "2/3" }}
          >
            {/* FIXED STYLE — NO FUNCTION */}
            <img
              ref={imageRef}
              src={finalImage || capturedImage}
              alt="Captured"
              onLoad={onImageLoad}
              draggable={false}
              className="absolute top-0 left-0 pointer-events-none rounded-2xl"
              style={
                !selectedFrame || !imageDimensions.width
                  ? {
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }
                  : (() => {
                      const { x: HX, y: HY, w: HW, h: HH } = INNER_HOLE;

                      const camRatio = 2000 / 3000;
                      const holeRatio = HW / HH;

                      let previewW, previewH;

                      if (camRatio > holeRatio) {
                        previewW = (HW / FRAME_W) * imageDimensions.width;
                        previewH = previewW / camRatio;
                      } else {
                        previewH = (HH / FRAME_H) * imageDimensions.height;
                        previewW = previewH * camRatio;
                      }

                      const holeDomX =
                        imageDimensions.offsetX +
                        (HX / FRAME_W) * imageDimensions.width;

                      const holeDomY =
                        imageDimensions.offsetY +
                        (HY / FRAME_H) * imageDimensions.height;

                      return {
                        position: "absolute",
                        width: `${previewW}px`,
                        height: `${previewH}px`,
                        left: `${
                          holeDomX +
                          ((HW / FRAME_W) * imageDimensions.width - previewW) /
                            2
                        }px`,
                        top: `${
                          holeDomY +
                          ((HH / FRAME_H) * imageDimensions.height - previewH) /
                            2
                        }px`,
                        objectFit: "cover",
                        borderRadius: "12px",
                      };
                    })()
              }
            />

            {selectedFrame && (
              <img
                src={selectedFrame.urlMedium}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-30"
                style={{ borderRadius: "1rem" }}
                draggable={false}
              />
            )}

            {imageDimensions.width > 0 && selectedProps.length > 0 && (
              <div
                className="absolute inset-0 z-40"
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
  selectedFrame: PropTypes.object,
  countdown: PropTypes.number,
  onUpdateProp: PropTypes.func,
  onDeleteProp: PropTypes.func,
  onImageLoad: PropTypes.func,
};

export default VideoImageContainer;
