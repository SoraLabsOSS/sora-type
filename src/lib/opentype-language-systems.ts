import type { Font as FontkitFont } from "fontkit";
import {
  OT_TO_HTML_LANG,
  type OtToHtmlLangEntry,
} from "@/data/ot-to-html-lang";

interface LangSysRecord {
  tag: string;
}

interface ScriptTable {
  defaultLangSys?: unknown;
  langSysRecords: LangSysRecord[];
}

interface ScriptRecord {
  script: ScriptTable;
  tag: string;
}

interface OtLayoutTable {
  scriptList?: ScriptRecord[];
}

function collectLangSysTags(table: OtLayoutTable | undefined): Set<string> {
  const tags = new Set<string>();
  for (const scriptRecord of table?.scriptList ?? []) {
    if (scriptRecord.script.defaultLangSys) {
      tags.add("dflt");
    }
    for (const record of scriptRecord.script.langSysRecords) {
      tags.add(record.tag.trim());
    }
  }
  return tags;
}

/**
 * Every language a font's GSUB/GPOS layout tables declare explicit support
 * for (via `langSys` records) — a different signal than character-repertoire
 * based language detection (see font-language-detection.ts): this answers
 * "which languages does the font's own layout tables say it handles",
 * independent of whether the font even has the right characters.
 */
export function getLanguageSystems(font: FontkitFont): OtToHtmlLangEntry[] {
  const gsub = (font as FontkitFont & { GSUB?: OtLayoutTable }).GSUB;
  const gpos = (font as FontkitFont & { GPOS?: OtLayoutTable }).GPOS;
  const allTags = new Set([
    ...collectLangSysTags(gsub),
    ...collectLangSysTags(gpos),
  ]);
  return OT_TO_HTML_LANG.filter((entry) => allTags.has(entry.ot));
}
