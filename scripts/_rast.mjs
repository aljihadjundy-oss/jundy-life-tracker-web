import sharp from "sharp";
import { readFileSync } from "node:fs";
const out = process.argv[2];
const svg = readFileSync("public/brand/mark.svg", "utf8").replace(/currentColor/g, "#1c1c1c");
await sharp(Buffer.from(svg)).resize(600, 600).flatten({ background: "#ffffff" }).png().toFile(out);
console.log("ok");
