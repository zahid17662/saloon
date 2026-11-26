/** Photo shown on a category tile. Free Pexels photos, cropped into public/cat/. */
const MAP: [RegExp, string][] = [
  [/colou?r|dye|highlight/i, "color"],
  [/facial|face|shave|beard/i, "facial"],
  [/massage|body|chair/i, "massage"],
  [/treatment|wash|spa|care/i, "treatment"],
];

export function categoryPhoto(name: string) {
  return `/cat/${MAP.find(([re]) => re.test(name))?.[1] ?? "haircut"}.jpg`;
}
