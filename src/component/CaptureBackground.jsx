import BgImage from "../assets/images/home/Bg.png";
import FlowerBgImage from "../assets/images/home/Flower-Bg.png";

function CaptureBackground() {
  return (
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
  );
}

export default CaptureBackground;

