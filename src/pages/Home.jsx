import { useNavigate } from "react-router-dom";
import Logo from "../component/Logo";
import BackgroundImage from "../assets/logo/background.png";

function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex overflow-hidden relative flex-col justify-evenly items-center w-full h-screen min-h-screen text-white">
      {/* Dashed grid - behind image so it doesn't overlay the camera */}
      <div
        className="absolute inset-0 z-[-1] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #FF5900 1px, transparent 1px),
            linear-gradient(to bottom, #FF5900 1px, transparent 1px)
          `,
          backgroundSize: "2px 2px",
          backgroundPosition: "0 0, 0 0",
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
            radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
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
            radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      {/* Background image - on top of grid */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={BackgroundImage}
          alt=""
          className="w-full h-full min-h-full object-cover object-top translate-y-[8%]"
          aria-hidden
        />
      </div>

      {/* Logo */}
      <div className="z-[2] mb-[15vw] -mt-[10vw]">
        <Logo />
      </div>

      {/* Start Button */}
      <div className="flex justify-center items-center z-[2] mt-[90vw]">
        <button
          onClick={() => navigate("/instruction")}
          className="border-[1px] border-[#FF5900] px-8 py-4 rounded-2xl bg-[#FF5900] text-white hover:bg-[#e04d00] transition-all duration-300 ring-1 ring-offset-4 ring-[#FF5900] font-semibold text-4xl tracking-widest uppercase"
        >
          Start
        </button>
      </div>
    </div>
  );
}

export default Home;
