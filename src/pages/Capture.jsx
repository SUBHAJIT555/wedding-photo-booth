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
import { transformUploadResult } from "../utils/urlTransform";
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
    // setCountdown(5);
    setCountdown(1);
  };

  const submitImage = async () => {
    console.log("Submitting image...");
    setLoading(true);

    try {
      // ✅ Compose final image with frame + props
      // await new Promise((resolve) => {
      //   composeFinalImage();
      //   // Wait for image composition to complete
      //   setTimeout(resolve, 500);
      // });

      await composeFinalImage();

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
      console.log("Uploading image to server...");
      const uploadResult = await uploadImage(imageToSave);
      console.log("Image uploaded:", uploadResult);

      stopVideo();

      // Transform localhost URLs to include /photo-booth/ path
      const transformedResult = transformUploadResult(uploadResult);
      console.log("Transformed URLs:", transformedResult);

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
    console.log(
      "in update Final Image function in update Final Image function"
    );
    if (!compositeCanvasRef.current) return;
    console.log("in update Final Image function");
    const image = compositeCanvasRef.current.toDataURL("image/png");
    setFinalImage(image);
  }, []);

  // const renderCompositeImage = useCallback(() => {
  //   if (!capturedImage || !compositeCanvasRef.current) return;

  //   const canvas = compositeCanvasRef.current;
  //   const img = new Image();
  //   img.onload = () => {
  //     const dpr = window.devicePixelRatio || 1;
  //     canvas.width = img.width * dpr;
  //     canvas.height = img.height * dpr;
  //     // canvas.width = img.width;
  //     // canvas.height = img.height;
  //     const ctx = canvas.getContext("2d");
  //     ctx.scale(dpr, dpr);

  //     // Draw base image
  //     ctx.drawImage(img, 0, 0);

  //     // Draw frame if selected
  //     if (selectedFrame) {
  //       const frameImg = new Image();
  //       frameImg.crossOrigin = "anonymous";
  //       frameImg.onload = () => {
  //         ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
  //         updateFinalImage();
  //       };
  //       frameImg.src = selectedFrame.url;
  //     } else {
  //       updateFinalImage();
  //     }
  //   };
  //   img.src = capturedImage;
  // }, [capturedImage, selectedFrame, updateFinalImage]);

  // useEffect(() => {
  //   renderCompositeImage();
  // }, [renderCompositeImage, selectedFrame]);

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

    // Re-render the image cleanly
    composeFinalImage();
    // setSelectedFrame(frame);
  };

  const removeFrame = () => {
    setSelectedFrame(null);
  };

  const INNER_HOLE = {
    x: 310,
    y: 330,
    w: 1750,
    h: 2350,
  };
  function drawDebugLabel(ctx, text, x, y) {
    ctx.font = "32px Arial";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y - 36, ctx.measureText(text).width + 20, 40);
    ctx.fillStyle = "white";
    ctx.fillText(text, x + 10, y - 10);
  }

  // const composeFinalImage = useCallback(() => {
  //   if (!capturedImage || !compositeCanvasRef.current) return;

  //   const FRAME_W = 2363;
  //   const FRAME_H = 3544;

  //   const INNER_X = INNER_HOLE.x;
  //   const INNER_Y = INNER_HOLE.y;
  //   const INNER_W = INNER_HOLE.w;
  //   const INNER_H = INNER_HOLE.h;

  //   // const INNER_X = 148;
  //   // const INNER_Y = 260;
  //   // const INNER_W = 2050;
  //   // const INNER_H = 2750;

  //   const canvas = compositeCanvasRef.current;
  //   const ctx = canvas.getContext("2d");

  //   canvas.width = FRAME_W;
  //   canvas.height = FRAME_H;

  //   ctx.fillStyle = "white";
  //   ctx.fillRect(0, 0, FRAME_W, FRAME_H);

  //   const img = new Image();

  //   img.onload = async () => {
  //     const srcW = img.width;
  //     const srcH = img.height;
  //     const imgRatio = srcW / srcH;

  //     let drawX, drawY, drawW, drawH;

  //     // ============================================
  //     // 🔵 CASE 1 — NO FRAME SELECTED
  //     // ============================================
  //     if (!selectedFrame) {
  //       const canvasRatio = FRAME_W / FRAME_H;

  //       if (imgRatio > canvasRatio) {
  //         drawH = FRAME_H;
  //         drawW = drawH * imgRatio;
  //         drawX = (FRAME_W - drawW) / 2;
  //         drawY = 0;
  //       } else {
  //         drawW = FRAME_W;
  //         drawH = drawW / imgRatio;
  //         drawX = 0;
  //         drawY = (FRAME_H - drawH) / 2;
  //       }

  //       // Draw camera image
  //       ctx.drawImage(img, drawX, drawY, drawW, drawH);

  //       // ✅ PRELOAD AND DRAW PROPS
  //       await drawPropsAsync(ctx);

  //       updateFinalImage();
  //       return;
  //     }

  //     // ============================================
  //     // 🟠 CASE 2 — FRAME SELECTED
  //     // ============================================
  //     const holeRatio = INNER_W / INNER_H;

  //     if (imgRatio > holeRatio) {
  //       drawW = INNER_W;
  //       drawH = drawW / imgRatio;
  //       drawX = INNER_X;
  //       drawY = INNER_Y + (INNER_H - drawH) / 2;
  //     } else {
  //       drawH = INNER_H;
  //       drawW = drawH * imgRatio;
  //       drawX = INNER_X + (INNER_W - drawW) / 2;
  //       drawY = INNER_Y;
  //     }

  //     // Draw camera image
  //     ctx.drawImage(img, drawX, drawY, drawW, drawH);

  //     // ✅ Draw props BEHIND frame (optional)
  //     await drawPropsAsync(ctx);

  //     // Draw frame overlay
  //     const frameImg = new Image();
  //     frameImg.crossOrigin = "anonymous";
  //     frameImg.onload = async () => {
  //       ctx.drawImage(frameImg, 0, 0, FRAME_W, FRAME_H);

  //       // ✅ Draw props ON TOP of frame
  //       await drawPropsAsync(ctx);

  //       updateFinalImage();
  //     };
  //     frameImg.src = selectedFrame.url;
  //   };

  //   img.src = capturedImage;
  //   console.log("img.naturalWidth", img.naturalWidth);
  //   console.log("img.naturalHeight", img.naturalHeight);
  // }, [
  //   capturedImage,
  //   selectedFrame,
  //   selectedProps,
  //   imageDimensions,
  //   updateFinalImage,
  // ]);
  const composeFinalImage = useCallback(() => {
    return new Promise((resolve) => {
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
        const srcW = img.width;
        const srcH = img.height;
        const imgRatio = srcW / srcH;

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

        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Draw props BEHIND frame
        await drawPropsAsync(ctx);

        // Load frame
        const frameImg = new Image();
        frameImg.crossOrigin = "anonymous";
        frameImg.onload = async () => {
          ctx.drawImage(frameImg, 0, 0, FRAME_W, FRAME_H);

          // Draw props ON TOP of frame
          await drawPropsAsync(ctx);

          updateFinalImage();
          resolve(); // 🎯 FINALLY resolve here
        };

        frameImg.src = selectedFrame.url;
      };

      img.src = capturedImage;
    });
  }, [capturedImage, selectedFrame, selectedProps, INNER_HOLE]);

  const drawPropsAsync = async (ctx) => {
    if (!imageDimensions.width || !selectedProps.length) return;

    const FRAME_W = 2363;
    const FRAME_H = 3544;
    const { x: INNER_X, y: INNER_Y, w: INNER_W, h: INNER_H } = INNER_HOLE;

    // PREVIEW camera resolution (your fixed design space)
    const PREVIEW_W = imageDimensions.width;
    const PREVIEW_H = imageDimensions.height;

    // BASE camera resolution (your drawing baseline)
    const BASE_W = 2000;
    const BASE_H = 3000;

    // PREVIEW → BASE scale
    const previewScaleX = PREVIEW_W / BASE_W;
    const previewScaleY = PREVIEW_H / BASE_H;

    // BASE → FINAL CANVAS scale
    const finalScaleX = selectedFrame ? INNER_W / BASE_W : FRAME_W / BASE_W;
    const finalScaleY = selectedFrame ? INNER_H / BASE_H : FRAME_H / BASE_H;

    // LOAD PROP IMAGES
    const loadedProps = await Promise.all(
      selectedProps.map((prop) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve({ prop, img });
          img.onerror = () => resolve(null);
          img.src = prop.url;
        });
      })
    );

    loadedProps.forEach((item) => {
      if (!item) return;

      const { prop, img } = item;

      // ---------------------------------------
      // 1️⃣ CONVERT PREVIEW SIZE → FINAL SIZE
      // ---------------------------------------
      const finalW = (prop.size.width / previewScaleX) * finalScaleX;
      const finalH = (prop.size.height / previewScaleY) * finalScaleY;

      // ---------------------------------------
      // 2️⃣ CONVERT PREVIEW POSITION → FINAL POS
      // ---------------------------------------
      const baseX = (prop.position.x - imageDimensions.offsetX) / previewScaleX;
      const baseY = (prop.position.y - imageDimensions.offsetY) / previewScaleY;

      const canvasX = baseX * finalScaleX + (selectedFrame ? INNER_X : 0);
      const canvasY = baseY * finalScaleY + (selectedFrame ? INNER_Y : 0);

      // ---------------------------------------
      // 3️⃣ DRAW PROP
      // ---------------------------------------
      ctx.save();
      ctx.translate(canvasX, canvasY);
      ctx.rotate(((prop.rotation || 0) * Math.PI) / 180);
      ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH);
      ctx.restore();

      // ---------------------------------------
      // 4️⃣ DEBUG LABEL
      // ---------------------------------------
      const debug = `x:${prop.position.x} y:${prop.position.y} w:${prop.size.width} h:${prop.size.height}`;
      ctx.font = "40px Arial";
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillText(debug, canvasX - finalW / 2, canvasY - finalH / 2 - 20);
    });
  };

  // const drawPropsAsync = async (ctx) => {
  //   if (!imageDimensions.width || !selectedProps.length) {
  //     console.log("❌ Cannot draw props:", {
  //       imageDimensions,
  //       propsCount: selectedProps.length,
  //     });
  //     return;
  //   }

  //   console.log("✅ Drawing Props:", {
  //     props: selectedProps.map((p) => ({
  //       x: p.position.x,
  //       y: p.position.y,
  //       w: p.size?.width,
  //       h: p.size?.height,
  //       rot: p.rotation,
  //     })),
  //   });

  //   const FRAME_W = 2363;
  //   const FRAME_H = 3544;

  //   const { x: INNER_X, y: INNER_Y, w: INNER_W, h: INNER_H } = INNER_HOLE;

  //   const isFrame = !!selectedFrame;

  //   // SCALE CAMERA IMAGE → PREVIEW IMAGE
  //   const previewScaleX = imageDimensions.width / 2000;
  //   const previewScaleY = imageDimensions.height / 3000;

  //   // SCALE BASE IMAGE → FINAL CANVAS
  //   const camScaleX = isFrame ? INNER_W / 2000 : FRAME_W / 2000;
  //   const camScaleY = isFrame ? INNER_H / 3000 : FRAME_H / 3000;

  //   // LOAD ALL PROP IMAGES
  //   const loadedProps = await Promise.all(
  //     selectedProps.map((prop) => {
  //       return new Promise((resolve) => {
  //         const img = new Image();
  //         img.crossOrigin = "anonymous";
  //         img.onload = () => resolve({ prop, img });
  //         img.onerror = () => resolve(null);
  //         img.src = prop.url;
  //       });
  //     })
  //   );

  //   loadedProps.forEach((item) => {
  //     if (!item) return;
  //     const { prop, img } = item;

  //     // -------- SIZE -------- //
  //     let width, height;
  //     if (prop.size && typeof prop.size === "object") {
  //       width = prop.size.width * camScaleX;
  //       height = prop.size.height * camScaleY;
  //     } else {
  //       width = 120 * camScaleX;
  //       height = 120 * camScaleY;
  //     }

  //     // -------- POSITION FIX -------- //
  //     // Convert preview coordinates → base camera coordinate
  //     const baseX = (prop.position.x - imageDimensions.offsetX) / previewScaleX;
  //     const baseY = (prop.position.y - imageDimensions.offsetY) / previewScaleY;

  //     // Convert base → final canvas coordinates
  //     const canvasX = baseX * camScaleX + (isFrame ? INNER_X : 0);
  //     const canvasY = baseY * camScaleY + (isFrame ? INNER_Y : 0);

  //     // -------- DRAW PROP -------- //
  //     ctx.save();
  //     ctx.translate(canvasX, canvasY);
  //     ctx.rotate(((prop.rotation || 0) * Math.PI) / 180);
  //     ctx.drawImage(img, -width / 2, -height / 2, width, height);
  //     ctx.restore();

  //     // -------- DEBUG LABEL -------- //
  //     const debugText =
  //       `x:${Math.round(prop.position.x)} ` +
  //       `y:${Math.round(prop.position.y)} ` +
  //       `w:${Math.round(prop.size?.width)} ` +
  //       `h:${Math.round(prop.size?.height)} ` +
  //       `rot:${Math.round(prop.rotation)}`;

  //     drawDebugLabel(
  //       ctx,
  //       debugText,
  //       canvasX - width / 2,
  //       canvasY - height / 2 - 20
  //     );
  //   });
  // };

  // const drawPropsAsync = async (ctx) => {
  //   if (!imageDimensions.width || !selectedProps.length) {
  //     console.log("❌ Cannot draw props:", {
  //       imageDimensions,
  //       propsCount: selectedProps.length,
  //     });
  //     return;
  //   }

  //   console.log("✅ Drawing props:", {
  //     propsCount: selectedProps.length,
  //     imageDimensions,
  //     selectedFrame: selectedFrame?.name || "none",
  //     props: selectedProps.map((p) => ({
  //       name: p.name,
  //       position: p.position,
  //       size: p.size,
  //       rotation: p.rotation,
  //     })),
  //   });

  //   const FRAME_W = 2363;
  //   const FRAME_H = 3544;

  //   const INNER_X = INNER_HOLE.x;
  //   const INNER_Y = INNER_HOLE.y;
  //   const INNER_W = INNER_HOLE.w;
  //   const INNER_H = INNER_HOLE.h;

  //   // const displayW = imageDimensions.width;
  //   // const displayH = imageDimensions.height;

  //   const scaleX = selectedFrame
  //     ? INNER_W / imageDimensions.width
  //     : FRAME_W / imageDimensions.width;
  //   const scaleY = selectedFrame
  //     ? INNER_H / imageDimensions.height
  //     : FRAME_H / imageDimensions.height;

  //   // const scaleX = selectedFrame ? INNER_W / displayW : FRAME_W / displayW;
  //   // const scaleY = selectedFrame ? INNER_H / displayH : FRAME_H / displayH;

  //   // ✅ PRELOAD ALL PROP IMAGES
  //   const loadedProps = await Promise.all(
  //     selectedProps.map((prop) => {
  //       return new Promise((resolve) => {
  //         const img = new Image();
  //         img.crossOrigin = "anonymous";
  //         img.onload = () => resolve({ prop, img });
  //         img.onerror = () => {
  //           console.error("Failed to load prop:", prop.url);
  //           resolve(null);
  //         };
  //         img.src = prop.url;
  //       });
  //     })
  //   );

  //   // ✅ DRAW ALL LOADED PROPS
  //   loadedProps.forEach((item) => {
  //     if (!item) return;

  //     const { prop, img } = item;

  //     // ✅ FIX: Handle both object {width, height} and number formats
  //     let width, height;

  //     if (prop.size && typeof prop.size === "object") {
  //       // Size is stored as {width, height} from PropItem
  //       width = prop.size.width * scaleX;
  //       height = prop.size.height * scaleY;
  //     } else {
  //       // Fallback: size is a number or undefined
  //       const defaultSize = 100;
  //       const sizeValue = prop.size || defaultSize;
  //       width = sizeValue * scaleX;
  //       height = sizeValue * scaleY;
  //     }

  //     // Calculate position with frame offset
  //     // const x = prop.position.x * scaleX + (selectedFrame ? INNER_X : 0);
  //     // const y = prop.position.y * scaleY + (selectedFrame ? INNER_Y : 0);

  //     // PREVIEW → BASE CAMERA SCALE
  //     const previewScaleX = imageDimensions.width / 2000;
  //     const previewScaleY = imageDimensions.height / 3000;

  //     // Convert preview coords → base image coords
  //     const baseX = (prop.position.x - imageDimensions.offsetX) / previewScaleX;
  //     const baseY = (prop.position.y - imageDimensions.offsetY) / previewScaleY;

  //     // BASE IMAGE → CANVAS SCALE
  //     const camScaleX = selectedFrame ? INNER_W / 2000 : FRAME_W / 2000;
  //     const camScaleY = selectedFrame ? INNER_H / 3000 : FRAME_H / 3000;

  //     // FINAL CANVAS COORDS
  //     const canvasX = baseX * camScaleX + (selectedFrame ? INNER_X : 0);
  //     const canvasY = baseY * camScaleY + (selectedFrame ? INNER_Y : 0);

  //     // Draw the prop with rotation
  //     ctx.save();
  //     ctx.translate(canvasX, canvasY);
  //     ctx.rotate(((prop.rotation || 0) * Math.PI) / 180);
  //     ctx.drawImage(img, -width / 2, -height / 2, width, height);
  //     ctx.restore();
  //     // =========================================
  //     //  🔥 ADD THIS — Debug label drawn on canvas
  //     // =========================================
  //     const debugText = `x:${Math.round(item.prop.position.x)} y:${Math.round(
  //       prop.position.y
  //     )} w:${Math.round(prop.size?.width)} h:${Math.round(
  //       prop.size?.height
  //     )} rot:${Math.round(prop.rotation)}`;

  //     drawDebugLabel(ctx, debugText, x - width / 2, y - height / 2 - 10);
  //   });

  //   console.log("🔵 DRAWING PROP ON CANVAS", {
  //     originalX: selectedProps.map((p) => p.position.x),
  //     originalY: selectedProps.map((p) => p.position.y),
  //     offsetX: imageDimensions.offsetX,
  //     offsetY: imageDimensions.offsetY,
  //     scaleX,
  //     scaleY,
  //     finalCanvasX: Math.round(
  //       selectedProps.map(
  //         (p) => p.position.x * scaleX + (selectedFrame ? INNER_X : 0)
  //       )
  //     ),
  //     finalCanvasY: Math.round(
  //       selectedProps.map(
  //         (p) => p.position.y * scaleY + (selectedFrame ? INNER_Y : 0)
  //       )
  //     ),
  //     holeX: selectedFrame ? INNER_X : 0,
  //     holeY: selectedFrame ? INNER_Y : 0,
  //   });
  // };

  useEffect(() => {
    if (!capturedImage) return;
    composeFinalImage();
  }, [capturedImage, selectedFrame]);

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

  // useEffect(() => {
  //   if (countdown === null) return;

  //   if (countdown === 0) {
  //     if (videoRef.current && canvasRef.current) {
  //       const video = videoRef.current;
  //       const canvas = canvasRef.current;

  //       // ✅ CAPTURE EXACT CAMERA DIMENSIONS (NO RESIZE, NO CROP)
  //       const videoWidth = video.videoWidth;
  //       const videoHeight = video.videoHeight;

  //       canvas.width = videoWidth;
  //       canvas.height = videoHeight;

  //       const ctx = canvas.getContext("2d");

  //       // ✅ Draw exactly as camera gives (NO crop/stretch)
  //       ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

  //       const image = canvas.toDataURL("image/png", 1.0);

  //       setCapturedImage(image);
  //       setFinalImage(image); // Set initial final image
  //       setPropsButtonClicked(false);
  //     }

  //     setLoading(false);
  //     setCountdown(null);
  //     stopVideo();
  //     return;
  //   }

  //   const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
  //   return () => clearTimeout(timer);
  // }, [countdown, stopVideo]);

  // const composeFinalImage = useCallback(() => {
  //   if (!capturedImage || !compositeCanvasRef.current) return;

  //   const FRAME_W = 2363;
  //   const FRAME_H = 3544;

  //   // FRAME WINDOW (HOLE)
  //   const INNER_X = 120;
  //   const INNER_Y = 200;
  //   const INNER_W = 2120;
  //   const INNER_H = 2840;

  //   const canvas = compositeCanvasRef.current;
  //   const img = new Image();

  //   img.onload = () => {
  //     const ctx = canvas.getContext("2d");
  //     canvas.width = FRAME_W;
  //     canvas.height = FRAME_H;

  //     ctx.clearRect(0, 0, FRAME_W, FRAME_H);

  //     const srcW = img.width;
  //     const srcH = img.height;

  //     const imgRatio = srcW / srcH;
  //     const holeRatio = INNER_W / INNER_H;

  //     let drawW, drawH, drawX, drawY;

  //     if (selectedFrame) {
  //       // FIT CAMERA INTO FRAME HOLE
  //       if (imgRatio > holeRatio) {
  //         drawH = INNER_H;
  //         drawW = drawH * imgRatio;
  //         drawX = INNER_X + (INNER_W - drawW) / 2;
  //         drawY = INNER_Y;
  //       } else {
  //         drawW = INNER_W;
  //         drawH = drawW / imgRatio;
  //         drawX = INNER_X;
  //         drawY = INNER_Y + (INNER_H - drawH) / 2;
  //       }

  //       ctx.drawImage(img, drawX, drawY, drawW, drawH);

  //       // Draw frame
  //       const frameImg = new Image();
  //       frameImg.crossOrigin = "anonymous";
  //       frameImg.onload = () => {
  //         ctx.drawImage(frameImg, 0, 0, FRAME_W, FRAME_H);
  //         updateFinalImage();
  //       };
  //       frameImg.src = selectedFrame.url;
  //     } else {
  //       // NO FRAME → Fit inside entire canvas
  //       const canvasRatio = FRAME_W / FRAME_H;

  //       if (imgRatio > canvasRatio) {
  //         drawH = FRAME_H;
  //         drawW = drawH * imgRatio;
  //         drawX = (FRAME_W - drawW) / 2;
  //         drawY = 0;
  //       } else {
  //         drawW = FRAME_W;
  //         drawH = drawW / imgRatio;
  //         drawX = 0;
  //         drawY = (FRAME_H - drawH) / 2;
  //       }

  //       ctx.drawImage(img, drawX, drawY, drawW, drawH);

  //       updateFinalImage();
  //     }
  //   };

  //   img.src = capturedImage;
  // }, [capturedImage, selectedFrame, updateFinalImage]);

  // useEffect(() => {
  //   if (countdown === null) return;

  //   if (countdown === 0) {
  //     if (videoRef.current && canvasRef.current) {
  //       const video = videoRef.current;
  //       const canvas = canvasRef.current;

  //       const videoWidth = video.videoWidth;
  //       const videoHeight = video.videoHeight;

  //       canvas.width = videoWidth;
  //       canvas.height = videoHeight;

  //       const ctx = canvas.getContext("2d");

  //       // Draw exactly as camera gives (NO crop/stretch)
  //       ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

  //       const image = canvas.toDataURL("image/png", 1.0);

  //       setCapturedImage(image);
  //       setFinalImage(image);
  //       setPropsButtonClicked(false);
  //     }

  //     setLoading(false);
  //     setCountdown(null);
  //     stopVideo();
  //     return;
  //   }

  //   const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
  //   return () => clearTimeout(timer);
  // }, [countdown, stopVideo]);

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
                {/* <div
                  className="absolute"
                  style={{
                    left: `${(INNER_HOLE.x / 2363) * 100}%`,
                    top: `${(INNER_HOLE.y / 3544) * 100}%`,
                    width: `${(INNER_HOLE.w / 2363) * 100}%`,
                    height: `${(INNER_HOLE.h / 3544) * 100}%`,
                    border: "3px dashed red",
                    borderRadius: "30px",
                    pointerEvents: "none",
                    boxSizing: "border-box",
                  }}
                /> */}

                {/* Debug: show exact inner-hole */}
                {/* <div
                  style={{
                    position: "absolute",
                    left: `${(INNER_HOLE.x / 2363) * 100}%`,
                    top: `${(INNER_HOLE.y / 3544) * 100}%`,
                    width: `${(INNER_HOLE.w / 2363) * 100}%`,
                    height: `${(INNER_HOLE.h / 3544) * 100}%`,
                    border: "3px dashed red",
                    borderRadius: "30px",
                    zIndex: 999,
                    pointerEvents: "none",
                  }}
                /> */}

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
                  onLoad={() => {
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
                      });
                    }
                    // if (imageRef.current) {
                    //   setImageDimensions({
                    //     width: imageRef.current.offsetWidth,
                    //     height: imageRef.current.offsetHeight,
                    //   });
                    // }
                  }}
                />
                {/* Props overlay - positioned absolutely over the image */}
                {imageDimensions.width > 0 && (
                  <div
                    className="absolute inset-0 "
                    style={{ borderRadius: "1rem", pointerEvents: "none" }}
                  >
                    {selectedProps.map((prop) => (
                      <div key={prop.id} style={{ pointerEvents: "auto" }}>
                        <PropItem
                          prop={prop}
                          imageDimensions={imageDimensions}
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
