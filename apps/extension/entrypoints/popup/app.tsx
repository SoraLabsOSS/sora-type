import { i18n } from "#i18n";
import { PickerToggle } from "@/components/picker-toggle";
import { RecentFontsSection } from "@/components/recent-fonts-section";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import {
  isSidePanelSupported,
  openSidePanel,
  openSoraType,
} from "@/utils/open-side-panel";

const POPUP_RECENT_PREVIEW_COUNT = 3;

function App() {
  const sidePanelSupported = isSidePanelSupported();

  return (
    <div className="flex w-80 flex-col gap-4 p-4">
      <h1 className="font-semibold text-lg">{i18n.t("popup.title")}</h1>

      <PickerToggle />

      <ButtonGroup className="w-full *:data-[slot=button]:flex-1">
        {sidePanelSupported && (
          <Button
            onClick={() => {
              openSidePanel();
            }}
            type="button"
          >
            {i18n.t("popup.openSidePanel")}
          </Button>
        )}
        <Button
          onClick={openSoraType}
          type="button"
          variant={sidePanelSupported ? "outline" : "default"}
        >
          {i18n.t("popup.openSoraType")}
        </Button>
      </ButtonGroup>

      <Separator />

      <RecentFontsSection
        emptyMessage={i18n.t("popup.recentFontsEmpty")}
        heading={i18n.t("popup.recentFontsHeading")}
        limit={POPUP_RECENT_PREVIEW_COUNT}
        loadAction={sidePanelSupported ? "side-panel" : "inline"}
        showHeading
      />
    </div>
  );
}

export default App;
