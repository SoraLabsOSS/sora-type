import { createRoot, type Root } from "react-dom/client";
import { pickerEnabled } from "@/utils/storage";
import { PickerRoot } from "./picker-root";
import "./style.css";

const Z_INDEX_MAX = 2_147_483_647;

export default defineContentScript({
  matches: ["*://*/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      alignment: "top-left",
      anchor: "body",
      name: "sora-type-picker",
      position: "overlay",
      zIndex: Z_INDEX_MAX,
      onMount: (uiContainer, _shadow, shadowHost) => {
        const root = createRoot(uiContainer);
        root.render(<PickerRoot shadowHost={shadowHost} />);
        return root;
      },
      onRemove: (root?: Root) => {
        root?.unmount();
      },
    });

    const applyEnabled = (enabled: boolean) => {
      if (enabled) {
        ui.mount();
      } else {
        ui.remove();
      }
    };

    applyEnabled(await pickerEnabled.getValue());
    const unwatch = pickerEnabled.watch(applyEnabled);

    ctx.onInvalidated(() => {
      unwatch();
      ui.remove();
    });
  },
});
