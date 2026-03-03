import Logo from "../component/Logo";
import AnimatedButton from "../component/AnimatedButton";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { cn } from "../utils/cn";
import { getData } from "../utils/localStorageDB";
import toast from "react-hot-toast";
import useAxiosPublic from "../hooks/useAxios";
import loadingVideo from "../assets/loading.webm";
import BGImage from "../assets/logo/BG.webp";
import LoadingSwapping from "../component/LoadingSwapping";
import { avatarMap } from "../constant/avatar";

// Dynamically import all avatars
const maleAvatars = import.meta.glob("../assets/Avatars/male-*.png", {
  eager: true,
});
const femaleAvatars = import.meta.glob("../assets/Avatars/female-*.png", {
  eager: true,
});

// normalize to filename → url
function normalizeGlob(globResult) {
  return Object.fromEntries(
    Object.entries(globResult).map(([path, mod]) => {
      const fileName = path.split("/").pop(); // e.g. "male-01.png"
      return [fileName, mod.default];
    })
  );
}

const maleAvatarMap = normalizeGlob(maleAvatars);
const femaleAvatarMap = normalizeGlob(femaleAvatars);

// use avatarMap to build arrays
const maleImages = Object.entries(avatarMap)
  .filter(([key]) => key.startsWith("male"))
  .map(([id, fileName]) => ({
    id,
    url: maleAvatarMap[fileName],
  }));

const femaleImages = Object.entries(avatarMap)
  .filter(([key]) => key.startsWith("female"))
  .map(([id, fileName]) => ({
    id,
    url: femaleAvatarMap[fileName],
  }));

