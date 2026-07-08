import {
  FAMILY_CLASSIFICATION_LABELS,
  type FontMetadata,
} from "./font-metadata";

export type PairingMagnitude = "distinct" | "matched" | "moderate";

export interface PairingInsight {
  id: string;
  label: string;
  leftValue: string;
  magnitude: PairingMagnitude;
  note: string;
  rightValue: string;
}

/** Buckets an absolute delta into a magnitude using two ascending thresholds. */
function bucketDelta(
  delta: number,
  matchedBelow: number,
  moderateBelow: number
): PairingMagnitude {
  if (delta < matchedBelow) {
    return "matched";
  }
  return delta < moderateBelow ? "moderate" : "distinct";
}

function xHeightRatio(metadata: FontMetadata): number {
  return metadata.metrics.xHeight / metadata.metrics.unitsPerEm;
}

function capHeightRatio(metadata: FontMetadata): number {
  return metadata.metrics.capHeight / metadata.metrics.unitsPerEm;
}

function formatRatio(value: number): string {
  return value.toFixed(2);
}

function buildXHeightInsight(
  left: FontMetadata,
  right: FontMetadata
): PairingInsight {
  const leftRatio = xHeightRatio(left);
  const rightRatio = xHeightRatio(right);
  const magnitude = bucketDelta(Math.abs(leftRatio - rightRatio), 0.015, 0.04);
  const notes: Record<PairingMagnitude, string> = {
    matched: "Lowercase letters read at a similar height between the two.",
    moderate:
      "Noticeably different lowercase proportions at the same font-size.",
    distinct:
      "Very different lowercase height — pairing at the same font-size may look mismatched.",
  };
  return {
    id: "x-height-ratio",
    label: "x-height ratio",
    leftValue: formatRatio(leftRatio),
    rightValue: formatRatio(rightRatio),
    magnitude,
    note: notes[magnitude],
  };
}

function buildCapHeightInsight(
  left: FontMetadata,
  right: FontMetadata
): PairingInsight {
  const leftRatio = capHeightRatio(left);
  const rightRatio = capHeightRatio(right);
  const magnitude = bucketDelta(Math.abs(leftRatio - rightRatio), 0.02, 0.05);
  const notes: Record<PairingMagnitude, string> = {
    matched: "Capital letters reach a similar height between the two.",
    moderate: "Noticeably different capital-letter proportions.",
    distinct:
      "Very different capital-letter height — headlines set in both may look uneven.",
  };
  return {
    id: "cap-height-ratio",
    label: "Cap-height ratio",
    leftValue: formatRatio(leftRatio),
    rightValue: formatRatio(rightRatio),
    magnitude,
    note: notes[magnitude],
  };
}

function buildWeightInsight(
  left: FontMetadata,
  right: FontMetadata
): PairingInsight {
  const delta = Math.abs(left.weightClass - right.weightClass);
  const magnitude = bucketDelta(delta, 100, 300);
  const notes: Record<PairingMagnitude, string> = {
    matched: "Both fonts sit at a similar weight.",
    moderate: "A clear but not extreme weight contrast.",
    distinct: "Strong weight contrast — typical of a heading/body split.",
  };
  return {
    id: "weight-contrast",
    label: "Weight",
    leftValue: left.weightLabel,
    rightValue: right.weightLabel,
    magnitude,
    note: notes[magnitude],
  };
}

function buildWidthInsight(
  left: FontMetadata,
  right: FontMetadata
): PairingInsight {
  const delta = Math.abs(left.widthClass - right.widthClass);
  const magnitude = bucketDelta(delta, 1, 2);
  const notes: Record<PairingMagnitude, string> = {
    matched: "Both fonts occupy a similar horizontal width.",
    moderate: "A clear but not extreme width contrast.",
    distinct: "Strong width contrast between the two.",
  };
  return {
    id: "width-contrast",
    label: "Width",
    leftValue: left.widthLabel,
    rightValue: right.widthLabel,
    magnitude,
    note: notes[magnitude],
  };
}

function buildItalicInsight(
  left: FontMetadata,
  right: FontMetadata
): PairingInsight {
  const leftSlanted = left.metrics.italicAngle !== 0;
  const rightSlanted = right.metrics.italicAngle !== 0;
  const oneSlanted = leftSlanted !== rightSlanted;
  return {
    id: "italic-angle",
    label: "Slant",
    leftValue: leftSlanted ? `${left.metrics.italicAngle}°` : "Upright",
    rightValue: rightSlanted ? `${right.metrics.italicAngle}°` : "Upright",
    magnitude: oneSlanted ? "distinct" : "matched",
    note: oneSlanted
      ? "One font is upright and the other slanted — a common way to add emphasis without changing weight."
      : "Both fonts share the same slant style.",
  };
}

/**
 * Returns null (not "unknown" vs "unknown") when either font's family
 * classification is unresolved — many fonts simply never fill in PANOSE, and
 * guessing a magnitude from missing data would be worse than omitting the
 * axis entirely.
 */
function buildClassificationInsight(
  left: FontMetadata,
  right: FontMetadata
): PairingInsight | null {
  if (
    left.familyClassification === "unknown" ||
    right.familyClassification === "unknown"
  ) {
    return null;
  }
  const same = left.familyClassification === right.familyClassification;
  return {
    id: "family-classification",
    label: "Family style",
    leftValue: FAMILY_CLASSIFICATION_LABELS[left.familyClassification],
    rightValue: FAMILY_CLASSIFICATION_LABELS[right.familyClassification],
    magnitude: same ? "matched" : "distinct",
    note: same
      ? "Both fonts share the same broad style family."
      : "A classic pairing contrast — different type styles read as clearly distinct from each other.",
  };
}

/**
 * Describes geometric differences between two fonts a user has loaded into
 * Compare — not a "compatibility score". Each axis is reported on its own,
 * in neutral language, because whether a given difference reads as a good
 * pairing depends on design intent this tool has no way to know.
 */
export function buildPairingInsights(
  left: FontMetadata,
  right: FontMetadata
): PairingInsight[] {
  return [
    buildXHeightInsight(left, right),
    buildCapHeightInsight(left, right),
    buildWeightInsight(left, right),
    buildWidthInsight(left, right),
    buildItalicInsight(left, right),
    buildClassificationInsight(left, right),
  ].filter((insight): insight is PairingInsight => insight !== null);
}
