export type FontSource = unknown;

export function useFonts(fonts: Record<string, FontSource>): [boolean, Error | null];
export function loadAsync(fontFamilyOrFontMap: string | Record<string, FontSource>, source?: FontSource): Promise<void>;
export function renderToImageAsync(glyphs: string, options?: unknown): Promise<string>;
