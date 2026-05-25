/**
 * math for intro slide crossfades driven by horizontal scroll position (`scrollX` in px).
 * each slide is `pageWidth` wide; opacity interpolations peak when that slide is centered.
 */

/** input stops for `scrollX.interpolate` so layer `i` is fully visible when slide `i` is centered */
export function crossfadeInputRange(i: number, pageWidth: number, pageCount: number): number[] {
  if (pageCount <= 1) return [0, pageWidth];
  if (i === 0) return [0, pageWidth];
  if (i === pageCount - 1) return [(i - 1) * pageWidth, i * pageWidth];
  return [(i - 1) * pageWidth, i * pageWidth, (i + 1) * pageWidth];
}

/** opacity keyframes matching `crossfadeInputRange` — first/last slide only neighbor; middle slides fade between both sides */
export function crossfadeOutputRange(i: number, pageCount: number): number[] {
  if (pageCount <= 1) return [1, 1];
  if (i === 0) return [1, 0];
  if (i === pageCount - 1) return [0, 1];
  return [0, 1, 0];
}

/** split title string around highlight token for nested `<Text>` styling (first match only) */
export function splitIntroTitleHighlight(title: string, highlightText?: string) {
  if (!highlightText) {
    return { before: title, match: '', after: '' };
  }
  const start = title.indexOf(highlightText);
  if (start < 0) {
    return { before: title, match: '', after: '' };
  }
  const end = start + highlightText.length;
  return {
    before: title.slice(0, start),
    match: title.slice(start, end),
    after: title.slice(end),
  };
}
