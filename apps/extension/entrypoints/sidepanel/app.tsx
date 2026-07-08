import { useEffect, useState } from "react";
import { type RecentFont, recentFonts } from "@/utils/storage";

function App() {
  const [fonts, setFonts] = useState<RecentFont[]>([]);

  useEffect(() => {
    recentFonts.getValue().then(setFonts);
    return recentFonts.watch(setFonts);
  }, []);

  return (
    <div className="flex h-screen flex-col gap-4 p-4">
      <h1 className="font-semibold text-lg">Sora Type</h1>
      <p className="text-[#888] text-sm">
        Per-page font detection is coming soon. This panel will list every font
        used on the current tab.
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <h2 className="font-medium text-sm">Recently inspected</h2>
        {fonts.length === 0 ? (
          <p className="text-[#888] text-sm">No fonts inspected yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 overflow-y-auto">
            {fonts.map((font) => (
              <li
                className="rounded-md border border-[#88888833] p-2 text-sm"
                key={`${font.family}-${font.detectedAt}`}
              >
                <p className="font-medium">{font.family}</p>
                <p className="truncate text-[#888]">{font.pageTitle}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
