import { mountRoot } from "./main.tsx";

if (!document.getElementById("autodegens")) {
  const div = document.createElement("div");
  div.id = "autodegens";
  document.body.appendChild(div);
  mountRoot("autodegens");
}
