import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveData } from "../utils/localStorageDB";
import { useNavigate } from "react-router-dom";
import BgImage from "../assets/images/home/Bg.png";
import FlowerBgImage from "../assets/images/home/Flower-Bg.png";
import BottomSheet from "../component/BottomSheet";
import PropItem from "../component/PropItem";
import { props as availableProps, frames } from "../constant/propsAndFrames";
import { IoChevronUp } from "react-icons/io5";
import { uploadImage } from "../utils/uploadImage";
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
    console.log("Submitting image...");
    setLoading(true);

    try {
      // Get the composed image
      const imageToSave = await new Promise((resolve) => {
        const onComposed = () => {
          if (compositeCanvasRef.current) {
            const composed = compositeCanvasRef.current.toDataURL("image/png");
            resolve(composed);
          } else {
            resolve(null);
          }
        };

        composeFinalImage(); // triggers async image drawing
        // Wait a bit to ensure props are drawn (or chain inside composeFinalImage)
        setTimeout(onComposed, 400); // adjust delay if needed
      });

      if (!imageToSave) {
        setLoading(false);
        alert("Failed to capture image. Please try again.");
        return;
      }

      // Upload image to server
      console.log("Uploading image to server...");
      const uploadResult = await uploadImage(imageToSave);
      console.log("Image uploaded:", uploadResult);

      stopVideo();
      
      // Save both the base64 (for local storage/backward compatibility) and the URL
      saveData("capturedImage", imageToSave);
      saveData("capturedImageUrl", uploadResult.url);
      saveData("capturedImageShortUrl", uploadResult.shortUrl);

      // Navigate with the URL (short URL for QR code)
      navigate("/preview", { 
        state: { 
          resultUrl: uploadResult.url,
          shortUrl: uploadResult.shortUrl,
          // Keep base64 for backward compatibility
          base64Image: imageToSave,
        } 
      });
    } catch (error) {
      console.error("Error submitting image:", error);
      setLoading(false);
      alert(`Failed to upload image: ${error.message || "Unknown error"}. Please try again.`);
    }
  };

  // const submitImage = () => {
  //   console.log("in submit Image function");
  //   composeFinalImage();
  //   stopVideo();
  //   const imageToSave = finalImage || capturedImage;
  //   saveData("capturedImage", imageToSave);
  //   // Navigate to preview with the final edited image
  //   navigate("/preview", { state: { resultUrl: imageToSave } });
  // };

  const updateFinalImage = useCallback(() => {
    console.log(
      "in update Final Image function in update Final Image function"
    );
    if (!compositeCanvasRef.current) return;
    console.log("in update Final Image function");
    const image = compositeCanvasRef.current.toDataURL("image/png");
    setFinalImage(image);
  }, []);

  const renderCompositeImage = useCallback(() => {
    if (!capturedImage || !compositeCanvasRef.current) return;

    const canvas = compositeCanvasRef.current;
    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = img.width * dpr;
      canvas.height = img.height * dpr;
      // canvas.width = img.width;
      // canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);

      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Draw frame if selected
      if (selectedFrame) {
        const frameImg = new Image();
        frameImg.crossOrigin = "anonymous";
        frameImg.onload = () => {
          ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          updateFinalImage();
        };
        frameImg.src = selectedFrame.url;
      } else {
        updateFinalImage();
      }
    };
    img.src = capturedImage;
  }, [capturedImage, selectedFrame, updateFinalImage]);

  useEffect(() => {
    renderCompositeImage();
  }, [renderCompositeImage, selectedFrame]);

  const addProp = (prop) => {
    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const newProp = {
      ...prop,
      id: `prop-${nextPropId}`,
      position: {
        x: rect.width / 2,
        y: rect.height / 2,
      },
      // no size yet
      rotation: 0,
    };

    setSelectedProps([...selectedProps, newProp]);
    setNextPropId(nextPropId + 1);
  };

  // const addProp = (prop) => {
  //   console.log("in add Prop function", prop);
  //   const container = imageContainerRef.current;
  //   if (!container) return;

  //   const rect = container.getBoundingClientRect();
  //   const newProp = {
  //     ...prop,
  //     id: `prop-${nextPropId}`,
  //     position: {
  //       x: rect.width / 2 - 50,
  //       y: rect.height / 2 - 50,
  //     },

  //     // position: {
  //     //   x: (rect.width / 2 - 50) * (imageRef.current.naturalWidth / rect.width),
  //     //   y:
  //     //     (rect.height / 2 - 50) *
  //     //     (imageRef.current.naturalHeight / rect.height),
  //     // },
  //     // position: { x: rect.width / 2 - 50, y: rect.height / 2 - 50 },
  //     size: { width: 100, height: 100 },
  //     rotation: 0,
  //   };
  //   setSelectedProps([...selectedProps, newProp]);
  //   setNextPropId(nextPropId + 1);
  // };

  const updateProp = (updatedProp) => {
    setSelectedProps(
      selectedProps.map((p) => (p.id === updatedProp.id ? updatedProp : p))
    );
  };

  const deleteProp = (propId) => {
    setSelectedProps(selectedProps.filter((p) => p.id !== propId));
  };

  const applyFrame = (frame) => {
    setSelectedFrame(frame);
  };

  const removeFrame = () => {
    setSelectedFrame(null);
  };

  const composeFinalImage = useCallback(() => {
    console.log("in compose Final Image function");
    if (!capturedImage || !compositeCanvasRef.current) return;

    const canvas = compositeCanvasRef.current;
    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = img.width * dpr;
      canvas.height = img.height * dpr;
      // canvas.width = img.width;
      // canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Draw frame if selected
      if (selectedFrame) {
        const frameImg = new Image();
        frameImg.crossOrigin = "anonymous";
        frameImg.onload = () => {
          // ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          ctx.drawImage(frameImg, 0, 0, img.width, img.height);
          // Draw props after frame
          drawPropsOnCanvas(ctx, img.width, img.height);
        };
        frameImg.onerror = () => {
          drawPropsOnCanvas(ctx, img.width, img.height);
        };
        frameImg.src = selectedFrame.url;
      } else {
        drawPropsOnCanvas(
          ctx,
          canvas.width,
          canvas.height,
          img.width,
          img.height
        );
      }
    };
    img.src = capturedImage;

    const drawPropsOnCanvas = (ctx, imgWidth, imgHeight) => {
      if (!imageRef.current || selectedProps.length === 0) {
        updateFinalImage();
        return;
      }
      console.log("in draw Props On Canvas function");
      console.log("selectedProps", selectedProps);
      // Compute ratios between DOM and natural for correct scaling
      const domRect = imageRef.current.getBoundingClientRect();

      // Finally compute how to scale prop coordinates for the canvas
      // const scaleX = imgWidth / domRect.width;
      // const scaleY = imgHeight / domRect.height;

      const dpr = window.devicePixelRatio || 1;
      const scaleX = imgWidth / domRect.width / dpr;
      const scaleY = imgHeight / domRect.height / dpr;

      let loadedCount = 0;
      const totalProps = selectedProps.length;

      if (totalProps === 0) {
        updateFinalImage();
        return;
      }

      selectedProps.forEach((prop) => {
        const propImg = new Image();
        propImg.crossOrigin = "anonymous";
        propImg.onload = () => {
          const x = prop.position.x * scaleX;
          const y = prop.position.y * scaleY;
          const width = prop.size.width * scaleX;
          const height = prop.size.height * scaleY;

          const rotation = prop.rotation || 0;

          // Save context state
          ctx.save();

          // Move to center of prop
          ctx.translate(x + width / 2, y + height / 2);

          // Rotate
          ctx.rotate((rotation * Math.PI) / 180);

          // Draw image centered
          ctx.drawImage(propImg, -width / 2, -height / 2, width, height);

          // Restore context state
          ctx.restore();

          loadedCount++;
          if (loadedCount === totalProps) {
            console.log(
              "in update Final Image function in draw Props On Canvas"
            );
            updateFinalImage();
          }
        };
        propImg.onerror = () => {
          loadedCount++;
          if (loadedCount === totalProps) {
            console.log(
              "in update Final Image function in draw Props On Canvas onerror"
            );
            updateFinalImage();
          }
        };
        propImg.src = prop.url;
      });
    };
  }, [capturedImage, selectedFrame, selectedProps, updateFinalImage]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Postcard aspect ratio: 2:3 (portrait)
        const POSTCARD_RATIO = 2 / 3; // width:height

        // Calculate postcard dimensions
        let postcardWidth, postcardHeight;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // Calculate based on video height (we want to use full height)
        postcardHeight = videoHeight;
        postcardWidth = postcardHeight * POSTCARD_RATIO;

        // If the calculated width is wider than video, crop from sides
        // Otherwise, use video width and adjust height
        if (postcardWidth > videoWidth) {
          postcardWidth = videoWidth;
          postcardHeight = postcardWidth / POSTCARD_RATIO;
        }

        // Set canvas to postcard size
        canvas.width = postcardWidth;
        canvas.height = postcardHeight;

        const context = canvas.getContext("2d");

        // Calculate source rectangle to crop from center (remove left and right)
        const sourceX = (videoWidth - postcardWidth) / 2;
        const sourceY = (videoHeight - postcardHeight) / 2;

        // Draw the cropped image (crop from left and right, keep center)
        context.drawImage(
          video,
          sourceX, // Crop from left
          sourceY, // Start from top (or center vertically)
          postcardWidth, // Crop width
          postcardHeight, // Crop height
          0, // Destination x
          0, // Destination y
          postcardWidth, // Destination width
          postcardHeight // Destination height
        );

        const image = canvas.toDataURL("image/png", 1.0);
        setCapturedImage(image);
        setFinalImage(image);
        // Don't auto-open bottom sheet, let user swipe up
        // setShowBottomSheet(true);
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

  // Swipe up gesture handler for bottom sheet - detect from anywhere on screen
  useEffect(() => {
    if (!capturedImage || showBottomSheet) return;

    let startY = 0;
    let currentDistance = 0;

    const handleTouchStart = (e) => {
      // Only start swipe detection if touch starts in bottom half of screen
      const touchY = e.touches[0].clientY;
      if (touchY > window.innerHeight / 2) {
        startY = touchY;
        currentDistance = 0;
      }
    };

    const handleTouchMove = (e) => {
      if (startY === 0) return;

      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY; // Positive means swiping up

      if (deltaY > 0) {
        // Swiping up
        currentDistance = deltaY;
      }
    };

    const handleTouchEnd = () => {
      if (currentDistance > 80) {
        // Swiped up enough, open bottom sheet
        setShowBottomSheet(true);
      }
      startY = 0;
      currentDistance = 0;
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [capturedImage, showBottomSheet]);

  return (
    <div className="flex overflow-hidden relative flex-col justify-center items-center w-full h-screen min-h-screen">
      {/* Background with Floral Pattern - Same as Home and Instruction pages */}
      <div
        className="absolute top-0 left-0 w-full h-full z-[1]"
        style={{
          backgroundImage: `url(${BgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Floral overlay */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-90"
          style={{
            backgroundImage: `url(${FlowerBgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-[2] flex flex-col items-center justify-center w-full px-4 gap-4 md:gap-6 py-4 md:py-6">
        {/* Text Section - Top */}
        <div className="flex flex-col gap-2 items-center mb-2 md:gap-3 md:mb-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl text-center leading-relaxed font-krylon text-[#5d4037]">
            Show that yellow glow!
          </h1>
          <p className="text-3xl md:text-5xl lg:text-6xl font-dynalight text-[#5d4037] italic">
            #SabiGautHim
          </p>
        </div>

        {/* Video/Image Container */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <canvas ref={compositeCanvasRef} style={{ display: "none" }} />
        <div
          ref={imageContainerRef}
          className="flex relative justify-center items-center w-full"
          style={{
            maxWidth: "70vw",
            aspectRatio: "2/3", // Postcard aspect ratio (2:3 portrait)
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
                  className="object-cover w-full h-full rounded-2xl border-4 border-white shadow-2xl pointer-events-none"
                  style={{
                    display: "block",
                    aspectRatio: "2/3",
                    objectFit: "cover",
                    maxHeight: "85vh",
                    minHeight: "60vh",
                  }}
                  onLoad={() => {
                    if (imageRef.current) {
                      setImageDimensions({
                        width: imageRef.current.offsetWidth,
                        height: imageRef.current.offsetHeight,
                      });
                    }
                  }}
                />
                {/* Props overlay - positioned absolutely over the image */}
                {imageDimensions.width > 0 && (
                  <div
                    className="absolute inset-0"
                    style={{ borderRadius: "1rem", pointerEvents: "none" }}
                  >
                    {selectedProps.map((prop) => (
                      <div key={prop.id} style={{ pointerEvents: "auto" }}>
                        <PropItem
                          prop={prop}
                          onUpdate={updateProp}
                          onDelete={deleteProp}
                          containerWidth={imageDimensions.width}
                          containerHeight={imageDimensions.height}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {countdown && (
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
          )}
        </div>

        {/* Button Section - Bottom */}
        <AnimatePresence mode="wait">
          {!capturedImage ? (
            <motion.div
              key="capture-button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="flex gap-4 mt-4 md:gap-6 md:mt-6"
            >
              <motion.button
                onClick={captureImage}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  px-[14vw] py-[4vw] md:px-20 md:py-5 
                  text-[5vw] md:text-[3vw] lg:text-2xl font-semibold 
                  text-white bg-[#e91e63] hover:bg-[#c2185b] 
                  transition-all duration-300 shadow-lg hover:shadow-xl 
                  rounded-tl-2xl rounded-br-2xl 
                  font-krylon tracking-wider
                  ${loading ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {loading ? "Capturing..." : "Capture"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="action-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="flex gap-4 mt-4 md:gap-6 md:mt-6"
            >
              <motion.button
                onClick={async () => {
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
                }}
                disabled={isRestarting}
                whileHover={!isRestarting ? { scale: 1.05 } : {}}
                whileTap={!isRestarting ? { scale: 0.95 } : {}}
                className={`
                  px-[12vw] py-[4vw] md:px-16 md:py-5 
                  text-[4vw] md:text-[2.5vw] lg:text-xl font-semibold 
                  text-white transition-all duration-300 
                  shadow-lg hover:shadow-xl 
                  rounded-tl-2xl rounded-br-2xl font-krylon tracking-wider
                  ${
                    isRestarting
                      ? "bg-gray-500 opacity-75 cursor-not-allowed"
                      : "bg-gray-600 hover:bg-gray-700"
                  }
                `}
              >
                {isRestarting ? "Starting..." : "Retake"}
              </motion.button>

              <motion.button
                onClick={submitImage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
                  px-[12vw] py-[4vw] md:px-16 md:py-5 
                  text-[4vw] md:text-[2.5vw] lg:text-xl font-semibold 
                  text-white bg-[#e91e63] hover:bg-[#c2185b] 
                  transition-all duration-300 shadow-lg hover:shadow-xl 
                  rounded-tl-2xl rounded-br-2xl 
                  font-krylon tracking-wider
                "
              >
                Submit
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swipe Up Area and Indicator */}
        {capturedImage && !showBottomSheet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 items-center pb-4 mt-20 cursor-pointer"
            onClick={() => setShowBottomSheet(true)}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 }}
              className="text-[#e91e63] text-2xl"
            >
              <IoChevronUp className="text-2xl" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[#e91e63] text-5xl font-bold font-krylon"
              style={{
                textShadow:
                  "4px 4px 8px rgba(0, 0, 0, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.4)",
              }}
            >
              Swipe Up to Add Props & Frames
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Bottom Sheet for Props and Frames */}
      <BottomSheet
        isOpen={showBottomSheet && capturedImage}
        onClose={() => setShowBottomSheet(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {/* Tabs */}
        <div className="flex border-b-2 border-[#e91e63]">
          <motion.button
            onClick={() => setActiveTab("props")}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 py-4 text-center font-krylon text-lg md:text-xl transition-colors ${
              activeTab === "props"
                ? "bg-[#e91e63] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Props
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("frames")}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 py-4 text-center font-krylon text-lg md:text-xl transition-colors ${
              activeTab === "frames"
                ? "bg-[#e91e63] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Frames
          </motion.button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {activeTab === "props" ? (
            <div className="grid grid-cols-3 gap-4">
              {availableProps &&
                availableProps.map((prop, index) => (
                  <motion.button
                    key={prop.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addProp(prop)}
                    className="flex flex-col items-center p-2 rounded-lg transition-colors hover:bg-gray-100"
                  >
                    <img
                      src={prop.url}
                      alt={prop.name}
                      className="object-contain mb-2 w-full h-24"
                    />
                    <span className="text-xs text-center text-gray-700 font-krylon">
                      {prop.name}
                    </span>
                  </motion.button>
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {selectedFrame && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={removeFrame}
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-red-500 transition-colors hover:bg-red-50"
                >
                  <span className="text-sm text-red-600 font-krylon">
                    Remove Frame
                  </span>
                </motion.button>
              )}
              {frames &&
                frames.map((frame, index) => (
                  <motion.button
                    key={frame.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => applyFrame(frame)}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-colors ${
                      selectedFrame?.id === frame.id
                        ? "border-[#e91e63] bg-pink-50"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <img
                      src={frame.url}
                      alt={frame.name}
                      className="object-contain mb-2 w-full h-32"
                    />
                    <span className="text-xs text-center text-gray-700 font-krylon">
                      {frame.name}
                    </span>
                  </motion.button>
                ))}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

export default Capture;
