import type { Lane } from "@/lib/queue";

/** Round profile picture of a barber, or the initial letter when no picture was added. */
export function BarberFace({ lane, size, className = "" }: { lane: Pick<Lane, "name" | "initial" | "photo">; size: number; className?: string }) {
  return lane.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={lane.photo} alt={lane.name} width={size} height={size} style={{ width: size, height: size }} className={`flex-none rounded-full object-cover ${className}`} />
  ) : (
    <span style={{ width: size, height: size, fontSize: size * 0.4 }} className={`flex flex-none items-center justify-center rounded-full bg-primary-soft font-bold text-primary ${className}`} aria-hidden="true">
      {lane.initial}
    </span>
  );
}

/** Center-crop to a 256px square JPEG so it fits in localStorage. */
export async function squarePhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 256, 256);
  return c.toDataURL("image/jpeg", 0.85);
}
