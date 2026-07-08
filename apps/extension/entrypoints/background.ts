import { pickerEnabled } from "@/utils/storage";

// Must match the command name registered in wxt.config.ts's manifest.commands.
const TOGGLE_PICKER_COMMAND = "toggle-picker";

export default defineBackground(() => {
  browser.commands.onCommand.addListener((command) => {
    if (command === TOGGLE_PICKER_COMMAND) {
      pickerEnabled.getValue().then((enabled) => {
        pickerEnabled.setValue(!enabled);
      });
    }
  });
});
