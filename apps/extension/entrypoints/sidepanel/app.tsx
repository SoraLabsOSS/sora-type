import { useEffect, useState } from "react";
import { i18n } from "#i18n";
import { PageFontsSection } from "@/components/page-fonts-section";
import { RecentFontsSection } from "@/components/recent-fonts-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sidePanelInitialTab } from "@/utils/storage";

function App() {
  const [activeTab, setActiveTab] = useState<"page" | "recent">("page");

  useEffect(() => {
    sidePanelInitialTab.getValue().then((tab) => {
      if (tab === "page" || tab === "recent") {
        setActiveTab(tab);
        sidePanelInitialTab.setValue(null);
      }
    });
    return sidePanelInitialTab.watch((tab) => {
      if (tab === "page" || tab === "recent") {
        setActiveTab(tab);
        sidePanelInitialTab.setValue(null);
      }
    });
  }, []);

  return (
    <div className="flex h-screen min-w-0 flex-col gap-4 p-4">
      <h1 className="font-semibold text-lg">{i18n.t("sidepanel.title")}</h1>
      <Tabs
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        onValueChange={(value) => {
          if (value === "page" || value === "recent") {
            setActiveTab(value);
          }
        }}
        value={activeTab}
      >
        <TabsList className="w-full">
          <TabsTrigger className="flex-1" value="page">
            {i18n.t("sidepanel.pageFonts.heading")}
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="recent">
            {i18n.t("sidepanel.recentlyInspected.heading")}
          </TabsTrigger>
        </TabsList>
        <TabsContent
          className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col"
          value="page"
        >
          <PageFontsSection showHeading={false} />
        </TabsContent>
        <TabsContent
          className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col"
          value="recent"
        >
          <RecentFontsSection showHeading={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
