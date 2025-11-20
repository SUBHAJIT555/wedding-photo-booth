import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { saveData } from "../utils/localStorageDB";
import { useNavigate } from "react-router-dom";
import CaptureBackground from "../component/CaptureBackground";
import CaptureHeader from "../component/CaptureHeader";
import VideoImageContainer from "../component/VideoImageContainer";
import CaptureActionButtons from "../component/CaptureActionButtons";
import PropsFramesBottomSheet from "../component/PropsFramesBottomSheet";
import { uploadImage } from "../utils/uploadImage";
import { transformUploadResult } from "../utils/urlTransform";

export const INNER_HOLE = {
  x: 310,
  y: 330,
  w: 1750,
  h: 2350,
};

const ENABLE_LOGS = false;

function Capture() {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const canvasRef = useRef(null);
  const compositeCanvasRef = useRef(null);
  const imageContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [activeTab, setActiveTab] = useState("props");
  const [selectedProps, setSelectedProps] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [nextPropId, setNextPropId] = useState(1);
  const imageRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [propsButtonClicked, setPropsButtonClicked] = useState(false);
  // const [debugInfo, setDebugInfo] = useState({});

  const drawPropsAsync = useCallback(
    async (ctx) => {
      if (!imageDimensions.width || !selectedProps.length) return;

      const FRAME_W = 2363;
      const FRAME_H = 3544;
      const { x: INNER_X, y: INNER_Y, w: INNER_W, h: INNER_H } = INNER_HOLE;

      const displayW = imageDimensions.width;
      const displayH = imageDimensions.height;
      const offsetX = imageDimensions.offsetX;
      const offsetY = imageDimensions.offsetY;

      // Load props with caching
      const loadedProps = await Promise.all(
        selectedProps.map((prop) => {
          if (imageCache.current.has(prop.url)) {
            const cached = imageCache.current.get(prop.url);
            if (cached.complete && cached.naturalWidth > 0) {
              return { prop, img: cached };
            }
          }

          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              imageCache.current.set(prop.url, img);
              resolve({ prop, img });
            };
            img.onerror = () => resolve(null);
            img.src = prop.url;
          });
        })
      );

      // If FRAME_SELECTED → prepare DOM ↔ canvas hole mapping
      let holeDomX, holeDomY, holeDomW, holeDomH;
      let imageInHoleX, imageInHoleY, imageInHoleW, imageInHoleH;

      if (selectedFrame) {
        const capturedW = 2000;
        const capturedH = 3000;
        const capturedRatio = capturedW / capturedH;
        const holeRatio = INNER_W / INNER_H;

        // Fit image inside hole (canvas space)
        if (capturedRatio > holeRatio) {
          imageInHoleW = INNER_W;
          imageInHoleH = imageInHoleW / capturedRatio;
          imageInHoleX = INNER_X;
          imageInHoleY = INNER_Y + (INNER_H - imageInHoleH) / 2;
        } else {
          imageInHoleH = INNER_H;
          imageInHoleW = imageInHoleH * capturedRatio;
          imageInHoleX = INNER_X + (INNER_W - imageInHoleW) / 2;
          imageInHoleY = INNER_Y;
        }

        // DOM hole reference (display space)
        holeDomX = offsetX + (INNER_X / FRAME_W) * displayW;
        holeDomY = offsetY + (INNER_Y / FRAME_H) * displayH;
        holeDomW = (INNER_W / FRAME_W) * displayW;
        holeDomH = (INNER_H / FRAME_H) * displayH;
      }

      // MAIN DRAW LOOP
      loadedProps.forEach((item) => {
        if (!item) return;
        const { prop, img } = item;

        const pw = prop.size?.width || 100;
        const ph = prop.size?.height || 100;

        if (!selectedFrame) {
          // ==========================
          // 📌 CASE 1 — NO FRAME
          // ==========================
          const scaleX = FRAME_W / displayW;
          const scaleY = FRAME_H / displayH;

          const relX = prop.position.x - offsetX;
          const relY = prop.position.y - offsetY;

          const cx = relX * scaleX + (pw * scaleX) / 2;
          const cy = relY * scaleY + (ph * scaleY) / 2;

          const fw = pw * scaleX;
          const fh = ph * scaleY;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(((prop.rotation || 0) * Math.PI) / 180);
          ctx.drawImage(img, -fw / 2, -fh / 2, fw, fh);
          ctx.restore();
          return;
        }

        // ==========================
        // 📌 CASE 2 — FRAME SELECTED
        // ==========================

        // prop center in DOM
        const domCenterX = prop.position.x + pw / 2;
        const domCenterY = prop.position.y + ph / 2;

        // DOM → % inside displayed image (NOT the hole)
        const relPX = (domCenterX - holeDomX) / holeDomW;
        const relPY = (domCenterY - holeDomY) / holeDomH;

        const clamp = (v) => Math.max(0, Math.min(1, v));
        const rpx = clamp(relPX);
        const rpy = clamp(relPY);

        // Convert % inside hole → accurate canvas position
        const canvasCX = imageInHoleX + rpx * imageInHoleW;
        const canvasCY = imageInHoleY + rpy * imageInHoleH;

        // Correct scaling relative to captured 2000×3000 image
        const scaleX = (imageInHoleW / displayW) * 1.5;
        const scaleY = (imageInHoleH / displayH) * 1.5;
        const imageScale = Math.min(scaleX, scaleY);

        // New size
        const fw = pw * imageScale;
        const fh = ph * imageScale;

        ctx.save();
        ctx.translate(canvasCX, canvasCY);
        ctx.rotate(((prop.rotation || 0) * Math.PI) / 180);
        ctx.drawImage(img, -fw / 2, -fh / 2, fw, fh);
        ctx.restore();
      });
    },
    [imageDimensions, selectedProps, selectedFrame]
  );

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream first
      if (videoRef.current && videoRef.current.srcObject) {
        const existingStream = videoRef.current.srcObject;
        if (existingStream && existingStream.getTracks) {
          existingStream.getTracks().forEach((track) => track.stop());
        }
        videoRef.current.srcObject = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        // Set the stream
        videoRef.current.srcObject = stream;
        setVideoStream(stream);

        // Wait for video to be ready
        return new Promise((resolve) => {
          const handleCanPlay = () => {
            if (videoRef.current) {
              videoRef.current.removeEventListener("canplay", handleCanPlay);
              videoRef.current.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
              );
              resolve();
            }
          };

          const handleLoadedMetadata = () => {
            if (videoRef.current) {
              videoRef.current.removeEventListener("canplay", handleCanPlay);
              videoRef.current.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
              );
              resolve();
            }
          };

          videoRef.current.addEventListener("canplay", handleCanPlay);
          videoRef.current.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );

          // Fallback timeout
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.removeEventListener("canplay", handleCanPlay);
              videoRef.current.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
              );
            }
            resolve();
          }, 2000);
        });
      }
    } catch (error) {
      console.error("Error accessing the camera:", error);
      // Only show alert for permission denied or not found errors
      if (error.name === "NotAllowedError" || error.name === "NotFoundError") {
        alert(
          "Unable to access camera. Please check permissions and try again."
        );
      }
    }
  }, []);

  const stopVideo = useCallback(() => {
    // Stop stream from video element if available
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }
    // Also stop from state if available
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
  }, [videoStream]);

  const stopVideoAndClear = useCallback(async () => {
    return new Promise((resolve) => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
        setVideoStream(null);
      }

      if (videoRef.current) {
        // Pause first, then clear
        videoRef.current.pause();
        videoRef.current.srcObject = null;

        // Force a repaint and wait for the video element to fully clear
        videoRef.current.load();

        // Wait for the video element to be completely cleared
        setTimeout(resolve, 100);
      } else {
        resolve();
      }
    });
  }, [videoStream]);

  const captureImage = () => {
    setLoading(true);
    setCountdown(5);
  };

  const submitImage = async () => {
    if (ENABLE_LOGS) console.log("Submitting image...");
    setLoading(true);

    try {
      // await composeFinalImage();

      // // Use requestAnimationFrame to ensure canvas is ready
      // await new Promise((resolve) => requestAnimationFrame(resolve));

      // const imageToSave = compositeCanvasRef.current.toDataURL(
      //   "image/png",
      //   1.0
      // );
      console.log("capturedImage exists?", !!capturedImage);

      const imageToSave = await composeFinalImage();

      if (!imageToSave) {
        setLoading(false);
        alert("Failed to capture image. Please try again.");
        return;
      }

      // Upload image to server
      // if (ENABLE_LOGS) console.log("Uploading image to server...");
      const uploadResult = await uploadImage(imageToSave);
      // if (ENABLE_LOGS) console.log("Image uploaded:", uploadResult);

      stopVideo();

      // Transform localhost URLs to include /photo-booth/ path
      const transformedResult = transformUploadResult(uploadResult);
      // if (ENABLE_LOGS) console.log("Transformed URLs:", transformedResult);

      // Save transformed URLs to localStorage
      saveData("capturedImageUrl", transformedResult.url);
      saveData("capturedImageShortUrl", transformedResult.shortUrl);

      // Navigate with the transformed URL
      navigate("/preview", {
        state: {
          resultUrl: transformedResult.url,
          shortUrl: transformedResult.shortUrl,
          base64Image: imageToSave,
        },
      });
    } catch (error) {
      console.error("Error submitting image:", error);
      setLoading(false);
      alert(
        `Failed to upload image: ${
          error.message || "Unknown error"
        }. Please try again.`
      );
    }
  };

  // const updateFinalImage = useCallback(() => {
  //   if (!compositeCanvasRef.current) return;
  //   // Use requestAnimationFrame for smoother updates
  //   requestAnimationFrame(() => {
  //     const image = compositeCanvasRef.current.toDataURL("image/png");
  //     setFinalImage(image);
  //   });
  // }, []);

  const toggleProp = (prop) => {
    // Check if this prop type is already selected
    // We need to check by the original prop's name or url since we're adding instances
    const isSelected = selectedProps.some((p) => {
      // Check if it's the same prop by comparing name and url
      return p.name === prop.name && p.url === prop.url;
    });

    if (isSelected) {
      // Remove all instances of this prop type
      setSelectedProps(
        selectedProps.filter((p) => {
          return !(p.name === prop.name && p.url === prop.url);
        })
      );
    } else {
      // Add new prop instance
      const container = imageContainerRef.current;
      if (!container) return;

      // const rect = container.getBoundingClientRect();

      const newProp = {
        ...prop,
        originalId: prop.id, // Store original prop id for tracking
        id: `prop-${nextPropId}`, // Unique instance id for rendering
        position: {
          x: imageDimensions.width / 2,
          y: imageDimensions.height / 2,
        },
        rotation: 0,
      };

      setSelectedProps([...selectedProps, newProp]);
      setNextPropId(nextPropId + 1);
    }
  };

  const isPropSelected = (prop) => {
    return selectedProps.some((p) => {
      // Check by name and url to identify the same prop type
      return p.name === prop.name && p.url === prop.url;
    });
  };

  const updateProp = (updatedProp) => {
    setSelectedProps(
      selectedProps.map((p) => (p.id === updatedProp.id ? updatedProp : p))
    );
  };

  const deleteProp = (propId) => {
    setSelectedProps(selectedProps.filter((p) => p.id !== propId));
  };

  const applyFrame = (frame) => {
    // Remove all props immediately when a frame is applied
    // setSelectedProps([]);
    setNextPropId(1);

    // Apply the frame
    setSelectedFrame(frame);
  };

  const removeFrame = () => {
    setSelectedFrame(null);
  };

  const composeFinalImage = useCallback(() => {
    return new Promise((resolve) => {
      if (!capturedImage || !compositeCanvasRef.current) {
        resolve(null);
        return;
      }

      const FRAME_W = 2363;
      const FRAME_H = 3544;
      const { x: INNER_X, y: INNER_Y, w: INNER_W, h: INNER_H } = INNER_HOLE;

      const canvas = compositeCanvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = FRAME_W;
      canvas.height = FRAME_H;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = async () => {
        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;
        const imgRatio = srcW / srcH;

        let drawX, drawY, drawW, drawH;

        // ----- NO FRAME -----
        if (!selectedFrame) {
          const canvasRatio = FRAME_W / FRAME_H;

          if (imgRatio > canvasRatio) {
            drawH = FRAME_H;
            drawW = drawH * imgRatio;
            drawX = (FRAME_W - drawW) / 2;
            drawY = 0;
          } else {
            drawW = FRAME_W;
            drawH = drawW / imgRatio;
            drawX = 0;
            drawY = (FRAME_H - drawH) / 2;
          }

          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          await drawPropsAsync(ctx);

          const out = canvas.toDataURL("image/jpeg", 0.85);
          resolve(out);
          return;
        }

        // ----- FRAME SELECTED -----
        const holeRatio = INNER_W / INNER_H;

        if (imgRatio > holeRatio) {
          drawW = INNER_W;
          drawH = drawW / imgRatio;
          drawX = INNER_X;
          drawY = INNER_Y + (INNER_H - drawH) / 2;
        } else {
          drawH = INNER_H;
          drawW = drawH * imgRatio;
          drawX = INNER_X + (INNER_W - drawW) / 2;
          drawY = INNER_Y;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        await drawPropsAsync(ctx);

        // draw frame overlay
        const frameImg = new Image();
        frameImg.crossOrigin = "anonymous";

        frameImg.onload = async () => {
          ctx.drawImage(frameImg, 0, 0, FRAME_W, FRAME_H);

          const out = canvas.toDataURL("image/jpeg", 0.85);
          resolve(out);
        };

        frameImg.onerror = () => resolve(null);
        frameImg.src = selectedFrame.url;
      };

      img.onerror = () => resolve(null);
      img.src = capturedImage;
    });
  }, [capturedImage, selectedFrame, selectedProps, drawPropsAsync]);

  // Image cache to avoid reloading the same images
  const imageCache = useRef(new Map());

  useEffect(() => {
    if (!capturedImage) return;
    composeFinalImage();
  }, [capturedImage, selectedFrame, imageDimensions, selectedProps]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // MATCH THE PREVIEW EXACTLY (2:3)
        const TARGET_W = 2000;
        const TARGET_H = 3000;

        canvas.width = TARGET_W;
        canvas.height = TARGET_H;

        const ctx = canvas.getContext("2d");

        // Fill background (avoid transparent edges)
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, TARGET_W, TARGET_H);

        // READ REAL CAMERA SIZE
        const videoW = video.videoWidth;
        const videoH = video.videoHeight;

        const videoRatio = videoW / videoH;
        const targetRatio = TARGET_W / TARGET_H;

        let drawW, drawH, drawX, drawY;

        // CONTAIN FIT → EXACT SAME LOOK AS PREVIEW
        if (videoRatio > targetRatio) {
          // Camera wider → fit height
          drawH = TARGET_H;
          drawW = drawH * videoRatio;
          drawX = (TARGET_W - drawW) / 2;
          drawY = 0;
        } else {
          // Camera taller → fit width
          drawW = TARGET_W;
          drawH = drawW / videoRatio;
          drawX = 0;
          drawY = (TARGET_H - drawH) / 2;
        }

        // 🔥 THIS IS THE PREVIEW-PERFECT CAPTURE
        ctx.drawImage(video, drawX, drawY, drawW, drawH);

        const image = canvas.toDataURL("image/jpeg", 0.85);

        // SAVE OUTPUT
        setCapturedImage(image);
        setFinalImage(image);
        setPropsButtonClicked(false);
      }

      setLoading(false);
      setCountdown(null);
      stopVideo();
      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, stopVideo]);

  // Initialize camera on mount
  useEffect(() => {
    let mounted = true;

    // Start camera immediately on mount
    const initCamera = async () => {
      // Wait for video element to be available
      let attempts = 0;
      while (!videoRef.current && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        attempts++;
      }

      if (mounted && videoRef.current) {
        await startCamera();
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      mounted = false;
      stopVideo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add this useEffect to debug prop positioning
  // Removed debug useEffect - was causing unnecessary re-renders

  // Restart camera when captured image is cleared (retake scenario)
  useEffect(() => {
    if (!capturedImage && !videoStream && !isRestarting) {
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      const container = imageContainerRef.current;
      const img = imageRef.current;

      const containerW = container.offsetWidth;
      const containerH = container.offsetHeight;
      const imgNaturalW = img.naturalWidth;
      const imgNaturalH = img.naturalHeight;

      const containerRatio = containerW / containerH;
      const imgRatio = imgNaturalW / imgNaturalH;

      let renderW, renderH;

      if (imgRatio > containerRatio) {
        renderW = containerW;
        renderH = containerW / imgRatio;
      } else {
        renderH = containerH;
        renderW = containerH * imgRatio;
      }

      const offsetX = (containerW - renderW) / 2;
      const offsetY = (containerH - renderH) / 2;

      setImageDimensions({
        width: renderW,
        height: renderH,
        offsetX,
        offsetY,
        containerWidth: containerW,
        containerHeight: containerH,
      });

      // if (ENABLE_LOGS) {
      //   console.log("🖼️ Image dimensions updated:", {
      //     renderW: Math.round(renderW),
      //     renderH: Math.round(renderH),
      //     offsetX: Math.round(offsetX),
      //     offsetY: Math.round(offsetY),
      //     containerW: Math.round(containerW),
      //     containerH: Math.round(containerH),
      //   });
      // }
    }
  };

  const handleRetake = async () => {
    if (isRestarting) return;

    setIsRestarting(true);

    try {
      // Reset everything
      setCapturedImage(null);
      setFinalImage(null);
      setSelectedProps([]);
      setSelectedFrame(null);
      setShowBottomSheet(false);
      setNextPropId(1);
      setPropsButtonClicked(false);

      // Stop and clear the current video stream completely
      await stopVideoAndClear();

      // Wait a bit more for complete cleanup
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Start the camera again and wait for it to be ready
      await startCamera();
    } catch (error) {
      console.error("Error restarting camera:", error);
    } finally {
      setIsRestarting(false);
    }
  };

  const handlePropsClick = () => {
    setShowBottomSheet(true);
    setPropsButtonClicked(true);
  };

  return (
    <div className="flex overflow-hidden relative flex-col justify-center items-center w-full h-screen min-h-screen ">
      <CaptureBackground />

      {/* Main Content Container */}
      <div className="relative z-[2] flex flex-col items-center justify-center w-full px-4 gap-4 md:gap-6 py-4 md:py-6">
        {/* Debug Info */}
        {/* <pre
          style={{
            position: "absolute",
            bottom: -100,
            left: 10,
            color: "#000",
            fontSize: 12,
          }}
        >
          {JSON.stringify(debugInfo, null, 2)}
        </pre> */}
        <CaptureHeader />

        {/* Video/Image Container */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <canvas ref={compositeCanvasRef} style={{ display: "none" }} />
        <VideoImageContainer
          capturedImage={capturedImage}
          finalImage={finalImage}
          videoRef={videoRef}
          imageRef={imageRef}
          imageContainerRef={imageContainerRef}
          isRestarting={isRestarting}
          imageDimensions={imageDimensions}
          selectedProps={selectedProps}
          countdown={countdown}
          selectedFrame={selectedFrame}
          onUpdateProp={updateProp}
          onDeleteProp={deleteProp}
          onImageLoad={handleImageLoad}
        />

        {/* Button Section - Bottom */}
        <AnimatePresence mode="wait">
          <CaptureActionButtons
            capturedImage={capturedImage}
            loading={loading}
            isRestarting={isRestarting}
            propsButtonClicked={propsButtonClicked}
            onCapture={captureImage}
            onRetake={handleRetake}
            onPropsClick={handlePropsClick}
            onSubmit={submitImage}
          />
        </AnimatePresence>
      </div>

      {/* Bottom Sheet for Props and Frames */}
      <PropsFramesBottomSheet
        isOpen={showBottomSheet}
        capturedImage={capturedImage}
        activeTab={activeTab}
        selectedFrame={selectedFrame}
        // selectedProps={selectedProps}
        onClose={() => setShowBottomSheet(false)}
        onTabChange={setActiveTab}
        onToggleProp={toggleProp}
        onApplyFrame={applyFrame}
        onRemoveFrame={removeFrame}
        isPropSelected={isPropSelected}
      />
    </div>
  );
}

export default Capture;
