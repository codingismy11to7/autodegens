import { Close } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { Duration, Effect, LogLevel, pipe } from "effect";
import { useContext, useEffect, useRef, useState } from "react";
import { runP, runS } from "./bootstrap.ts";
import { ExtensionContext } from "./extension";

type Props = Readonly<{ open: boolean; onClose: () => void }>;

export const OptionsDialog = ({ open, onClose }: Props) => {
  const extension = useContext(ExtensionContext);

  const [enabled, setEnabled] = useState(runS(extension.enabled));

  useEffect(() => {
    const { cancel } = runS(extension.addEnabledListener(setEnabled));

    return () => {
      void runP(cancel);
    };
  }, [extension]);

  const [config, setConfig] = useState(runS(extension.config));

  useEffect(() => {
    const { cancel } = runS(extension.addConfigListener(setConfig));

    return () => {
      void runP(cancel);
    };
  }, [extension]);

  const buyFirstHandler = useRef((evt: KeyboardEvent) => {
    if (evt.key === "r") {
      void runP(extension.buyFirstUpgrade);
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
      runP,
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
                onChange={(_, autoStart) => void runP(extension.updateConfig({ autoStart }))}
              />
            }
            label="Auto Start on load"
          />
          <Tooltip title="Press the R key to buy the first purchasable upgrade">
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.buyFirstHotkey}
                  onChange={(_, buyFirstHotkey) => void runP(extension.updateConfig({ buyFirstHotkey }))}
                />
              }
              label="Buy first upgrade hot key"
            />
          </Tooltip>
          <FormControlLabel
            control={
              <Checkbox
                checked={config.closeLoserDialogs}
                onChange={(_, closeLoserDialogs) => void runP(extension.updateConfig({ closeLoserDialogs }))}
              />
            }
            label="Automatically close lost dialogs (meditations/battles)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={config.playGames}
                onChange={(_, playGames) => void runP(extension.updateConfig({ playGames }))}
              />
            }
            label="Play/skip games when available"
          />
          <TextField
            size="small"
            label="Poll Rate"
            value={pollRate}
            onChange={e => setPollRate(e.target.value)}
            onBlur={onPollRateBlur}
          />
          <FormControl fullWidth>
            <InputLabel id="autoDegens-logLevel">Log Level</InputLabel>
            <Select
              labelId="autoDegens-logLevel"
              value={config.logLevel}
              label="Log Level"
              onChange={e => void runP(extension.updateConfig({ logLevel: e.target.value as LogLevel.Literal }))}
            >
              {LogLevel.allLevels.map(ll => (
                <MenuItem key={ll._tag} value={ll._tag}>
                  {ll.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          color={enabled ? "secondary" : "primary"}
          variant="contained"
          onClick={() => void runP(extension.setEnabled(!enabled))}
        >
          {enabled ? "Stop" : "Start"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
