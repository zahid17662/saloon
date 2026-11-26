import type { Lane } from "@/lib/queue";
import { HairdresserPortrait } from "./service-icon";

/** Round profile picture of a barber, or an illustrated demo portrait when no picture was added. */
export function BarberFace({ lane, size, className = "" }: { lane: Pick<Lane, "id" | "name" | "initial" | "photo">; size: number; className?: string }) {
  return lane.photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={lane.photo} alt={lane.name} width={size} height={size} style={{ width: size, height: size }} className={`flex-none rounded-full object-cover ${className}`} />
  ) : (
    <HairdresserPortrait id={lane.id} size={size} className={className} />
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
