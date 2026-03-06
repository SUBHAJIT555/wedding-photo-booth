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
  { id: 1, name: "Classic", bgColor: "#FF5900", textColor: "#F4EDE3", text: "Powered by Talabat" },
  { id: 2, name: "Minimal", bgColor: "#F4EDE3", textColor: "#FF5900", text: "Powered by Talabat" },
  { id: 3, name: "Dark", bgColor: "#411517", textColor: "#FF5900", text: "Powered by Talabat" },
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

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const composeImageWithLabel = useCallback(async () => {
    if (!savedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const POSTCARD_W = 1200;
    const POSTCARD_H = 1800;
    const LABEL_HEIGHT = 100;

    canvas.width = POSTCARD_W;
    canvas.height = POSTCARD_H;

    ctx.fillStyle = selectedLabel.bgColor;
    ctx.fillRect(0, 0, POSTCARD_W, POSTCARD_H);

    const img = await loadImage(savedImage);

    const IMAGE_AREA_H = POSTCARD_H - LABEL_HEIGHT;

    const marginX = 40;
    const marginY = 60;

    const availableW = POSTCARD_W - marginX * 2;
    const availableH = IMAGE_AREA_H - marginY * 2;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const areaRatio = availableW / availableH;

    let drawW, drawH;

    if (imgRatio > areaRatio) {
      drawW = availableW;
      drawH = drawW / imgRatio;
    } else {
      drawH = availableH;
      drawW = drawH * imgRatio;
    }

    const drawX = marginX + (availableW - drawW) / 2;
    const drawY = marginY + (availableH - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    const labelY = POSTCARD_H - LABEL_HEIGHT;

    ctx.fillStyle = selectedLabel.bgColor;
    ctx.fillRect(0, labelY, POSTCARD_W, LABEL_HEIGHT);

    const [logoImg, iconImg] = await Promise.all([
      loadImage(TalabatLogo),
      loadImage(TalabatIcon),
    ]);

    const leftLogoFontSize = 40;
    const rightIconSize = 48;

    const logoHeight = leftLogoFontSize + 6;
    const logoRatio = logoImg.naturalWidth / logoImg.naturalHeight || 1;
    const logoWidth = logoHeight * logoRatio;
    const logoY = labelY + (LABEL_HEIGHT - logoHeight) / 2;

    ctx.drawImage(logoImg, 40, logoY, logoWidth, logoHeight);

    const rightIconX = POSTCARD_W - rightIconSize - 40;
    const rightIconY = labelY + (LABEL_HEIGHT - rightIconSize) / 2;

    ctx.drawImage(iconImg, rightIconX, rightIconY, rightIconSize, rightIconSize);

    ctx.fillStyle = selectedLabel.textColor;
    ctx.font = `bold 32px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(selectedLabel.text, POSTCARD_W / 2, labelY + LABEL_HEIGHT / 2);

    const composedImage = canvas.toDataURL("image/jpeg", 0.9);
    setFinalImageWithLabel(composedImage);
  }, [savedImage, selectedLabel]);

  useEffect(() => {
    if (savedImage) {
      composeImageWithLabel();
      setUploadedUrl(null);
      setShortUrl(null);
    }
  }, [savedImage, selectedLabel, composeImageWithLabel]);

  /* ---------------- PRINT ---------------- */

  const printImageAsPDF = async () => {
    try {
      setLoading(true);

      const imageToUse = finalImageWithLabel || savedImage;
      const base64Data = imageToUse.split(",")[1];

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([288, 432]);

      const image = await pdfDoc.embedJpg(Buffer.from(base64Data, "base64"));
      page.drawImage(image, { x: 0, y: 0, width: 288, height: 432 });

      const pdfBytes = await pdfDoc.save();
      const pdfBase64 = btoa(
        String.fromCharCode(...new Uint8Array(pdfBytes))
      );

      await fetch("https://api.printnode.com/printjobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(import.meta.env.VITE_PRINTNODE_API_KEY + ":")}`,
        },
        body: JSON.stringify({
          printerId: import.meta.env.VITE_PRINTNODE_PRINTER_ID,
          title: "4x6 Postcard",
          contentType: "pdf_base64",
          content: pdfBase64,
          source: "React Web App",
        }),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setLoading(false), 35000);
    }
  };

  /* ---------------- UI ---------------- */

  return loading ? (
    <div className="w-full h-screen">
      <LoadingSwapping visibility={swaploader} src={printingVideo} />
    </div>
  ) : (
    <div className="min-h-screen w-full bg-white relative flex flex-col justify-evenly items-center overflow-hidden">
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="flex flex-col justify-evenly items-center w-full flex-1 relative z-[2] px-4 min-h-screen">
        <Logo />

        <div
          className="mx-auto rounded-xl overflow-hidden ring-1 ring-offset-8 ring-neutral-300"
          style={{ width: "min(80vw, 600px)", maxHeight: "75vh" }}
        >
          {finalUrl && (
            <img
              src={finalUrl}
              alt="Preview"
              className="w-full h-auto object-contain"
            />
          )}
        </div>

        <div className="flex gap-5">
          {BRAND_LABELS.map((label) => (
            <button
              key={label.id}
              onClick={() => setSelectedLabel(label)}
              className={`px-6 py-4 rounded-2xl border-2 ${
                selectedLabel.id === label.id
                  ? "border-[#FF5900]"
                  : "border-neutral-300"
              }`}
              style={{ backgroundColor: label.bgColor }}
            >
              <span style={{ color: label.textColor }}>
                {label.name}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-10">
          <button
            onClick={printImageAsPDF}
            className="p-3 rounded-2xl bg-[#FF5900] text-white hover:bg-[#e04d00]"
          >
            <ImPrinter size={40} />
          </button>

          <button
            onClick={() => setIsQRModalOpen(true)}
            className="p-3 rounded-2xl bg-[#FF5900] text-white hover:bg-[#e04d00]"
          >
            <IoQrCode size={40} />
          </button>

          <Link to="/">
            <button className="p-3 rounded-2xl bg-[#FF5900] text-white hover:bg-[#e04d00]">
              <IoHome size={40} />
            </button>
          </Link>
        </div>

        <QRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          data={finalUrl}
        />
      </div>
    </div>
  );
}

export default Preview;