export function snapshot(v: HTMLVideoElement, size = 384) {
  const c = document.createElement("canvas");
  const s = Math.min(v.videoWidth, v.videoHeight);
  c.width = size; c.height = size;
  c.getContext("2d")?.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.8);
}
