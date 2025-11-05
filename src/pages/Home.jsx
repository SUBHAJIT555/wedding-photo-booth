import { Link } from "react-router-dom";
import BgImage from "../assets/images/home/Bg.png";
import FlowerBgImage from "../assets/images/home/Flower-Bg.png";
import ShapeFrame from "../assets/images/home/Shape-01.png";
import SHLogo from "../assets/images/home/SH-Logo.svg";

function Home() {
  return (
    <div className="flex overflow-hidden relative flex-col justify-center items-center w-full h-screen min-h-screen">
      {/* Background with Floral Pattern */}
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

      {/* Central Ornate Frame Container */}
      <div className="relative z-[2] flex flex-col items-center justify-center w-full max-w-[90vw] px-4">
        {/* Ornate Frame Background */}
        <div className="relative w-full max-w-[75vw] max-h-[75vh]">
          <img
            src={ShapeFrame}
            alt="Ornate Frame"
            className="object-contain w-full h-full max-h-[75vh]"
          />

          {/* Content inside the frame */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-[10%] py-[8%]">
            {/* Logo/Monogram */}
            <div className="mb-4 md:mb-6">
              <img
                src={SHLogo}
                alt="Sabi Gaut Him Logo"
                className="w-[25vw] max-w-[200px] h-auto"
              />
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl text-center mb-3 md:mb-16 leading-relaxed text-[#e91e63] font-dm-serif">
              Let&apos;s Capture
              <br />
              <span className="text-4xl md:text-6xl">
                Some Haldi Magic!
              </span>
            </h1>

            {/* Sub-text */}
            <p
              className="mb-10 text-xl leading-relaxed text-center md:text-3xl md:mb-12 font-krylon" 
              
            >
              &quot;Because every smile deserves a little haldi.&quot;
            </p>

            {/* Start Button */}
            <div className="mb-6 md:mb-8">
              <Link
                to="/instruction"
                className="inline-block px-8 py-3 md:px-12 md:py-4 text-[3.5vw] md:text-[2vw] font-semibold text-white bg-[#e91e63] hover:bg-[#c2185b] transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 rounded-tl-2xl rounded-br-2xl font-krylon tracking-wider"
              >
                Start the Fun
              </Link>
            </div>

            {/* Hashtag */}
            <p
              className="text-3xl italic md:text-5xl font-dynalight text-primary"
             
            >
              #SabiGautHim
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
