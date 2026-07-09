import { useEffect, useState } from "react";
import { i18n } from "#i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { pickerEnabled } from "@/utils/storage";

function ShortcutKeys({ shortcut }: { shortcut: string }) {
  const parts = shortcut.split("+").map((part) => part.trim());

  return (
    <KbdGroup>
      {parts.map((part) => (
        <Kbd key={part}>{part}</Kbd>
      ))}
    </KbdGroup>
  );
}

export function PickerToggle() {
  const [enabled, setEnabled] = useState(false);
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    pickerEnabled.getValue().then(setEnabled);
    return pickerEnabled.watch(setEnabled);
  }, []);

  useEffect(() => {
    browser.commands.getAll().then((commands) => {
      const toggle = commands.find((c) => c.name === "toggle-picker");
      setShortcut(toggle?.shortcut || null);
    });
  }, []);

  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Label className="font-medium text-sm" htmlFor="picker-toggle">
            {i18n.t("popup.pickerLabel")}
          </Label>
          <p className="text-muted-foreground text-xs">
            {shortcut ? (
              <span className="inline-flex flex-wrap items-center gap-1">
                {i18n.t("popup.pickerHint")}
                <ShortcutKeys shortcut={shortcut} />
              </span>
            ) : (
              i18n.t("popup.pickerHint")
            )}
          </p>
        </div>
        <Switch
          checked={enabled}
          id="picker-toggle"
          onCheckedChange={(checked) => pickerEnabled.setValue(checked)}
        />
      </CardContent>
    </Card>
  );
}
