import { Link } from "react-router-dom";
import Logo from "../component/Logo";

function SubmitOrRetake() {
  return (
    <div className="flex flex-col items-center w-full h-screen justify-evenly">
      <Logo />
      <div className="w-1/2 captureArea h-1/2 bg-zinc-700 rounded-2xl"></div>

      <div className="flex items-center justify-center gap-6">
        <Link to="/capture">
          <button className="px-5 py-2 font-light tracking-tight capitalize border-2 border-transparent rounded-full text-zinc-200 bg-zinc-700 hover:bg-zinc-900 hover:border-zinc-200">
            reatake
          </button>
        </Link>
        <Link to="/avatar">
          <button className="px-5 py-2 font-light tracking-tight capitalize border-2 border-transparent rounded-full text-zinc-200 bg-zinc-700 hover:bg-zinc-900 hover:border-zinc-200">
            submit
          </button>
        </Link>
      </div>
    </div>
  );
}

export default SubmitOrRetake;
