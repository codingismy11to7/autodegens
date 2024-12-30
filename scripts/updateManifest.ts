import fs from "fs";
import path from "path";
import { __dirname } from "./util.ts";

const distManifestPath = path.join(__dirname, "..", "dist", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(distManifestPath, { encoding: "utf8" }));
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), { encoding: "utf8" }));
manifest.version = packageJson.version;
fs.writeFileSync(distManifestPath, JSON.stringify(manifest, undefined, 2), { encoding: "utf8" });
