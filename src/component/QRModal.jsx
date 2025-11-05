import { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import blackLogo from "../assets/images/home/SH-Logo.svg";

const QRModal = ({ isOpen, onClose, data }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-70"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl p-12 transition-all transform bg-[#e1e1e1]  rounded-lg shadow-xl"
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
            {/*  */}
            <QRCodeSVG
              size={600}
              value={data}
              fgColor="#e91e63"
              bgColor="#e1e1e1"
              imageSettings={{
                src: blackLogo,
                x: undefined,
                y: undefined,
                height: 90,
                width: 90,
                opacity: 1,
                excavate: true,
              }}
            />
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
