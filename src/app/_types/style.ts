// Visual tone primitives shared across surfaces (badges, tabs, banners).
// Tones map onto the design-system color ramps in tailwind.

export type SurfaceTone = | 'slate'
  | 'sky'
  | 'blue'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'violet';

export interface StatusDisplayMeta {
  label: string;
  tone: SurfaceTone;
}
