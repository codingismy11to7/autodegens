import { createTheme, ThemeProvider } from "@mui/material";
import { Effect, Layer, pipe } from "effect";
import { useCallback, useEffect, useState } from "react";
import { Extension, ExtensionContext, ExtensionType } from "./extension";
import { ExtensionLive } from "./extension/live.ts";
import { OptionsDialog } from "./OptionsDialog.tsx";
import { UILive } from "./ui/live.ts";

const MainLive = ExtensionLive.pipe(Layer.provide(UILive));
const extensionP = pipe(Extension, Effect.provide(MainLive), Effect.runPromise);

const App = () => {
  const [optionsOpen, setOptionsOpen] = useState(false);

  const [extension, setExtension] = useState<ExtensionType>();

  useEffect(() => {
    void extensionP.then(setExtension);
  }, []);

  const onButtonClick = useCallback(() => setOptionsOpen(o => !o), []);

  useEffect(() => {
    const settings = document.getElementById("settingsButton")!;
    const ourButton = settings.cloneNode() as HTMLElement;
    ourButton.id = "autodegensButton";
    ourButton.innerText = "AutoDegens";
    const settingsStyle = window.getComputedStyle(settings);
    Array.from(settingsStyle).forEach(k => ourButton.style.setProperty(k, settingsStyle.getPropertyValue(k)));
    ourButton.style.backgroundColor = "purple";
    ourButton.onclick = onButtonClick;
    settings.parentElement!.replaceChildren(...settings.parentElement!.childNodes, ourButton);
  }, [onButtonClick]);

  const theme = createTheme({ palette: { mode: "dark" } });

  return (
    <ThemeProvider theme={theme}>
      {extension ? (
        <ExtensionContext.Provider value={extension}>
          <OptionsDialog open={optionsOpen} onClose={() => setOptionsOpen(false)} />
        </ExtensionContext.Provider>
      ) : (
        <></>
      )}
    </ThemeProvider>
  );
};

export default App;