function Avatar() {
  const [gender, setGender] = useState("male");

  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef(null);
  const publicAxios = useAxiosPublic();
  const [swaploader, setswaloader] = useState("none");

  const navigate = useNavigate();

  const handleAvatarSelect = (avatarId) => {
    setSelectedAvatarId(avatarId);
  };

  // const convertToBase64 = async (imageUrl) => {
  //   try {
  //     const response = await fetch(imageUrl);
  //     const blob = await response.blob();
  //     return new Promise((resolve, reject) => {
  //       const reader = new FileReader();
  //       reader.onloadend = () => resolve(reader.result);
  //       reader.onerror = reject;
  //       reader.readAsDataURL(blob);
  //     });
  //   } catch (error) {
  //     console.error("Error converting image to base64:", error);
  //     return null;
  //   }
  // };

  // const handleMouseDown = (event) => {
  //   createRipple(event);
  // };

  // const handleTouchStart = (event) => {
  //   createRipple(event.touches[0]);
  // };

  const handleSwap = async () => {
    try {
      setLoading(true);
      if (selectedAvatarId && selectedAvatarId !== null) {
        const capturedImage = await getData("capturedImage");

        if (!capturedImage) {
          toast.success("Please capture an image first");
          return;
        }

        const formData = {
          source: capturedImage,
          avatar_id: selectedAvatarId,
        };
        // Start timer
        // const start = performance.now();
        const response = await publicAxios.post("swap.php", formData);
        // End timer
        // const end = performance.now();
        // const elapsed = ((end - start) / 1000).toFixed(2); // seconds
        // console.log(`Swap API took ${elapsed} seconds`);

        const data = response.data;
        // console.log(data);

        if (data?.data?.result_url) {
          navigate(`/preview?resultUrl=${data.data.result_url}`, {
            state: {
              resultUrl: data.data.result_url,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error swapping images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setswaloader(loading ? "block" : "none");
  }, [loading]);

  return loading ? (
    <div className="w-full h-screen">
      <LoadingSwapping visibility={swaploader} src={loadingVideo} />
    </div>
  ) : (
    <div
      className="flex flex-col gap-10 justify-center items-center py-10 w-full h-screen bg-center bg-repeat bg-cover"
      style={{ backgroundImage: `url(${BGImage})` }}
    >
      <div className="mb-[4vw]">
        <Logo />
      </div>

      {/* Magical Toggle Button */}
      <div className="flex items-center gap-4 mb-[15vw]">
        <span className="text-[3.5vw] text-white font-golonto tracking-wide">
          Male
        </span>
        <div
          ref={buttonRef}
          // onMouseDown={handleMouseDown}
          // onTouchStart={handleTouchStart}
          className={`relative w-[15vw] h-[5vw] flex items-center bg-gradient-to-r from-blue-600 to-pink-500 rounded-full transition-all duration-300 overflow-hidden cursor-pointer ${
            gender === "female"
              ? "shadow-[0_0_15px_rgba(236,72,153,0.5)]"
              : "shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          }`}
        >
          <input
            type="checkbox"
            className="absolute w-full h-full opacity-0 cursor-pointer"
            checked={gender === "female"}
            onChange={() => setGender(gender === "male" ? "female" : "male")}
          />
          <div
            className={`absolute w-[4vw] h-[4vw] rounded-full transition-all duration-500 transform ${
              gender === "female"
                ? "translate-x-[10vw] bg-pink-400"
                : "translate-x-1 bg-blue-400"
            }`}
          >
            <div className="absolute inset-0 bg-white rounded-full opacity-20"></div>
          </div>
        </div>
        <span className="text-[3.5vw] text-white font-golonto tracking-wide">
          Female
        </span>
      </div>

      {/* Avatar Grid */}
      <div
        className={cn(
          "grid grid-cols-3 gap-10 justify-center items-center w-full px-[10vw] mb-[20vw]"
        )}
      >
        {(gender === "male" ? maleImages : femaleImages).map(
          (avatar, index) => (
            <div
              key={index}
              className={cn(
                "group relative w-full max-w-[400px] mx-auto rounded-2xl overflow-hidden ",
                avatar.id === selectedAvatarId ? "border-4 border-zinc-200" : ""
              )}
              onClick={() => handleAvatarSelect(avatar.id)}
            >
              <div className="h-[calc(85%-75px)] w-full overflow-hidden rounded-xl">
                <img
                  src={avatar.url}
                  alt={`Avatar ${index + 1}`}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  style={{ marginBottom: "-75px" }}
                />
              </div>
              {avatar.id === selectedAvatarId && (
                <div className="overflow-hidden absolute inset-0 rounded-xl pointer-events-none">
                  <div className="absolute -left-full top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine_1.5s_infinite]"></div>
                </div>
              )}
            </div>
          )
        )}
      </div>
      {/* Avatar Grid */}
      {/* <div className="w-full px-[10vw] mb-[20vw]">

        <div
          className={cn(
            "grid grid-cols-3 gap-10 justify-center items-center transition-opacity duration-300",
            gender === "male"
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          )}
        >
          {maleImages.map((avatar, index) => (
            <div
              key={`male-${index}`}
              className={cn(
                "group relative w-full max-w-[400px] mx-auto rounded-2xl overflow-hidden cursor-pointer",
                avatar.id === selectedAvatarId ? "border-4 border-zinc-200" : ""
              )}
              onClick={() => handleAvatarSelect(avatar.id)}
            >
              <div className="h-[calc(85%-75px)] w-full overflow-hidden rounded-xl">
                <img
                  src={avatar.url}
                  alt={`Male Avatar ${index + 1}`}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  style={{ marginBottom: "-75px" }}
                  loading="lazy"
                />
              </div>
              {avatar.id === selectedAvatarId && (
                <div className="overflow-hidden absolute inset-0 rounded-xl pointer-events-none">
                  <div className="absolute -left-full top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine_1.5s_infinite]" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className={cn(
            "grid grid-cols-3 gap-10 justify-center items-center transition-opacity duration-300",
            gender === "female"
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          )}
        >
          {femaleImages.map((avatar, index) => (
            <div
              key={`female-${index}`}
              className={cn(
                "group relative w-full max-w-[400px] mx-auto rounded-2xl overflow-hidden cursor-pointer",
                avatar.id === selectedAvatarId ? "border-4 border-zinc-200" : ""
              )}
              onClick={() => handleAvatarSelect(avatar.id)}
            >
              <div className="h-[calc(85%-75px)] w-full overflow-hidden rounded-xl">
                <img
                  src={avatar.url}
                  alt={`Female Avatar ${index + 1}`}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  style={{ marginBottom: "-75px" }}
                  loading="lazy"
                />
              </div>
              {avatar.id === selectedAvatarId && (
                <div className="overflow-hidden absolute inset-0 rounded-xl pointer-events-none">
                  <div className="absolute -left-full top-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine_1.5s_infinite]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div> */}

      {/* Swap Button */}
      <AnimatedButton
        text={loading ? "Loading..." : "Swap"}
        onClick={handleSwap}
        className={
          !selectedAvatarId || loading || selectedAvatarId === null
            ? "bg-gray-500 cursor-not-allowed opacity-50"
            : ""
        }
      />
    </div>
  );
}

export default Avatar;
