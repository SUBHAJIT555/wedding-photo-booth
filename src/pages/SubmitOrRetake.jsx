import { Link } from "react-router-dom";
import Logo from "../component/Logo";

function SubmitOrRetake() {
  return (
    <div className="flex flex-col items-center w-full h-screen justify-evenly">
      <Logo />
      <div className="w-1/2 captureArea h-1/2 bg-zinc-700 rounded-2xl"></div>

      <div className="flex items-center justify-center gap-6">
        <Link to="/capture">
          <button className="px-8 py-4 font-light tracking-tight capitalize border-2 border-[#FF5900] rounded-2xl text-white bg-[#FF5900] hover:bg-[#e04d00] hover:border-[#e04d00] text-4xl">
            reatake
          </button>
        </Link>
        <Link to="/avatar">
          <button className="px-8 py-4 font-light tracking-tight capitalize border-2 border-[#FF5900] rounded-2xl text-white bg-[#FF5900] hover:bg-[#e04d00] hover:border-[#e04d00] text-4xl">
            submit
          </button>
        </Link>
      </div>
    </div>
  );
}

export default SubmitOrRetake;
