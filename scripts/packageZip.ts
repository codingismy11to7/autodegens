import AdmZip from "adm-zip";
import path from "path";
import { __dirname } from "./util.ts";

const zip = new AdmZip();
zip.addLocalFolder(path.join(__dirname, "..", "dist"), "autodegens");
await zip.writeZipPromise(path.join(__dirname, "..", "extension-upload", "extension.zip"), { overwrite: true });
