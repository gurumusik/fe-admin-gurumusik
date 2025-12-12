export type CropFrame = { x: number; y: number; size: number };

type LoadResult = {
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
  initialFrame: CropFrame;
};

// Muat gambar & hitung ukuran tampilan + frame awal (1:1) yang tidak merusak rasio.
export async function loadCropImage(
  imageUrl: string,
  opts: { maxWidth?: number; maxHeight?: number; maxFrameSize?: number } = {}
): Promise<LoadResult> {
  const { maxWidth = 520, maxHeight = 520, maxFrameSize = 320 } = opts;
  await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(null);
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
    img.src = imageUrl;
  });

  const img = new Image();
  img.src = imageUrl;
  const naturalWidth = img.naturalWidth || 1;
  const naturalHeight = img.naturalHeight || 1;

  const scale = Math.min(1, Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight));
  const displayWidth = naturalWidth * scale;
  const displayHeight = naturalHeight * scale;
  const initialSize = Math.min(displayWidth, displayHeight, maxFrameSize);
  const initialFrame: CropFrame = {
    x: (displayWidth - initialSize) / 2,
    y: (displayHeight - initialSize) / 2,
    size: initialSize,
  };

  return { naturalWidth, naturalHeight, displayWidth, displayHeight, initialFrame };
}

// Pastikan frame 1:1 tetap berada di dalam kanvas tampilan dan punya ukuran minimal.
export function clampCropFrame(
  frame: CropFrame,
  displayWidth: number,
  displayHeight: number,
  minSize = 80
): CropFrame {
  const viewW = displayWidth || minSize;
  const viewH = displayHeight || minSize;
  const size = Math.min(Math.max(minSize, frame.size), Math.min(viewW, viewH));
  const maxX = Math.max(0, viewW - size);
  const maxY = Math.max(0, viewH - size);
  return {
    x: Math.min(maxX, Math.max(0, frame.x)),
    y: Math.min(maxY, Math.max(0, frame.y)),
    size,
  };
}

// Potong gambar sesuai frame (koordinat berdasarkan tampilan) menjadi dataURL square.
export async function cropImageToDataUrl(params: {
  imageUrl: string;
  frame: CropFrame;
  displayWidth: number;
  displayHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  outputSize: number;
}): Promise<string> {
  const { imageUrl, frame, displayWidth, displayHeight, naturalWidth, naturalHeight, outputSize } =
    params;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Gagal memuat gambar'));
    image.src = imageUrl;
  });

  const ratioX = naturalWidth / (displayWidth || naturalWidth);
  const ratioY = naturalHeight / (displayHeight || naturalHeight);

  const sx = frame.x * ratioX;
  const sy = frame.y * ratioY;
  const sSizeX = frame.size * ratioX;
  const sSizeY = frame.size * ratioY;

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia');

  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.drawImage(img, sx, sy, sSizeX, sSizeY, 0, 0, outputSize, outputSize);
  return canvas.toDataURL('image/png');
}
