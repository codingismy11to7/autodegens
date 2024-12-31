import { createTheme, ThemeProvider } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { runP } from "./bootstrap.ts";
import { Extension, ExtensionContext, ExtensionType } from "./extension";
import { OptionsDialog } from "./OptionsDialog.tsx";

const extensionP = runP(Extension);

const App = () => {
  const [optionsOpen, setOptionsOpen] = useState(false);

  const [extension, setExtension] = useState<ExtensionType>();

  useEffect(() => {
    void extensionP.then(setExtension);
  }, []);

  const onAutoDegensClick = useCallback(() => setOptionsOpen(o => !o), []);

  useEffect(() => {
    if (!document.getElementById("autodegensButton")) {
      const settings = document.getElementById("settingsButton")!;
      const ourButton = settings.cloneNode() as HTMLElement;
      ourButton.id = "autodegensButton";
      ourButton.innerText = "AutoDegens";
      const settingsStyle = window.getComputedStyle(settings);
      Array.from(settingsStyle).forEach(k => ourButton.style.setProperty(k, settingsStyle.getPropertyValue(k)));
      ourButton.style.backgroundColor = "purple";
      ourButton.onclick = onAutoDegensClick;
      settings.parentElement!.replaceChildren(...settings.parentElement!.childNodes, ourButton);
    }
  }, [onAutoDegensClick]);

  const theme = createTheme({
    palette: { mode: "dark", primary: { main: "#28a745" }, secondary: { main: "#c0392b" } },
  });

  return (
    <ThemeProvider theme={theme}>
      {extension ? (
        <ExtensionContext.Provider value={extension}>
          <OptionsDialog
            open={optionsOpen}
            onClose={() => setOptionsOpen(false)}
            requestOpenToggle={onAutoDegensClick}
          />
        </ExtensionContext.Provider>
      ) : (
        <></>
      )}
    </ThemeProvider>
  );
};

export default App;
