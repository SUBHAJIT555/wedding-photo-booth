import { IoHome, IoQrCode } from "react-icons/io5";
import { ImPrinter } from "react-icons/im";
import { Link } from "react-router-dom";
import QRModal from "../component/QRModal";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import Logo from "../component/Logo";
import LoadingSwapping from "../component/LoadingSwapping";
import printingVideo from "../assets/printing.webm";
import { getData } from "../utils/localStorageDB";
import { uploadImage } from "../utils/uploadImage";
import TalabatIcon from "../assets/logo/talabat-icon.svg";
import TalabatLogo from "../assets/logo/remix-logo.svg";

const BRAND_LABELS = [
  {
    id: 1,
    name: "Classic",
    bgColor: "#FF5900",
    textColor: "#F4EDE3",
    text: "Powered by Talabat",
  },
  {
    id: 2,
    name: "Minimal",
    bgColor: "#F4EDE3",
    textColor: "#FF5900",
    text: "Powered by Talabat",
  },
  {
    id: 3,
    name: "Dark",
    bgColor: "#411517",
    textColor: "#FF5900",
    text: "Powered by Talabat",
  },
];

function Preview() {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swaploader, setswaloader] = useState("none");
  const [selectedLabel, setSelectedLabel] = useState(BRAND_LABELS[0]);
  const [finalImageWithLabel, setFinalImageWithLabel] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [shortUrl, setShortUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef(null);

  const savedImage = getData("capturedImage");
  const finalUrl = finalImageWithLabel || savedImage;

  useEffect(() => {
    setswaloader(loading ? "block" : "none");
  }, [loading]);

  const uploadToImgbb = async (base64Image) => {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY || "7a9d878e0d570c5d3f4b8c8d8a1e9c2f";
    
    // Remove data:image/xxx;base64, prefix if present
    const base64Data = base64Image.includes(",") 
      ? base64Image.split(",")[1] 
      : base64Image;

    const formData = new FormData();
    formData.append("image", base64Data);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || "Upload failed");
    }
  };

  const handleQRClick = async () => {
    if (shortUrl) {
      setIsQRModalOpen(true);
      return;
    }

    setIsUploading(true);
    try {
      const imageToUpload = finalImageWithLabel || savedImage;
      
      // Try server upload first
      try {
        const result = await uploadImage(imageToUpload);
        setUploadedUrl(result.url);
        setShortUrl(result.shortUrl);
        setIsQRModalOpen(true);
        return;
      } catch (serverError) {
        console.log("Server upload failed, trying imgbb...");
      }

      // Fallback to imgbb
      const imgbbUrl = await uploadToImgbb(imageToUpload);
      setShortUrl(imgbbUrl);
      setIsQRModalOpen(true);
    } catch (error) {
      console.error("Error uploading image:", error);
      // If all uploads fail, still open modal with base64 (will show download option)
      setIsQRModalOpen(true);
    } finally {
      setIsUploading(false);
    }
  };

  const composeImageWithLabel = useCallback(async () => {
    if (!savedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Fixed 4x6 inch postcard size at 300 DPI
    const POSTCARD_W = 1200; // 4 inches * 300 DPI
    const POSTCARD_H = 1800; // 6 inches * 300 DPI
    const LABEL_HEIGHT = 100; // Fixed label height

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;

      // Set canvas to postcard size + label
      canvas.width = POSTCARD_W;
      canvas.height = POSTCARD_H + LABEL_HEIGHT;

      // Background color follows selected label (default white)
      const backgroundColor = selectedLabel?.bgColor || "#ffffff";
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fit collage inside postcard area with margins so brand background shows
      const imgRatio = imgW / imgH;
      const marginX = 40;
      const marginY = 60;
      const availableW = POSTCARD_W - marginX * 2;
      const availableH = POSTCARD_H - marginY * 2;
      const areaRatio = availableW / availableH;

      let drawW, drawH, drawX, drawY;

      if (imgRatio > areaRatio) {
        // Image wider than area → fit width
        drawW = availableW;
        drawH = drawW / imgRatio;
      } else {
        // Image taller than area → fit height
        drawH = availableH;
        drawW = drawH * imgRatio;
      }

      drawX = marginX + (availableW - drawW) / 2;
      drawY = marginY + (availableH - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Draw label bar
      ctx.fillStyle = selectedLabel.bgColor;
      ctx.fillRect(0, POSTCARD_H, POSTCARD_W, LABEL_HEIGHT);

      // Layout: [logo text]  [text centered]  [icon]
      const leftLogoFontSize = 40;
      const rightIconSize = 48;
      const fontSize = 32;
      const labelCenterY = POSTCARD_H + LABEL_HEIGHT / 2;
      const leftLogoX = 40;
      const rightIconX = POSTCARD_W - rightIconSize - 40;
      const rightIconY = POSTCARD_H + (LABEL_HEIGHT - rightIconSize) / 2;

      // Load logo and icon images
      const logoImg = new Image();
      const iconImg = new Image();
      logoImg.crossOrigin = "anonymous";
      iconImg.crossOrigin = "anonymous";

      let loadedCount = 0;
      const handleLoaded = () => {
        loadedCount += 1;
        if (loadedCount < 2) return;

        // Left Talabat logo image
        const logoHeight = leftLogoFontSize + 6;
        const logoRatio = logoImg.naturalWidth / logoImg.naturalHeight || 1;
        const logoWidth = logoHeight * logoRatio;
        const logoY = POSTCARD_H + (LABEL_HEIGHT - logoHeight) / 2;
        ctx.drawImage(logoImg, leftLogoX, logoY, logoWidth, logoHeight);

        // Right small icon
        ctx.drawImage(iconImg, rightIconX, rightIconY, rightIconSize, rightIconSize);

        // Centered text
        ctx.fillStyle = selectedLabel.textColor;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(selectedLabel.text, POSTCARD_W / 2, labelCenterY);

        const composedImage = canvas.toDataURL("image/jpeg", 0.85);
        setFinalImageWithLabel(composedImage);
      };

      logoImg.onload = handleLoaded;
      iconImg.onload = handleLoaded;
      logoImg.src = TalabatLogo;
      iconImg.src = TalabatIcon;
    };

    img.src = savedImage;
  }, [savedImage, selectedLabel]);

  useEffect(() => {
    if (savedImage) {
      composeImageWithLabel();
      // Reset uploaded URL when label changes
      setUploadedUrl(null);
      setShortUrl(null);
    }
  }, [savedImage, selectedLabel, composeImageWithLabel]);

  const uint8ArrayToBase64 = (uint8Array) => {
    let binary = "";
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  const printImageAsPDF = async () => {
    try {
      setLoading(true);

      const imageToUse = finalImageWithLabel || savedImage;
      let imageArrayBuffer;

      if (imageToUse.startsWith("data:image")) {
        const base64Data = imageToUse.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        imageArrayBuffer = bytes.buffer;
      } else {
        const response = await fetch(imageToUse);
        const imageBlob = await response.blob();
        imageArrayBuffer = await imageBlob.arrayBuffer();
      }

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([288, 432]);

      const image = await pdfDoc.embedJpg(new Uint8Array(imageArrayBuffer));
      const { width, height } = image.scale(0.25);

      const x = (page.getWidth() - width) / 2;
      const y = (page.getHeight() - height) / 2;

      page.drawImage(image, { x, y, width, height });

      const pdfBytes = await pdfDoc.save();
      const pdfBase64 = uint8ArrayToBase64(new Uint8Array(pdfBytes));

      const apiKey = import.meta.env.VITE_PRINTNODE_API_KEY;
      const printerId = import.meta.env.VITE_PRINTNODE_PRINTER_ID;

      const printJob = {
        printerId: printerId,
        title: "PDF Print Job",
        contentType: "pdf_base64",
        content: pdfBase64,
        source: "React Web App",
        options: {
          fit_to_page: true,
        },
      };

      const responsePrint = await fetch("https://api.printnode.com/printjobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(apiKey + ":")}`,
        },
        body: JSON.stringify(printJob),
      });

      if (responsePrint.ok) {
        console.log("Print job sent successfully!");
      } else {
        console.error("Print failed:", await responsePrint.json());
      }
    } catch (error) {
      console.error("Error processing print job:", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 35000);
    }
  };

  return loading ? (
    <div className="w-full h-screen">
      <LoadingSwapping visibility={swaploader} src={printingVideo} />
    </div>
  ) : (
    <div className="min-h-screen w-full bg-white relative flex flex-col justify-evenly items-center overflow-hidden">
      {/* Dashed Bottom Fade Grid */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #FF5900 1px, transparent 1px),
            linear-gradient(to bottom, #FF5900 1px, transparent 1px)
          `,
          backgroundSize: "10px 10px",
          backgroundPosition: "0 0, 0 0",
          opacity: 0.3,
          maskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      {/* Amber-style glow background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #FF5900 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="flex flex-col justify-evenly items-center w-full flex-1 relative z-[2] text-white px-4 min-h-screen">
        <Logo />

        {/* Image Preview - 4x6 + label ratio */}
        <div className="group mx-auto rounded-xl overflow-hidden ring-1 ring-offset-8 ring-neutral-300" style={{ width: "min(80vw, 600px)", maxHeight: "75vh" }}>
          {finalUrl && (
            <img
              src={finalUrl}
              alt="Your photo"
              className="w-full h-auto object-contain transition-transform duration-300 "
            />
          )}
        </div>

        {/* Brand Label Selection */}
        <div className="flex flex-col items-center gap-6">
          <p className="text-[#411517] text-3xl font-krylon tracking-widest font-black">Choose Your Brand Label Style:</p>
          <div className="flex gap-5">
            {BRAND_LABELS.map((label) => (
              <button
                key={label.id}
                onClick={() => setSelectedLabel(label)}
                className={`relative flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
                  selectedLabel.id === label.id
                    ? "border-[#FF5900] ring-1 ring-[#FF5900] ring-offset-2"
                    : "border-neutral-300 border-1 ring-1 ring-offset-2 hover:border-[#FF5900]"
                }`}
                style={{ backgroundColor: label.bgColor }}
              >
                {selectedLabel.id === label.id && (
                  <motion.div
                    className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-md"
                    animate={{ rotate: [0, -10, 10, -8, 8, 0] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 1.2,
                      ease: "easeInOut",
                    }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="#22c55e"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12.01 2.011a3.2 3.2 0 0 1 2.113 .797l.154 .145l.698 .698a1.2 1.2 0 0 0 .71 .341l.135 .008h1a3.2 3.2 0 0 1 3.195 3.018l.005 .182v1c0 .27 .092 .533 .258 .743l.09 .1l.697 .698a3.2 3.2 0 0 1 .147 4.382l-.145 .154l-.698 .698a1.2 1.2 0 0 0 -.341 .71l-.008 .135v1a3.2 3.2 0 0 1 -3.018 3.195l-.182 .005h-1a1.2 1.2 0 0 0 -.743 .258l-.1 .09l-.698 .697a3.2 3.2 0 0 1 -4.382 .147l-.154 -.145l-.698 -.698a1.2 1.2 0 0 0 -.71 -.341l-.135 -.008h-1a3.2 3.2 0 0 1 -3.195 -3.018l-.005 -.182v-1a1.2 1.2 0 0 0 -.258 -.743l-.09 -.1l-.697 -.698a3.2 3.2 0 0 1 -.147 -4.382l.145 -.154l.698 -.698a1.2 1.2 0 0 0 .341 -.71l.008 -.135v-1l.005 -.182a3.2 3.2 0 0 1 3.013 -3.013l.182 -.005h1a1.2 1.2 0 0 0 .743 -.258l.1 -.09l.698 -.697a3.2 3.2 0 0 1 2.269 -.944zm3.697 7.282a1 1 0 0 0 -1.414 0l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.32 1.497l2 2l.094 .083a1 1 0 0 0 1.32 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z" />
                    </svg>
                  </motion.div>
                )}
                <img src={TalabatIcon} alt="Talabat" className="w-8 h-8 border border-neutral-300 rounded-xl ring-1 ring-offset-2 ring-neutral-300" />
                <span style={{ color: label.textColor }} className="font-semibold text-base">
                  {label.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-10 justify-center text-zinc-200">
          <button
            onClick={printImageAsPDF}
            className="border-[1px] border-zinc-300 p-3 rounded-2xl bg-neutral-100 hover:bg-[#FF5900] group transition-all duration-300 ring-1 ring-offset-4 ring-neutral-300"
          >
            <ImPrinter className="text-3xl md:text-5xl text-[#FF5900] group-hover:text-[#ffffff]" />
          </button>

          <button
            onClick={handleQRClick}
            disabled={isUploading}
            className={`border-[1px] border-zinc-300 p-2 px-3 rounded-2xl bg-neutral-100 hover:bg-[#FF5900] group transition-all duration-300 ring-1 ring-offset-4 ring-neutral-300 ${isUploading ? "opacity-50" : ""}`}
          >
            {isUploading ? (
              <div className="text-3xl md:text-5xl text-[#FF5900] animate-spin">⏳</div>
            ) : (
              <IoQrCode className="text-3xl md:text-5xl text-[#FF5900] group-hover:text-[#ffffff]" />
            )}
          </button>

          <Link to="/">
            <button className="border-[1px] border-zinc-300 p-2 rounded-2xl bg-neutral-100 hover:bg-[#FF5900] group transition-all duration-300 ring-1 ring-offset-4 ring-neutral-300">
              <IoHome className="text-3xl md:text-6xl text-[#FF5900] group-hover:text-[#ffffff]" />
            </button>
          </Link>
        </div>

        <QRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          data={shortUrl || finalUrl}
        />
      </div>
    </div>
  );
}

export default Preview;
