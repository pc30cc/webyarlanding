// بایت‌های wasm کدک‌های jsquash (png decode + webp encode) را به‌صورت base64 داخل
// یک فایل TypeScript جاسازی می‌کند — دقیقاً همان روشی که خود @cf-wasm/photon استفاده
// می‌کند (photon_rs_bg.wasm.inline.js)، چون باندلر این پروژه (Rolldown/Vite) پشتیبانی
// بومی از import مستقیم فایل .wasm ندارد، اما یک رشته‌ی base64 مثل هر ماژول دیگری
// باندل می‌شود. اجرا بعد از هر npm install که این نسخه‌ها را عوض کند:
//   node scripts/generate-wasm-inline.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const files = [
  {
    path: path.join(rootDir, "node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm"),
    varName: "PNG_DECODE_WASM_BASE64",
  },
  {
    path: path.join(rootDir, "node_modules/@jsquash/webp/codec/enc/webp_enc.wasm"),
    varName: "WEBP_ENCODE_WASM_BASE64",
  },
];

let out = `// این فایل خودکار تولید شده — دستی ویرایش نکنید.
// تولید دوباره: node scripts/generate-wasm-inline.mjs

`;

for (const { path: wasmPath, varName } of files) {
  const bytes = fs.readFileSync(wasmPath);
  const b64 = bytes.toString("base64");
  out += `export const ${varName} = "${b64}";\n`;
  console.log(varName, "raw:", bytes.length, "base64 chars:", b64.length);
}

const outPath = path.join(rootDir, "src/lib/wasm-codecs.generated.ts");
fs.writeFileSync(outPath, out);
console.log("wrote", path.relative(rootDir, outPath));
