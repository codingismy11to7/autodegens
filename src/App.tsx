import { useCallback, useEffect } from "react";

const App = () => {
  const onButtonClick = useCallback(() => {
    console.log("hello world");
  }, []);

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

  return <></>;
};

export default App;
