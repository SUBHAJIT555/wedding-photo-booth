import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import shlogo from "../assets/images/home/SH-Logo.svg";

const QRModal = ({ isOpen, onClose, data }) => {
  const [error, setError] = useState(null);
  const [qrValue, setQrValue] = useState("");

  // Maximum characters a QR code can hold (Version 40, alphanumeric mode)
  const MAX_QR_LENGTH = 4296;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setError(null);

      // Check if data is too long for QR code
      if (data && data.length > MAX_QR_LENGTH) {
        // If it's a base64 image, try to create a downloadable link
        if (data.startsWith("data:image")) {
          // Create a blob URL that can be shared
          // For now, we'll show an error with download option
          setError(
            "Image data is too large for QR code. Please use the download option instead."
          );
          setQrValue("");
        } else {
          setError("Data is too long to encode in a QR code.");
          setQrValue("");
        }
      } else {
        setQrValue(data || "");
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
      link.download = `wedding-photo-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-70"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl p-12 transition-all transform bg-[#e1e1e1] rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white rounded-full border-2 border-white bg-primary hover:text-primary hover:bg-white hover:border-primary"
        >
          <IoMdClose />
        </button>

        <div className="mt-2">
          <div className="flex flex-col items-center space-y-4">
            {error ? (
              <div className="flex flex-col items-center space-y-4 p-6">
                <div className="text-red-600 text-center text-lg font-semibold">
                  {error}
                </div>
                {data && data.startsWith("data:image") && (
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-[#e91e63] text-white rounded-lg hover:bg-[#c2185b] transition-colors font-semibold"
                  >
                    Download Image Instead
                  </button>
                )}
              </div>
            ) : qrValue ? (
              <QRCodeSVG
                size={600}
                value={qrValue}
                fgColor="#e91e63"
                bgColor="#e1e1e1"
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
