import type { Font as FontkitFont } from "fontkit";

interface FvarAxis {
  axisTag: string;
}

interface FvarInstance {
  coord: number[];
  name?: Record<string, string>;
}

interface FvarTable {
  axis: FvarAxis[];
  instance: FvarInstance[];
}

export interface NamedVariationInstance {
  name: string;
  values: Record<string, number>;
}

export function buildVariationSettings(values: Record<string, number>): string {
  return Object.entries(values)
    .map(([tag, value]) => `"${tag}" ${value}`)
    .join(", ");
}

/**
 * Reads the `fvar` table's named instances directly (same pattern as
 * font-metadata.ts reading `font["OS/2"]`) — fontkit's public `Font` type
 * doesn't expose named instances, only `getVariation(name | coords)`.
 */
export function getNamedInstances(font: FontkitFont): NamedVariationInstance[] {
  const fvar = (font as FontkitFont & { fvar?: FvarTable }).fvar;
  if (!fvar) {
    return [];
  }

  const tags = fvar.axis.map((axis) => axis.axisTag);
  return fvar.instance.map((instance) => ({
    // Some fonts (e.g. Segoe UI Variable's default 400/10.5 instance) have
    // a nameID whose `name` table entry fontkit can't resolve, leaving
    // `instance.name` itself undefined rather than an empty name record.
    name:
      instance.name?.en ??
      (instance.name ? Object.values(instance.name)[0] : undefined) ??
      "Instance",
    values: Object.fromEntries(
      tags.map((tag, index) => [tag, instance.coord[index]])
    ),
  }));
}
