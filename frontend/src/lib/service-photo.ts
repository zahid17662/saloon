/** Real photo for a service, picked by its name. Free Pexels photos in public/svc/ (see CREDITS.md). */
const RULES: [RegExp, string][] = [
  [/hydra.*mini|mini.*hydra/i, "/svc/fhydramini.jpg"],
  [/hydra/i, "/svc/fhydrafull.jpg"],
  [/gold/i, "/svc/fgold.jpg"],
  [/diamond/i, "/svc/fdiamond.jpg"],
  [/silver/i, "/svc/fsilver.jpg"],
  [/acme/i, "/svc/facme.jpg"],
  [/fruit/i, "/svc/ffruit.jpg"],
  [/facial|bright/i, "/svc/fbright.jpg"],
  [/shin/i, "/svc/shine.jpg"],
  [/highlight/i, "/svc/highlight.jpg"],
  [/black/i, "/svc/cblack.jpg"],
  [/brown/i, "/svc/cbrown.jpg"],
  [/begin|beige/i, "/svc/cbegin.jpg"],
  [/colou?r|dye/i, "/svc/cbrown.jpg"],
  [/rebond/i, "/svc/rebond.jpg"],
  [/straight/i, "/svc/straight.jpg"],
  [/spa/i, "/svc/spa.jpg"],
  [/treat/i, "/svc/treat.jpg"],
  [/wash|shampoo/i, "/svc/wash.jpg"],
  [/beard|shav|trim/i, "/svc/beard.jpg"],
  [/setup|set up|style|styling/i, "/svc/setup.jpg"],
  [/massage|chair/i, "/cat/massage.jpg"],
  [/cut/i, "/cat/haircut.jpg"],
];

/** Returns a photo path, or null when no photo fits the name. */
export function servicePhoto(name: string): string | null {
  return RULES.find(([re]) => re.test(name))?.[1] ?? null;
}
