import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveData } from "../utils/localStorageDB";
import { useNavigate } from "react-router-dom";
import BgImage from "../assets/images/home/Bg.png";
import FlowerBgImage from "../assets/images/home/Flower-Bg.png";
import BottomSheet from "../component/BottomSheet";
import PropItem from "../component/PropItem";
import { props as availableProps, frames } from "../constant/propsAndFrames";
import { uploadImage } from "../utils/uploadImage";
import { IoRefresh, IoImages, IoCheckmarkCircle } from "react-icons/io5";
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

      const rect = container.getBoundingClientRect();

      const newProp = {
        ...prop,
        originalId: prop.id, // Store original prop id for tracking
        id: `prop-${nextPropId}`, // Unique instance id for rendering
        position: {
          x: rect.width / 2,
          y: rect.height / 2,
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
        setPropsButtonClicked(false); // Reset animation state for new image
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
                  px-[14vw] py-[4vw] md:px-16 md:py-5 
                  text-[5vw] md:text-[3vw] lg:text-4xl font-semibold 
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
              className="flex gap-4 justify-center items-center px-4 mt-6 w-full md:gap-6 md:mt-8"
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
                }}
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
                  transition-all duration-200 cursor-pointer
                  flex items-center justify-center
                  bg-white/80 backdrop-blur-sm
                  relative
                  ${isRestarting ? "opacity-75 cursor-not-allowed" : ""}
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
                  onClick={() => {
                    setShowBottomSheet(true);
                    setPropsButtonClicked(true);
                  }}
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
                    transition-all duration-200 cursor-pointer
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
                onClick={submitImage}
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
                  transition-all duration-200 cursor-pointer
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
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Sheet for Props and Frames */}
      <BottomSheet
        isOpen={showBottomSheet && capturedImage}
        onClose={() => setShowBottomSheet(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {/* Tabs */}
        <div className="flex gap-2 p-1 mb-4 bg-gray-100 rounded-2xl">
          <motion.button
            onClick={() => setActiveTab("props")}
            // whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-3 px-4 text-center font-krylon text-base md:text-lg rounded-xl transition-all duration-300 ${
              activeTab === "props"
                ? "bg-gradient-to-r from-[#e91e63] to-[#f06292] text-white shadow-lg"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
            style={
              activeTab === "props"
                ? {
                    boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)",
                  }
                : {}
            }
          >
            Props
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("frames")}
            // whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-3 px-4 text-center font-krylon text-base md:text-lg rounded-xl transition-all duration-300 ${
              activeTab === "frames"
                ? "bg-gradient-to-r from-[#e91e63] to-[#f06292] text-white shadow-lg"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
            style={
              activeTab === "frames"
                ? {
                    boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)",
                  }
                : {}
            }
          >
            Frames
          </motion.button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 -mx-4">
          {activeTab === "props" ? (
            <div className="grid grid-cols-3 gap-3 p-4">
              {availableProps &&
                availableProps.map((prop, index) => {
                  const isSelected = isPropSelected(prop);
                  return (
                    <motion.button
                      key={prop.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      // whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleProp(prop)}
                      className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-br from-[#e91e63]/10 to-[#f06292]/10 border-2 border-[#e91e63] shadow-md"
                          : "bg-white border-2 border-gray-200 hover:border-[#e91e63]/50 hover:shadow-md"
                      }`}
                      style={
                        isSelected
                          ? {
                              boxShadow: "0 4px 12px rgba(233, 30, 99, 0.2)",
                            }
                          : {}
                      }
                    >
                      {/* Checkmark Badge */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#e91e63] to-[#f06292] rounded-full flex items-center justify-center shadow-lg z-10"
                        >
                          <IoCheckmarkCircle className="text-sm text-white" />
                        </motion.div>
                      )}
                      <img
                        src={prop.url}
                        alt={prop.name}
                        className="object-contain mb-2 w-full h-20 md:h-24"
                      />
                      <span
                        className={`text-xs text-center font-krylon ${
                          isSelected
                            ? "text-[#e91e63] font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {prop.name}
                      </span>
                    </motion.button>
                  );
                })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-4">
              {frames &&
                frames.map((frame, index) => {
                  const isSelected = selectedFrame?.id === frame.id;
                  return (
                    <motion.button
                      key={frame.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      // whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        isSelected ? removeFrame() : applyFrame(frame)
                      }
                      className={`relative flex flex-col items-center p-2 rounded-xl transition-all  duration-200 ${
                        isSelected 
                          ? "bg-gradient-to-br from-[#e91e63]/10 to-[#f06292]/10 border-2 border-[#e91e63] shadow-lg"
                          : "bg-white border-2 border-gray-200 hover:border-[#e91e63]/50 hover:shadow-md"
                      }`}
                      style={
                        isSelected
                          ? {
                              boxShadow: "0 6px 20px rgba(233, 30, 99, 0.3)",
                            }
                          : {}
                      }
                    >
                      {/* Checkmark Badge */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-[#e91e63] to-[#f06292] rounded-full flex items-center justify-center shadow-lg z-10"
                        >
                          <IoCheckmarkCircle className="text-xs text-white md:text-base" />
                        </motion.div>
                      )}
                      <img
                        src={frame.url}
                        alt={frame.name}
                        className="object-contain mb-2 w-full h-24 rounded-lg md:h-32"
                      />
                      <span
                        className={`text-xs md:text-sm text-center font-krylon ${
                          isSelected
                            ? "text-[#e91e63] font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {frame.name}
                      </span>
                    </motion.button>
                  );
                })}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

export default Capture;
