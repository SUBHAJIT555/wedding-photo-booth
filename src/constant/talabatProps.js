/**
 * Photo-booth props.
 *
 * Drop transparent PNG, WebP, or JPEG files into:
 *   src/assets/Talabat_prop
 *
 * Each file is one prop. The filename (without the extension) is the label.
 * Transparent backgrounds are kept. Images are drawn at their own aspect ratio.
 */
const pngModules = import.meta.glob("../assets/Talabat_prop/*.png", {
  eager: true,
  import: "default",
});
const webpModules = import.meta.glob("../assets/Talabat_prop/*.webp", {
  eager: true,
  import: "default",
});
const jpgModules = import.meta.glob("../assets/Talabat_prop/*.jpg", {
  eager: true,
  import: "default",
});
const jpegModules = import.meta.glob("../assets/Talabat_prop/*.jpeg", {
  eager: true,
  import: "default",
});

function toSlug(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toLabel(filename) {
  return filename.replace(/\.[^.]+$/, "").replace(/\s+/g, " ").trim();
}

function collect(modules) {
  return Object.entries(modules).map(([path, src]) => {
    const filename = path.split("/").pop();
    return {
      id: toSlug(filename),
      name: toLabel(filename),
      src,
    };
  });
}

export const talabatProps = [
  ...collect(pngModules),
  ...collect(webpModules),
  ...collect(jpgModules),
  ...collect(jpegModules),
].sort((a, b) => a.name.localeCompare(b.name));

export function getTalabatProp(id) {
  return talabatProps.find((prop) => prop.id === id) || null;
}
