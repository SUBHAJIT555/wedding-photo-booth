import { Link } from "react-router-dom";
import BgImage from "../assets/images/home/Bg.png";
import FlowerBgImage from "../assets/images/home/Flower-Bg.png";
import FlowerImg from "../assets/images/home/Flower-img.png";
import { FaHeart } from "react-icons/fa";

function Instruction() {
  return (
    <div className="flex overflow-hidden relative flex-col justify-center items-center w-full h-screen min-h-screen">
      {/* Background with Floral Pattern - Same as Home page */}
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
      <div className="relative z-[2] flex flex-col items-center justify-center w-full px-4 gap-8">
        {/* Central Thank You Box */}
        <div className="relative w-full max-w-[70vw] max-h-[65vh] bg-[#faf9f6] border-4 border-[#e91e63] rounded-tl-3xl rounded-br-3xl shadow-2xl overflow-visible">
          {/* Floral Decoration - Top Right */}
          <div className="absolute -top-[12vw] -right-[10vw] z-10">
            <img
              src={FlowerImg}
              alt="Floral decoration"
              className="w-[25vw] max-w-[200px] h-auto opacity-100"
            />
          </div>

          {/* Floral Decoration - Bottom Left */}
          <div className="absolute -bottom-[7vw] -left-[10vw] z-10">
            <img
              src={FlowerImg}
              alt="Floral decoration"
              className="w-[28vw] max-w-[230px] h-auto opacity-100 rotate-180"
            />
          </div>

          {/* Content */}
          <div className="flex relative z-20 flex-col justify-center items-center px-8 py-6 text-center">
            {/* Thank You Message */}
            <div className="flex flex-col gap-4 items-center mb-8">
              <p className="text-4xl leading-relaxed md:text-5xl xl:text-6xl font-krylon text-primary">
                Thank you for being a part of our
              </p>
              <p className="text-5xl leading-relaxed md:text-6xl xl:text-7xl font-dm-serif text-primary">
                Haldi ceremony.
              </p>
              <p className="text-4xl leading-relaxed md:text-5xl xl:text-6xl font-krylon text-primary">
                Your presence adds love, laughter
              </p>
              <p className="text-4xl leading-relaxed md:text-5xl xl:text-6xl font-krylon text-primary">
                & memories to our special day.
              </p>
            </div>

            {/* Sign-off */}
            <div className="flex flex-col gap-4 items-center">
              <p className="text-4xl italic leading-relaxed md:text-5xl xl:text-6xl font-krylon text-primary">
                With love,
              </p>
              <p className="text-4xl leading-relaxed md:text-5xl xl:text-6xl font-dynalight text-primary">
                #SabiGautHim
              </p>
              <p className="text-4xl leading-relaxed md:text-5xl xl:text-6xl font-krylon text-primary">
                and families.
              </p>
              <p className="text-xl leading-relaxed md:text-7xl xl:text-7xl font-krylon text-primary">
                &quot;<FaHeart className="inline-block text-5xl text-yellow-400 md:text-6xl" />&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Take Photo Button */}
        <div className="flex justify-center items-center mt-4">
          <Link
            to="/capture"
            className="inline-block px-[12vw] py-[3vw] md:px-16 md:py-4 text-[4vw] md:text-[2.5vw] font-semibold text-white bg-[#e91e63] hover:bg-[#c2185b] transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 rounded-tl-2xl rounded-br-2xl font-krylon tracking-wider"
          >
            Take Photo
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Instruction;
