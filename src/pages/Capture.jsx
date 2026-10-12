import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../component/Logo";
import { saveData } from "../utils/localStorageDB";

function Capture() {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const fromEditor = Boolean(location.state?.fromEditor);
  const [countdown, setCountdown] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [columns, setColumns] = useState([]);
  const canvasRef = useRef(null);
  const shotTaken = useRef(false);
  const [loading, setLoading] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  async function getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cols = devices
      .filter((device) => device.kind === "videoinput")
      .map((device) => ({ label: device.label, deviceId: device.deviceId }));
    setColumns(cols);
  }

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      if (videoRef.current) {
        return new Promise((resolve) => {
          videoRef.current.srcObject = stream;

          const handleCanPlay = () => {
            videoRef.current?.removeEventListener("canplay", handleCanPlay);
            if (!videoRef.current) {
              stream.getTracks().forEach((track) => track.stop());
              resolve();
              return;
            }
            setVideoStream(stream);
            resolve();
          };

          videoRef.current.addEventListener("canplay", handleCanPlay);

          setTimeout(() => {
            videoRef.current?.removeEventListener("canplay", handleCanPlay);
            if (!videoRef.current) {
              stream.getTracks().forEach((track) => track.stop());
              resolve();
              return;
            }
            setVideoStream(stream);
            resolve();
          }, 2000);
        });
      }
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
  }, []);

  const stopVideo = useCallback(() => {
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
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.load();
        setTimeout(resolve, 100);
      } else {
        resolve();
      }
    });
  }, [videoStream]);

  const captureImage = () => {
    shotTaken.current = false;
    setCapturedImage(null);
    setLoading(true);
    setCountdown(5);
  };

  const submitImage = () => {
    stopVideo();
    saveData("capturedImage", capturedImage);
    saveData("sourcePhoto", capturedImage);
    navigate("/edit");
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (shotTaken.current) return;
      shotTaken.current = true;
      if (videoRef.current && canvasRef.current && videoRef.current.videoWidth && videoRef.current.videoHeight) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // 4x6 inch ratio (2:3 portrait)
        const TARGET_W = 1200;
        const TARGET_H = 1800;

        canvas.width = TARGET_W;
        canvas.height = TARGET_H;

        const ctx = canvas.getContext("2d");

        // Fill background
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, TARGET_W, TARGET_H);

        const videoW = video.videoWidth;
        const videoH = video.videoHeight;
        const videoRatio = videoW / videoH;
        const targetRatio = TARGET_W / TARGET_H;

        let drawW, drawH, drawX, drawY;

        // Cover fit - crop to fill the 4:6 ratio
        if (videoRatio > targetRatio) {
          // Video is wider - fit height, crop sides
          drawH = TARGET_H;
          drawW = drawH * videoRatio;
          drawX = (TARGET_W - drawW) / 2;
          drawY = 0;
        } else {
          // Video is taller - fit width, crop top/bottom
          drawW = TARGET_W;
          drawH = drawW / videoRatio;
          drawX = 0;
          drawY = (TARGET_H - drawH) / 2;
        }

        ctx.drawImage(video, drawX, drawY, drawW, drawH);
        const image = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(image);
        saveData("sourcePhoto", image);
        saveData("capturedImage", image);
        saveData("placedProps", []);
        setLoading(false);
        setCountdown(null);
        stopVideo();
      } else {
        setLoading(false);
        setCountdown(null);
      }
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, stopVideo]);

  useEffect(() => {
    getDevices();
    return () => stopVideo();
  }, [stopVideo]);

  useEffect(() => {
    if (columns.length > 0 && !videoStream && !capturedImage) {
      startCamera();
    }
  }, [columns, videoStream, startCamera, capturedImage]);

  return (
    <div className="min-h-screen w-full bg-white relative flex flex-col justify-evenly items-center overflow-hidden">
      {/* Dashed grid - same as Instruction */}
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

      {/* Orange glow - same as Instruction */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #FF5900 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />

      <div className="flex flex-col justify-evenly items-center w-full flex-1 relative z-[2] text-white px-4 py-4">
        <Logo />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div className="flex relative justify-center items-center rounded-3xl ring-1 ring-offset-8 ring-neutral-300 overflow-hidden" style={{ aspectRatio: "2/3", width: "min(80vw, 600px)", maxHeight: "75vh" }}>
          {!capturedImage ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-black rounded-3xl shadow-lg"
              autoPlay
              muted
              playsInline
              style={{
                opacity: isRestarting ? 0.5 : 1,
                transition: "opacity 0.3s ease",
              }}
            />
          ) : (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover rounded-3xl border-4 border-white shadow-lg"
            />
          )}
          {countdown !== null && countdown > 0 && (
            <div className="flex absolute inset-0 justify-center items-center bg-black bg-opacity-50 rounded-3xl">
              <p className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff5900] to-[#df8859] animate-ping">
                {countdown}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-10 justify-center mt-8">
          {!capturedImage ? (
            <>
              {fromEditor && !loading && (
                <button
                  onClick={() => navigate("/edit")}
                  className="border-[1px] border-[#FF5900] px-8 py-4 rounded-2xl bg-[#FF5900] text-white hover:bg-[#e04d00] transition-all duration-300 ring-1 ring-offset-4 ring-[#FF5900] font-semibold text-4xl"
                >
                  Back
                </button>
              )}
              <button
                onClick={loading ? undefined : captureImage}
                disabled={loading}
                className={`border-[1px] border-[#FF5900] px-8 py-4 rounded-2xl bg-[#FF5900] text-white hover:bg-[#e04d00] transition-all duration-300 ring-1 ring-offset-4 ring-[#FF5900] font-semibold text-4xl ${loading ? "opacity-50 pointer-events-none" : ""}`}
              >
                {loading ? "Capturing..." : "Click to Capture"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={async () => {
                  if (isRestarting) return;
                  setIsRestarting(true);
                  try {
                    setCapturedImage(null);
                    await stopVideoAndClear();
                    await new Promise((resolve) => setTimeout(resolve, 200));
                    await startCamera();
                  } catch (error) {
                    console.error("Error restarting camera:", error);
                  } finally {
                    setIsRestarting(false);
                  }
                }}
                disabled={isRestarting}
                className={`border-[1px] border-[#FF5900] px-8 py-4 rounded-2xl bg-[#FF5900] text-white hover:bg-[#e04d00] transition-all duration-300 ring-1 ring-offset-4 ring-[#FF5900] font-semibold  text-4xl ${isRestarting ? "opacity-75 pointer-events-none" : ""}`}
              >
                {isRestarting ? "Starting..." : "Retake"}
              </button>

              <button
                onClick={submitImage}
                className="border-[1px] border-[#FF5900] px-8 py-4 rounded-2xl bg-[#FF5900] text-white hover:bg-[#e04d00] transition-all duration-300 ring-1 ring-offset-4 ring-[#FF5900] font-semibold text-4xl"
              >
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Capture;
