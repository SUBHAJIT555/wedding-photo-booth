import { useNavigate } from "react-router-dom";
import Logo from "../component/Logo";

function Instruction() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white relative flex flex-col justify-evenly items-center overflow-hidden">
      {/* Dashed Bottom Fade Grid - on top of glow so it's visible */}
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

      {/* Amber-style glow background - base #FF5900 */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #FF5900 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />

      <div className="flex flex-col justify-evenly items-center w-full flex-1 relative z-[2] text-white px-4 py-8">
        <Logo />

        <div className="flex flex-col items-center max-w-2xl px-10 py-12 rounded-2xl bg-[#F4EDE3] border border-neutral-200 ring-1 ring-offset-8 ring-neutral-300 text-center">
          <h1
            className="mb-4 text-[3.5rem] md:text-[5rem] font-bold bg-clip-text text-transparent leading-tight"
            style={{
              backgroundImage: "linear-gradient(90deg, #FF5900, #411517, #ff8c4d, #FF5900)",
              backgroundSize: "200% 100%",
              animation: "gradient-shift 2.5s linear infinite",
            }}
          >
            Welcome!
          </h1>
          <p className="text-[#FF5900] text-2xl md:text-3xl font-semibold mb-2">
            to the Talabat Photo Booth
          </p>
          <p className="text-[#411517] text-xl md:text-2xl mt-4 leading-relaxed">
            Capture your moment and take home a memory!
          </p>
        </div>

        <div className="flex justify-center items-center">
          <button
            onClick={() => navigate("/capture")}
            className="border-[1px] border-[#FF5900] px-8 py-4 rounded-2xl bg-[#FF5900] text-white hover:bg-[#e04d00] transition-all duration-300 ring-1 ring-offset-4 ring-[#FF5900] font-semibold text-4xl uppercase"
          >
            Take a Photo
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}

export default Instruction;
