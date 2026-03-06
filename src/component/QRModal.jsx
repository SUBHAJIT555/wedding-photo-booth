import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
<<<<<<< HEAD
import shlogo from "../assets/logo/talabat-icon.svg";
=======
import shlogo from "../assets/logo/logo/talabat-icon.svg";
>>>>>>> 00a323c3192686f21f884135ad6247589e1044ef

const QRModal = ({ isOpen, onClose, data }) => {
  const [error, setError] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [copied, setCopied] = useState(false);

  // Maximum characters a QR code can hold (Version 40, alphanumeric mode)
  const MAX_QR_LENGTH = 4296;

  // Check if data is a URL (http/https) or base64
  const isUrl = (str) => {
    if (!str) return false;
    return str.startsWith("http://") || str.startsWith("https://");
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setError(null);
      setCopied(false);

      if (!data) {
        setQrValue("");
        setError(null);
      } else if (isUrl(data)) {
        // URLs are typically short enough for QR codes
        setQrValue(data);
        setError(null);
      } else if (data.length > MAX_QR_LENGTH) {
        // If it's a base64 image, show error with download option
        if (data.startsWith("data:image")) {
          setError(
            "Image data is too large for QR code. Please use the download option instead."
          );
          setQrValue("");
        } else {
          setError("Data is too long to encode in a QR code.");
          setQrValue("");
        }
      } else {
        // Data is short enough, use it
        setQrValue(data);
        setError(null);
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, data]);

  const handleDownload = () => {
    if (data && data.startsWith("data:image")) {
      const link = document.createElement("a");
      link.href = data;
      link.download = `talabat-photobooth-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyUrl = async () => {
    if (qrValue) {
      try {
        await navigator.clipboard.writeText(qrValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-70 "
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl p-12 transition-all transform bg-[#F4EDE3] rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white rounded-lg border border-neutral-300 ring-1 ring-offset-2 ring-neutral-300 bg-[#FF5900] hover:text-primary hover:bg-white hover:border-primary"
        >
          <IoMdClose />
        </button>

        <div className="mt-2">
          <div className="flex flex-col items-center space-y-4">
            {error ? (
              <div className="flex flex-col items-center space-y-4 p-6">
                <div className="text-[#FF5900] text-center text-xl font-semibold">
                  {error}
                </div>
                {data && data.startsWith("data:image") && (
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-[#FF5900] text-white rounded-xl ring-1 ring-offset-2 ring-neutral-300 hover:bg-[#FF8C4D] transition-colors font-semibold"
                  >
                    Download Image Instead
                  </button>
                )}
              </div>
            ) : qrValue ? (
              <>
                <QRCodeSVG
                  size={600}
                  value={qrValue}
                  fgColor="#FF5900"
                  bgColor="#F4EDE3"
                  imageSettings={{
                    src: shlogo,
                    x: undefined,
                    y: undefined,
                    height: 90,
                    width: 90,
                    opacity: 1,
                    excavate: true,
                  }}
                />
                {isUrl(qrValue) && (
                  <div className="flex flex-col items-center space-y-2 mt-4">
                    <button
                      onClick={handleCopyUrl}
                      className="px-4 py-2 bg-[#FF5900] text-white rounded-lg hover:bg-[#FF5900] transition-colors font-semibold text-sm "
                    >
                      {copied ? "Copied!" : "Copy URL"}
                    </button>
                    <p className="text-xs text-gray-600 text-center max-w-md break-all">
                      {qrValue}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-600 text-center">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

QRModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  data: PropTypes.string,
};

export default QRModal;
