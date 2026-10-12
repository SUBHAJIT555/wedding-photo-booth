import { getTalabatProp } from "../constant/talabatProps";

// Same postcard source size used by Capture and by Preview before printing.
export const OUTPUT_WIDTH = 1200;
export const OUTPUT_HEIGHT = 1800;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

function coverRect(img, width, height) {
  const imageRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = width / height;
  let drawW;
  let drawH;
  let drawX;
  let drawY;

  if (imageRatio > targetRatio) {
    drawH = height;
    drawW = drawH * imageRatio;
    drawX = (width - drawW) / 2;
    drawY = 0;
  } else {
    drawW = width;
    drawH = drawW / imageRatio;
    drawX = 0;
    drawY = (height - drawH) / 2;
  }

  return { drawX, drawY, drawW, drawH };
}

/**
 * Flatten the original photo and placed props into a 1200×1800 JPEG.
 * Props stay independent until this export; the branded frame is applied later.
 */
export async function composePhotoWithProps(photoSrc, placedProps) {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  const photo = await loadImage(photoSrc);
  const photoRect = coverRect(photo, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  ctx.drawImage(
    photo,
    photoRect.drawX,
    photoRect.drawY,
    photoRect.drawW,
    photoRect.drawH
  );

  const ordered = [...(placedProps || [])].sort(
    (a, b) => (a.z || 0) - (b.z || 0)
  );

  for (const prop of ordered) {
    const asset = getTalabatProp(prop.propId);
    if (!asset || !prop.w) continue;

    let img;
    try {
      img = await loadImage(asset.src);
    } catch (error) {
      console.error("Skipping prop", prop.propId, error);
      continue;
    }

    const aspect = img.naturalWidth / img.naturalHeight || prop.aspect || 1;
    const drawW = prop.w * OUTPUT_WIDTH;
    const drawH =
      prop.h != null ? prop.h * OUTPUT_HEIGHT : drawW / aspect;
    const centerX = prop.x * OUTPUT_WIDTH + drawW / 2;
    const centerY = prop.y * OUTPUT_HEIGHT + drawH / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(((prop.rotation || 0) * Math.PI) / 180);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}
