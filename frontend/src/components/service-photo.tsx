import Image from "next/image";
import { servicePhoto } from "@/lib/service-photo";
import { ServiceArt } from "./service-icon";

/** Fills its (relative, sized) parent with the service's real photo; falls back to the line-art icon. */
export function ServicePhoto({ name, sizes = "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw" }: { name: string; sizes?: string }) {
  const src = servicePhoto(name);
  if (!src) return <ServiceArt name={name} size={160} className="relative block h-full w-full" />;
  return <Image src={src} alt="" fill sizes={sizes} className="object-cover transition-transform duration-300 group-hover:scale-105" />;
}
