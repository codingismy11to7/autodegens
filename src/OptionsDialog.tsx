import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch } from "@mui/material";
import { Effect } from "effect";
import { useCallback, useContext, useEffect, useState } from "react";
import { ExtensionContext } from "./extension";

type Props = Readonly<{ open: boolean; onClose: () => void }>;

export const OptionsDialog = ({ open, onClose }: Props) => {
  const extension = useContext(ExtensionContext);

  const [enabled, setEnabled] = useState(false);

  const refreshEnabled = useCallback(() => {
    Effect.runPromise(extension.enabled).then(setEnabled);
  }, [extension.enabled]);

  useEffect(() => {
    const timer = setInterval(refreshEnabled, 1000);

    return () => clearInterval(timer);
  }, [refreshEnabled]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Options</DialogTitle>
      <DialogContent>
        <FormControlLabel
          label="Enabled"
          control={
            <Switch
              checked={enabled}
              onChange={(_, checked) => Effect.runPromise(extension.setEnabled(checked)).then(refreshEnabled)}
            />
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
