import type { Font as FontkitFont } from "fontkit";

interface FvarAxis {
  axisTag: string;
}

interface FvarInstance {
  coord: number[];
  name: Record<string, string>;
}

interface FvarTable {
  axis: FvarAxis[];
  instance: FvarInstance[];
}

export interface NamedVariationInstance {
  name: string;
  values: Record<string, number>;
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
    name: instance.name.en ?? Object.values(instance.name)[0] ?? "Instance",
    values: Object.fromEntries(
      tags.map((tag, index) => [tag, instance.coord[index]])
    ),
  }));
}
