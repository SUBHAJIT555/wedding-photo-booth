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

const INNER_HOLE = {
  x: 310,
  y: 330,
  w: 1750,
  h: 2350,
};
const DEBUG_PROPS = false;
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

  const drawPropsAsync = useCallback(
    async (ctx) => {
      if (!imageDimensions.width || !selectedProps.length) return;

      const FRAME_W = 2363;
      const FRAME_H = 3544;
      const { x: INNER_X, y: INNER_Y, w: INNER_W, h: INNER_H } = INNER_HOLE;

      const displayW = imageDimensions.width;
      const displayH = imageDimensions.height;
      const displayOffsetX = imageDimensions.offsetX || 0;
      const displayOffsetY = imageDimensions.offsetY || 0;

      if (ENABLE_LOGS) {
        // console.log("🔄 Drawing props with dimensions:", {
        //   displayW,
        //   displayH,
        //   displayOffsetX,
        //   displayOffsetY,
        //   selectedFrame: selectedFrame?.name || "none",
        //   propsCount: selectedProps.length,
        // });
      }

      // Load props with caching
      const loadedProps = await Promise.all(
        selectedProps.map((prop) => {
          // Check cache first
          if (imageCache.current.has(prop.url)) {
            const cachedImg = imageCache.current.get(prop.url);
            if (cachedImg.complete && cachedImg.naturalWidth > 0) {
              return Promise.resolve({ prop, img: cachedImg });
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

      loadedProps.forEach((item) => {
        if (!item) return;
        const { prop, img } = item;

        const propWidth = prop.size?.width || 100;
        const propHeight = prop.size?.height || 100;

        if (selectedFrame) {
          // Cache captured image dimensions to avoid creating new Image objects
          let capturedW = 2000;
          let capturedH = 3000;

          // Try to get dimensions from cached image or create once
          if (imageCache.current.has(capturedImage)) {
            const cachedImg = imageCache.current.get(capturedImage);
            capturedW = cachedImg.naturalWidth || 2000;
            capturedH = cachedImg.naturalHeight || 3000;
          } else {
            // Create and cache the captured image
            const capturedImg = new Image();
            capturedImg.src = capturedImage;
            if (capturedImg.complete) {
              capturedW = capturedImg.naturalWidth || 2000;
              capturedH = capturedImg.naturalHeight || 3000;
              imageCache.current.set(capturedImage, capturedImg);
            }
          }

          const capturedRatio = capturedW / capturedH;
          const holeRatio = INNER_W / INNER_H;

          let imageInHoleX, imageInHoleY, imageInHoleW, imageInHoleH;

          if (capturedRatio > holeRatio) {
            // fit to WIDTH of hole
            imageInHoleW = INNER_W;
            imageInHoleH = imageInHoleW / capturedRatio;
            imageInHoleX = INNER_X;
            imageInHoleY = INNER_Y + (INNER_H - imageInHoleH) / 2;
          } else {
            // fit to HEIGHT of hole
            imageInHoleH = INNER_H;
            imageInHoleW = imageInHoleH * capturedRatio;
            imageInHoleY = INNER_Y;
            imageInHoleX = INNER_X + (INNER_W - imageInHoleW) / 2;
          }

          // 2) Same hole rectangle, but in DOM space
          const frameDomX = displayOffsetX;
          const frameDomY = displayOffsetY;
          const frameDomW = displayW;
          const frameDomH = displayH;

          const holeDomX = frameDomX + (INNER_X / FRAME_W) * frameDomW;
          const holeDomY = frameDomY + (INNER_Y / FRAME_H) * frameDomH;
          const holeDomW = (INNER_W / FRAME_W) * frameDomW;
          const holeDomH = (INNER_H / FRAME_H) * frameDomH;

          // 3) UNIFORM scale: use width if we fit to width, otherwise height
          const scale =
            capturedRatio > holeRatio
              ? imageInHoleW / holeDomW // width-driven fit
              : imageInHoleH / holeDomH; // height-driven fit

          // 4) Map DOM **center** of prop to canvas **center**
          const domCenterX = prop.position.x + propWidth / 2;
          const domCenterY = prop.position.y + propHeight / 2;

          const relativeCenterX = domCenterX - holeDomX;
          const relativeCenterY = domCenterY - holeDomY;

          const canvasCenterX = imageInHoleX + relativeCenterX * scale;
          const canvasCenterY = imageInHoleY + relativeCenterY * scale;

          const finalWidth = propWidth * scale;
          const finalHeight = propHeight * scale;

          if (ENABLE_LOGS) {
            // console.log(`📍 WITH FRAME - Prop "${prop.name}":`, {
            //   canvasCenterX: Math.round(canvasCenterX),
            //   canvasCenterY: Math.round(canvasCenterY),
            //   finalWidth: Math.round(finalWidth),
            //   finalHeight: Math.round(finalHeight),
            // });
          }

          ctx.save();
          ctx.translate(canvasCenterX, canvasCenterY);
          ctx.rotate(((prop.rotation || 0) * Math.PI) / 180);
          ctx.drawImage(
            img,
            -finalWidth / 2 - 80,
            -finalHeight / 2 - 1,
            finalWidth,
            finalHeight
          );
          ctx.restore();
        } else {
          // ============================================
          // 🔵 CASE: NO FRAME SELECTED (unchanged)
          // ============================================

          const scaleX = FRAME_W / displayW;
          const scaleY = FRAME_H / displayH;

          const relativeX = prop.position.x - displayOffsetX;
          const relativeY = prop.position.y - displayOffsetY;

          const canvasX = relativeX * scaleX;
          const canvasY = relativeY * scaleY;

          const finalWidth = propWidth * scaleX;
          const finalHeight = propHeight * scaleY;

          if (ENABLE_LOGS) {
            // console.log(`📍 NO FRAME - Prop "${prop.name}":`, {
            //   canvasX: Math.round(canvasX),
            //   canvasY: Math.round(canvasY),
            //   finalWidth: Math.round(finalWidth),
            //   finalHeight: Math.round(finalHeight),
            // });
          }

          if (DEBUG_PROPS) {
            const label = `domX:${Math.round(
              prop.position.x
            )} domY:${Math.round(prop.position.y)} | cX:${Math.round(
              canvasX
            )} cY:${Math.round(canvasY)}`;
            ctx.save();
            ctx.font = "22px Arial";
            const padding = 6;
            const textWidth = ctx.measureText(label).width;
            const boxX = canvasX;
            const boxY = canvasY - 28;
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(boxX, boxY, textWidth + padding * 2, 24);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(label, boxX + padding, boxY + 17);
            ctx.restore();
          }

          ctx.save();
          ctx.translate(canvasX + finalWidth / 2, canvasY + finalHeight / 2);
          ctx.rotate(((prop.rotation || 0) * Math.PI) / 180);
          ctx.drawImage(
            img,
            -finalWidth / 2,
            -finalHeight / 2,
            finalWidth,
            finalHeight
          );
          ctx.restore();
        }
      });
    },
    [
      imageDimensions,
      selectedProps,
      selectedFrame,
      capturedImage,
      DEBUG_PROPS,
      ENABLE_LOGS,
    ]
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
      await composeFinalImage();

      // Use requestAnimationFrame to ensure canvas is ready
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const imageToSave = compositeCanvasRef.current.toDataURL(
        "image/png",
        1.0
      );

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

  const updateFinalImage = useCallback(() => {
    if (!compositeCanvasRef.current) return;
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      const image = compositeCanvasRef.current.toDataURL("image/png");
      setFinalImage(image);
    });
  }, []);

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
    setSelectedProps([]);
    setNextPropId(1);

    // Apply the frame
    setSelectedFrame(frame);
  };

  const removeFrame = () => {
    setSelectedFrame(null);
  };

  const composeFinalImage = useCallback(() => {
    return new Promise((resolve) => {
      // if (ENABLE_LOGS) console.log("🚀 Starting composeFinalImage");
      if (!capturedImage || !compositeCanvasRef.current) {
        resolve();
        return;
      }

      const FRAME_W = 2363;
      const FRAME_H = 3544;
      const { x: INNER_X, y: INNER_Y, w: INNER_W, h: INNER_H } = INNER_HOLE;

      const canvas = compositeCanvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = FRAME_W;
      canvas.height = FRAME_H;

      // white background for final print
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);

      const img = new Image();

      img.onload = async () => {
        const srcW = img.naturalWidth; // Use naturalWidth instead of width
        const srcH = img.naturalHeight; // Use naturalHeight instead of height
        const imgRatio = srcW / srcH;

        if (ENABLE_LOGS) {
          // console.log("📐 Captured image dimensions:", {
          //   width: srcW,
          //   height: srcH,
          //   ratio: imgRatio.toFixed(4),
          // });
        }

        let drawX, drawY, drawW, drawH;

        // ================================
        // CASE 1 — NO FRAME SELECTED
        // ================================
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

          // Draw props normally
          await drawPropsAsync(ctx);

          updateFinalImage();
          resolve();
          return;
        }
        // if (ENABLE_LOGS) console.log("🟠 CASE 2 — FRAME SELECTED");
        // ================================
        // CASE 2 — FRAME SELECTED
        // ================================
        const holeRatio = INNER_W / INNER_H;

        // Fit inside hole
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

        if (ENABLE_LOGS) {
          // console.log("🖼️ Image in frame hole:", {
          //   drawX: Math.round(drawX),
          //   drawY: Math.round(drawY),
          //   drawW: Math.round(drawW),
          //   drawH: Math.round(drawH),
          //   holeRatio: holeRatio.toFixed(4),
          // });
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Draw props ON TOP of the camera image but UNDER the frame
        await drawPropsAsync(ctx);

        // Load frame with caching
        let frameImg = imageCache.current.get(selectedFrame.url);
        if (frameImg && frameImg.complete && frameImg.naturalWidth > 0) {
          // Use cached frame
          ctx.drawImage(frameImg, 0, 0, FRAME_W, FRAME_H);
          // Then draw props ON TOP
          await drawPropsAsync(ctx);
          updateFinalImage();
          resolve();
        } else {
          // Load new frame
          frameImg = new Image();
          frameImg.crossOrigin = "anonymous";
          frameImg.onload = async () => {
            // Cache the frame image
            imageCache.current.set(selectedFrame.url, frameImg);
            // Draw frame overlay (covers everything)
            ctx.drawImage(frameImg, 0, 0, FRAME_W, FRAME_H);
            // Then draw props ON TOP
            await drawPropsAsync(ctx);
            updateFinalImage();
            resolve();
          };
          frameImg.onerror = () => {
            console.error("Failed to load frame image");
            resolve();
          };
          frameImg.src = selectedFrame.url;
        }
      };

      img.src = capturedImage;
    });
  }, [
    capturedImage,
    selectedFrame,
    selectedProps,
    drawPropsAsync,
    updateFinalImage,
    ENABLE_LOGS,
  ]);

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

        const image = canvas.toDataURL("image/png", 1.0);

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
    <div className="flex overflow-hidden relative flex-col justify-center items-center w-full h-screen min-h-screen">
      <CaptureBackground />

      {/* Main Content Container */}
      <div className="relative z-[2] flex flex-col items-center justify-center w-full px-4 gap-4 md:gap-6 py-4 md:py-6">
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
