// Client-side image helper shared by the single and batch scanners. Downscales a
// captured/selected image to a Claude-friendly JPEG and returns base64 + a
// preview data URL. Uses the DOM (canvas), so it only runs in the browser.

export async function fileToScaledJpeg(
  file: File,
  maxDim = 1568,
  quality = 0.82,
): Promise<{ base64: string; mediaType: "image/jpeg"; previewUrl: string }> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error("Could not read the image file."));
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("That image format isn't supported — try a JPEG or PNG."));
    i.src = dataUrl;
  });
  let { width, height } = img;
  const longest = Math.max(width, height);
  if (longest > maxDim) {
    const scale = maxDim / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images.");
  ctx.drawImage(img, 0, 0, width, height);
  const out = canvas.toDataURL("image/jpeg", quality);
  return { base64: out.split(",")[1] ?? "", mediaType: "image/jpeg", previewUrl: out };
}

// A crop rectangle in normalized [0,1] coordinates of the (already-rotated) image.
export type CropRect = { x: number; y: number; w: number; h: number };

function loadDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Couldn't process that image."));
    i.src = dataUrl;
  });
}

// Apply a rotation (0/90/180/270°) and optional crop to an image data URL, then
// downscale to a Claude-friendly JPEG. Used by the nutrition-label scanner so the
// owner can straighten and tighten the crop before recognition. Pure DOM/canvas.
export async function transformImage(
  dataUrl: string,
  opts: { rotateDeg?: number; crop?: CropRect | null; maxDim?: number; quality?: number } = {},
): Promise<{ base64: string; mediaType: "image/jpeg"; previewUrl: string }> {
  const { rotateDeg = 0, crop = null, maxDim = 1568, quality = 0.85 } = opts;
  const img = await loadDataUrl(dataUrl);
  const deg = ((rotateDeg % 360) + 360) % 360;
  const swap = deg === 90 || deg === 270;
  const rw = swap ? img.height : img.width;
  const rh = swap ? img.width : img.height;

  // 1. Draw the rotated full image.
  const rotated = document.createElement("canvas");
  rotated.width = rw;
  rotated.height = rh;
  const rctx = rotated.getContext("2d");
  if (!rctx) throw new Error("Your browser can't process images.");
  rctx.save();
  rctx.translate(rw / 2, rh / 2);
  rctx.rotate((deg * Math.PI) / 180);
  rctx.drawImage(img, -img.width / 2, -img.height / 2);
  rctx.restore();

  // 2. Resolve the crop rectangle in rotated pixels.
  const cx = crop ? Math.max(0, Math.round(crop.x * rw)) : 0;
  const cy = crop ? Math.max(0, Math.round(crop.y * rh)) : 0;
  const cw = crop ? Math.max(1, Math.round(crop.w * rw)) : rw;
  const ch = crop ? Math.max(1, Math.round(crop.h * rh)) : rh;

  // 3. Downscale the crop to maxDim on its longest edge.
  let outW = cw;
  let outH = ch;
  const longest = Math.max(cw, ch);
  if (longest > maxDim) {
    const scale = maxDim / longest;
    outW = Math.round(cw * scale);
    outH = Math.round(ch * scale);
  }
  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Your browser can't process images.");
  octx.drawImage(rotated, cx, cy, cw, ch, 0, 0, outW, outH);

  const url = out.toDataURL("image/jpeg", quality);
  return { base64: url.split(",")[1] ?? "", mediaType: "image/jpeg", previewUrl: url };
}
