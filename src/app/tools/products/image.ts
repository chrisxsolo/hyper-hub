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
