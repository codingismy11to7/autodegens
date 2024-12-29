import { Close } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { Duration, Effect, pipe } from "effect";
import { useContext, useEffect, useRef, useState } from "react";
import { ExtensionContext } from "./extension";

type Props = Readonly<{ open: boolean; onClose: () => void }>;

export const OptionsDialog = ({ open, onClose }: Props) => {
  const extension = useContext(ExtensionContext);

  const [enabled, setEnabled] = useState(Effect.runSync(extension.enabled));

  useEffect(() => {
    const { cancel } = Effect.runSync(extension.addEnabledListener(setEnabled));

    return () => {
      void Effect.runPromise(cancel);
    };
  }, [extension]);

  const [config, setConfig] = useState(Effect.runSync(extension.config));

  useEffect(() => {
    const { cancel } = Effect.runSync(extension.addConfigListener(setConfig));

    return () => {
      void Effect.runPromise(cancel);
    };
  }, [extension]);

  const buyFirstHandler = useRef((evt: KeyboardEvent) => {
    if (evt.key === "r") {
      void Effect.runPromise(extension.buyFirstUpgrade);
    }
  });
  useEffect(() => {
    if (config.buyFirstHotkey) document.addEventListener("keypress", buyFirstHandler.current);
    else document.removeEventListener("keypress", buyFirstHandler.current);
  }, [config.buyFirstHotkey]);

  const [pollRate, setPollRate] = useState(`${config.pollRate}`);
  const onPollRateBlur = () =>
    pipe(
      Duration.decodeUnknown(pollRate),
      Effect.andThen(d => extension.updateConfig({ pollRate: `${Duration.toMillis(d)} millis` })),
      Effect.catchTag("NoSuchElementException", () => Effect.sync(() => setPollRate(`${config.pollRate}`))),
      Effect.runPromise,
    );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>AutoDegen Options</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={theme => ({ position: "absolute", right: 8, top: 8, color: theme.palette.grey[500] })}
      >
        <Close />
      </IconButton>
      <DialogContent>
        <Stack direction="column" spacing={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={config.autoStart}
                onChange={(_, autoStart) => void Effect.runPromise(extension.updateConfig({ autoStart }))}
              />
            }
            label="Auto Start on load"
          />
          <Tooltip title="Press the R key to buy the first purchasable upgrade">
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.buyFirstHotkey}
                  onChange={(_, buyFirstHotkey) => void Effect.runPromise(extension.updateConfig({ buyFirstHotkey }))}
                />
              }
              label="Buy first upgrade hot key"
            />
          </Tooltip>
          <TextField
            size="small"
            label="Poll Rate"
            value={pollRate}
            onChange={e => setPollRate(e.target.value)}
            onBlur={onPollRateBlur}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          color={enabled ? "secondary" : "primary"}
          variant="contained"
          onClick={() => void Effect.runPromise(extension.setEnabled(!enabled))}
        >
          {enabled ? "Stop" : "Start"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
