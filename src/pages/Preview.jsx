import { IoHome, IoQrCode } from "react-icons/io5";
import { ImPrinter } from "react-icons/im";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import QRModal from "../component/QRModal";
import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import BgImage from "../assets/images/home/Bg.png";
import FlowerBgImage from "../assets/images/home/Flower-Bg.png";
import LoadingSwapping from "../component/LoadingSwapping";
import printingVideo from "../assets/printing.webm";
import { getData } from "../utils/localStorageDB";

function Preview() {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const location = useLocation();
  const { resultUrl } = location?.state || {};
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [swaploader, setswaloader] = useState("none");
  const url = searchParams.get("resultUrl");
  const savedImage = getData("capturedImage");

  const finalUrl = resultUrl || url || savedImage;
  useEffect(() => {
    setswaloader(loading ? "block" : "none");
  }, [loading]);

  const uint8ArrayToBase64 = (uint8Array) => {
    let binary = "";
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  // const printImage = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await fetch(finalUrl);
  //     const blob = await response.blob();
  //     const url = URL.createObjectURL(blob);

  //     const iframe = document.createElement("iframe");
  //     iframe.style.display = "none";
  //     iframe.srcdoc = `
  //     <html>
  //       <head>
  //         <style>
  //           @page { margin: 0; size: 4in 6in; }
  //           body { margin: 0; }
  //           img { width: 100%; height: 100%; object-fit: cover; }
  //         </style>
  //       </head>
  //       <body onload="window.print();">
  //         <img src="${url}" />
  //       </body>
  //     </html>
  //   `;
  //     document.body.appendChild(iframe);
  //   } catch (error) {
  //     console.error("Error processing print job:", error);
  //   } finally {
  //     setTimeout(() => {
  //       setLoading(false);
  //     }, 35000);
  //   }
  // };

  // const printImageAsPDF = async () => {
  //   try {
  //     setLoading(true);

  //     // Fetch the image as a Blob
  //     const response = await fetch(finalUrl);
  //     const imageBlob = await response.blob();
  //     const imageArrayBuffer = await imageBlob.arrayBuffer();

  //     // Create a new PDF document
  //     const pdfDoc = await PDFDocument.create();
  //     const page = pdfDoc.addPage([288, 432]); // 4x6 inches in points

  //     // Embed the image into the PDF
  //     const image = await pdfDoc.embedJpg(imageArrayBuffer);
  //     // const { width, height } = image.scale(0.25);
  //     const { width: imgW, height: imgH } = image.size();

  //     // Center the image
  //     // Target page size (4x6 in pts)
  //     const pageWidth = 288;
  //     const pageHeight = 432;

  //     // Scale proportionally to fit
  //     const scale = Math.min(pageWidth / imgW, pageHeight / imgH);
  //     const scaledW = imgW * scale;
  //     const scaledH = imgH * scale;

  //     // Center image
  //     const x = (pageWidth - scaledW) / 2;
  //     const y = (pageHeight - scaledH) / 2;

  //     page.drawImage(image, { x, y, width: scaledW, height: scaledH });
  //     // const x = (page.getWidth() - width) / 2;
  //     // const y = (page.getHeight() - height) / 2;
  //     // page.drawImage(image, { x, y, width, height });

  //     // Save PDF as Uint8Array
  //     const pdfBytes = await pdfDoc.save();

  //     // ---- Print ----

  //     const blob = new Blob([pdfBytes], { type: "application/pdf" });
  //     const url = URL.createObjectURL(blob);

  //     const iframe = document.createElement("iframe");
  //     iframe.style.display = "none";
  //     iframe.src = url;
  //     document.body.appendChild(iframe);

  //     iframe.onload = () => {
  //       iframe.contentWindow.focus();
  //       iframe.contentWindow.print();
  //     };

  //     // ---- Download with downloadjs ----
  //     // download(pdfBytes, `document-${Date.now()}.pdf`, "application/pdf");
  //   } catch (error) {
  //     console.error("Error processing print job:", error);
  //   } finally {
  //     setTimeout(() => {
  //       setLoading(false);
  //     }, 35000);
  //   }
  // };
  const printImageAsPDF = async () => {
    try {
      setLoading(true);
      // Fetch the image as a Blob
      const response = await fetch(finalUrl);
      const imageBlob = await response.blob();
      const imageArrayBuffer = await imageBlob.arrayBuffer();

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([288, 432]); // 4x6 inches in points (1 inch = 72 points)

      // Embed the image into the PDF
      const image = await pdfDoc.embedJpg(imageArrayBuffer);
      const { width, height } = image.scale(0.25);

      // Calculate position to center the image
      const x = (page.getWidth() - width) / 2;
      const y = (page.getHeight() - height) / 2;

      // Draw image on PDF
      page.drawImage(image, { x, y, width, height });

      // Convert PDF to Uint8Array
      const pdfBytes = await pdfDoc.save();
      const pdfBase64 = uint8ArrayToBase64(new Uint8Array(pdfBytes)); // Proper encoding

      // console.log(pdfBase64);

      //  download(pdfBytes, generateUniqueFilename("pdf"));

      // Send the PDF to PrintNode
      const apiKey = import.meta.env.VITE_PRINTNODE_API_KEY; // Replace with actual API key
      const printerId = import.meta.env.VITE_PRINTNODE_PRINTER_ID; // Replace with actual printer ID

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
      // This for loading 40sec
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
    <div className="flex overflow-hidden relative flex-col justify-center items-center w-full h-screen min-h-screen">
      {/* Background with Floral Pattern - Same as other pages */}
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
      <div className="relative z-[2] flex flex-col items-center justify-center w-full px-4 gap-6 md:gap-8">
        {/* Text Section - Top */}
        <div className="flex flex-col gap-2 items-center mb-4 md:gap-3 md:mb-6">
          <h1 className="text-3xl md:text-5xl lg:text-6xl text-center leading-relaxed font-dm-serif text-[#5d4037]">
            Yellow never looked this good!
          </h1>
          <p className="text-2xl md:text-4xl lg:text-5xl font-dynalight text-[#5d4037] italic">
            #SabiGautHim
          </p>
        </div>

        {/* Image Frame */}
        <div
          className="flex justify-center w-full"
          style={{ maxWidth: "70vw" }}
        >
          {finalUrl && (
            <div
              className="relative w-full"
              style={{
                aspectRatio: "2/3",
                maxHeight: "85vh",
                minHeight: "60vh",
              }}
            >
              <img
                src={finalUrl}
                alt="Your creation"
                className="object-cover w-full h-full rounded-2xl border-4 border-white shadow-2xl"
                style={{
                  aspectRatio: "2/3",
                  objectFit: "cover",
                  maxHeight: "85vh",
                  minHeight: "60vh",
                }}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-6 justify-center mt-4 md:gap-10 md:mt-6">
          <button
            onClick={printImageAsPDF}
            className="border-2 border-[#5d4037] text-[#5d4037] p-3 md:p-4 rounded-2xl hover:bg-[#5d4037] hover:text-white transition-all duration-300 cursor-pointer"
          >
            <ImPrinter className="text-3xl md:text-5xl" />
          </button>

          <button
            onClick={() => setIsQRModalOpen(true)}
            className="border-2 border-[#5d4037] text-[#5d4037] p-3 md:p-4 rounded-2xl hover:bg-[#5d4037] hover:text-white transition-all duration-300 cursor-pointer"
          >
            <IoQrCode className="text-3xl md:text-5xl" />
          </button>

          <Link to="/">
            <button className="border-2 border-[#5d4037] text-[#5d4037] p-3 md:p-4 rounded-2xl hover:bg-[#5d4037] hover:text-white transition-all duration-300 cursor-pointer">
              <IoHome className="text-3xl md:text-5xl" />
            </button>
          </Link>
        </div>
      </div>

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        data={finalUrl}
      />
    </div>
  );
}

export default Preview;
