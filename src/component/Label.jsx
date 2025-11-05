const Label = () => {
  // <div className="absolute bottom-0 flex items-center justify-between w-full px-2 bg-blue-800 h-1/5">

  return (
    <div className="h-[15%] w-full bg-gray-800 p-4 flex items-center justify-between text-white">
      {/* Left Text */}
      <div className="flex-1 truncate">
        <h1 className="text-xs font-bold md:text-sm text-zinc-200">
          CODECOBBLE
        </h1>
        {/* <h3 className="text-sm font-bold truncate">Image Title</h3>
        <p className="text-xs text-gray-400 truncate">Category/Type</p> */}
      </div>

      {/* Right Text */}
      <div className="ml-2 text-right">
        <p className="text-xs font-bold md:text-sm">Ai-PhotoBooth</p>
        <p className="text-xs font-light md:text-sm">Created by: CodeCobble</p>
      </div>
    </div>
  );
};

export default Label;
