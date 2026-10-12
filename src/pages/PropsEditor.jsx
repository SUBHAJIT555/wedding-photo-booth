/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Logo from "../component/Logo";
import PropsCanvas, { fitSize, placeInFrame } from "../component/PropsCanvas";
import { getTalabatProp, talabatProps } from "../constant/talabatProps";
import { getData, saveData } from "../utils/localStorageDB";
import { composePhotoWithProps } from "../utils/composePhotoWithProps";

const aspectCache = {};

function readPhoto() {
  try {
    const value = getData("sourcePhoto");
    if (typeof value === "string" && value.startsWith("data:image")) return value;
    return null;
  } catch {
    return null;
  }
}

function readPlacedProps() {
  try {
    const saved = getData("placedProps");
    if (!Array.isArray(saved)) return [];
    return saved
      .map((item) => {
        const asset = item?.propId ? getTalabatProp(item.propId) : null;
        if (!asset || typeof item.w !== "number") return null;
        return {
          ...item,
          name: asset.name,
          src: asset.src,
          rotation: item.rotation || 0,
          z: item.z || 1,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function PropPicker({ onAdd }) {
  const scrollerRef = useRef(null);
  const gesture = useRef(null);
  const blockClick = useRef(false);

  const onPointerDown = (event) => {
    if (event.pointerType !== "mouse") return;
    const el = scrollerRef.current;
    if (!el) return;
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      scroll: el.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (event) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    if (Math.abs(dx) > 6) current.moved = true;
    if (current.moved && scrollerRef.current) {
      scrollerRef.current.scrollLeft = current.scroll - dx;
    }
  };

  const onPointerUp = (event) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    blockClick.current = current.moved;
    gesture.current = null;
  };

  return (
    <div className="w-full max-w-5xl shrink-0">
      <p className="mb-3 bg-[length:220%_100%] bg-[linear-gradient(100deg,#c24100_0%,#FF5900_42%,#fff6ee_50%,#FF5900_58%,#c24100_100%)] bg-clip-text text-center text-lg font-semibold tracking-wide text-transparent animate-[text-shimmer_2.6s_linear_infinite]">
        Choose prop from the slider below
      </p>
      {talabatProps.length === 0 ? (
        <p className="text-center text-lg text-[#411517]">
          Add prop images to src/assets/Talabat_prop
        </p>
      ) : (
        <div
          ref={scrollerRef}
          className="hide-scrollbar overflow-x-auto"
          style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="flex w-max gap-3 px-1 pb-1">
            {talabatProps.map((prop) => (
              <button
                key={prop.id}
                type="button"
                title={prop.name}
                aria-label={`Add ${prop.name}`}
                onClick={() => {
                  if (blockClick.current) {
                    blockClick.current = false;
                    return;
                  }
                  onAdd(prop);
                }}
                className="flex h-[92px] w-[108px] shrink-0 items-center justify-center rounded-2xl border-2 border-[#FF5900] bg-[#F4EDE3] p-2 active:scale-95"
              >
                <img
                  src={prop.src}
                  alt=""
                  draggable={false}
                  className="max-h-full max-w-full object-contain pointer-events-none"
                  onLoad={(event) => {
                    const img = event.currentTarget;
                    if (img.naturalWidth) {
                      aspectCache[prop.id] = img.naturalWidth / img.naturalHeight;
                    }
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PropsEditor() {
  const navigate = useNavigate();
  const frameAreaRef = useRef(null);
  const [sourcePhoto] = useState(readPhoto);
  const [items, setItems] = useState(readPlacedProps);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [box, setBox] = useState({ width: 320, height: 480 });

  useEffect(() => {
    if (!sourcePhoto) navigate("/capture", { replace: true });
  }, [sourcePhoto, navigate]);

  useEffect(() => {
    try {
      const stored = items.map(({ src, name, ...rest }) => rest);
      saveData("placedProps", stored);
    } catch (error) {
      console.error("Could not store props", error);
    }
  }, [items]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setSelectedId(null);
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        setItems((prev) => prev.filter((item) => item.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  useEffect(() => {
    const el = frameAreaRef.current;
    if (!el) return undefined;

    const measure = () => {
      const bounds = el.getBoundingClientRect();
      const maxWidth = Math.min(
        Math.max(0, bounds.width - 80),
        600,
        window.innerWidth * 0.8
      );
      const maxHeight = Math.min(
        Math.max(0, bounds.height - 80),
        window.innerHeight * 0.75
      );
      let width = maxWidth;
      let height = width * 1.5;
      if (height > maxHeight && maxHeight > 0) {
        height = maxHeight;
        width = height * (2 / 3);
      }
      if (width < 120 || height < 180) return;
      setBox((prev) => {
        if (Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) {
          return prev;
        }
        return { width, height };
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [sourcePhoto]);

  useEffect(() => {
    talabatProps.forEach((prop) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth) aspectCache[prop.id] = img.naturalWidth / img.naturalHeight;
      };
      img.src = prop.src;
    });
  }, []);

  const addProp = useCallback((prop) => {
    const aspect = aspectCache[prop.id];
    const id = createId();
    setItems((prev) => {
      const sized = aspect ? fitSize(aspect) : { w: 0.4, h: null };
      const placed = aspect
        ? placeInFrame(sized.w, sized.h, prev.length)
        : { x: 0.3, y: 0.3 };
      const z = prev.reduce((max, item) => Math.max(max, item.z || 0), 0) + 1;
      return [
        ...prev,
        {
          id,
          propId: prop.id,
          name: prop.name,
          src: prop.src,
          x: placed.x,
          y: placed.y,
          w: sized.w,
          h: sized.h,
          aspect: aspect || null,
          rotation: 0,
          z,
          jitterIndex: prev.length,
        },
      ];
    });
    setSelectedId(id);
  }, []);

  const handleContinue = async () => {
    if (saving || !sourcePhoto) return;
    setSaving(true);
    try {
      const image =
        items.length === 0
          ? sourcePhoto
          : await composePhotoWithProps(sourcePhoto, items);
      saveData("capturedImage", image);
      navigate("/preview");
    } catch (error) {
      console.error("Could not compose photo", error);
      toast.error("Could not prepare the photo. Please try again.");
      setSaving(false);
    }
  };

  if (!sourcePhoto) return null;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
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
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #FF5900 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />

      <div className="relative z-[2] flex h-full min-h-0 w-full flex-col items-center px-4 py-4 text-white">
        <Logo />
        <div
          ref={frameAreaRef}
          className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
        >
          <div
            className="relative rounded-3xl ring-1 ring-offset-8 ring-neutral-300"
            style={{ width: box.width, height: box.height }}
          >
            <div className="absolute inset-0 overflow-hidden rounded-3xl bg-black">
              <img
                src={sourcePhoto}
                alt="Captured"
                draggable={false}
                className="pointer-events-none h-full w-full object-cover"
              />
            </div>
            <PropsCanvas
              items={items}
              selectedId={selectedId}
              onItemsChange={setItems}
              onSelect={setSelectedId}
            />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-center gap-4">
          <PropPicker onAdd={addProp} />
          <div className="flex flex-wrap justify-center gap-10">
            <button
              type="button"
              onClick={() => navigate("/capture", { state: { fromEditor: true } })}
              className="rounded-2xl border-[1px] border-[#FF5900] bg-[#FF5900] px-8 py-4 text-4xl font-semibold text-white ring-1 ring-offset-4 ring-[#FF5900] transition-all duration-300 hover:bg-[#e04d00]"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={saving}
              className={`rounded-2xl border-[1px] border-[#FF5900] bg-[#FF5900] px-8 py-4 text-4xl font-semibold text-white ring-1 ring-offset-4 ring-[#FF5900] transition-all duration-300 hover:bg-[#e04d00] ${saving ? "pointer-events-none opacity-50" : ""}`}
            >
              {saving ? "Processing..." : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropsEditor;
