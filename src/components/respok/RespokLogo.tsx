/**
 * Respok logo, both brand directions, every variant and colorway — ported from the
 * Respok Brand Kit (Shared/Code/react/RespokLogo.tsx). Pure SVG drawn from the kit's
 * outlined geometry: the wordmark is drawn, never typed in a font.
 *
 * At 32 px and below the symbol switches to its small cut (bigger dot / taller pills,
 * opened-up gaps), exactly like the kit's `symbol-small` files.
 */
import type { ReactNode, SVGProps } from "react";

export type RespokConcept = "open" | "thread";
export type RespokVariant =
  | "horizontal"
  | "stacked"
  | "symbol"
  | "symbol-small"
  | "wordmark";
export type RespokColorway = "color" | "reversed" | "on-signal" | "mono";

const INK = "#16142B";
const SIGNAL = "#FF5A3C";
const WHITE = "#FFFFFF";

const WORDMARK =
  "M11.5 88.5V11.5M11.5 41.5A32 32 0 0 1 43.5 9.5M75.5 50H156.5M156.5 50A40.5 40.5 0 1 0 144.13 79.13" +
  "M239.5 19.5C233.5 12.5 225.5 9.5 216.5 9.5C202.5 9.5 191.5 17.5 191.5 29.5C191.5 41 202.5 45.5 216.5 50" +
  "C230.5 54.5 242.5 59 242.5 70.5C242.5 83.5 230.5 90.5 216.5 90.5C206.5 90.5 197.5 86.5 191.5 79.5" +
  "M279.5 11.5V130.5M279.5 50a40.5 40.5 0 1 0 81 0a40.5 40.5 0 1 0 -81 0" +
  "M394.5 50a40.5 40.5 0 1 0 81 0a40.5 40.5 0 1 0 -81 0M512.5 -30.5V88.5M554.5 11.5L514.5 61M530.5 41.2L556.5 88.5";

type Accent =
  | { circle: readonly [number, number, number] }
  | { path: string };

interface SymbolGeometry {
  box: readonly [number, number];
  main: string;
  accent: Accent;
}

/** Symbol geometry in kit units: Open 108 × 108, Thread 104 × 92. */
export const RESPOK_SYMBOL: Record<RespokConcept, SymbolGeometry> = {
  open: {
    box: [108, 108],
    main: "M41 0A41 41 0 0 1 82 41L82 78Q82 82 78 82L41 82A41 41 0 0 1 0 41A41 41 0 0 1 41 0Z",
    accent: { circle: [96, 96, 12] },
  },
  thread: {
    box: [104, 92],
    main: "M21 0H41A21 21 0 0 1 62 21V21A21 21 0 0 1 41 42H4A4 4 0 0 1 0 38V21A21 21 0 0 1 21 0Z",
    accent: {
      path: "M43 50H83A21 21 0 0 1 104 71V88A4 4 0 0 1 100 92H43A21 21 0 0 1 22 71V71A21 21 0 0 1 43 50Z",
    },
  },
};

/** Small cut, for 32 px and below. */
const SYMBOL_SMALL: Record<RespokConcept, SymbolGeometry> = {
  open: {
    box: [112, 112],
    main: "M40 0A40 40 0 0 1 80 40L80 75Q80 80 75 80L40 80A40 40 0 0 1 0 40A40 40 0 0 1 40 0Z",
    accent: { circle: [95, 95, 17] },
  },
  thread: {
    box: [108, 102],
    main: "M23 0H41A23 23 0 0 1 64 23V23A23 23 0 0 1 41 46H5A5 5 0 0 1 0 41V23A23 23 0 0 1 23 0Z",
    accent: {
      path: "M43 56H85A23 23 0 0 1 108 79V97A5 5 0 0 1 103 102H43A23 23 0 0 1 20 79V79A23 23 0 0 1 43 56Z",
    },
  },
};

// Lockup geometry, in wordmark units (x-height = 100).
const LAYOUT: Record<
  RespokConcept,
  Record<"horizontal" | "stacked", { vb: string; sym: string; wm?: string }>
> = {
  open: {
    horizontal: {
      vb: "0 -49.9 812.2 199.8",
      sym: "translate(0 -49.9) scale(1.85)",
      wm: "translate(244.2 0)",
    },
    stacked: { vb: "0 -358.8 568 500.8", sym: "translate(154.4 -358.8) scale(2.4)" },
  },
  thread: {
    horizontal: {
      vb: "0 -42 804.8 184",
      sym: "translate(0 -35.1) scale(1.85)",
      wm: "translate(236.8 0)",
    },
    stacked: { vb: "0 -320.4 568 462.4", sym: "translate(159.2 -320.4) scale(2.4)" },
  },
};

const COLORWAYS: Record<
  RespokColorway,
  { main: string; accent: string; word: string }
> = {
  color: { main: INK, accent: SIGNAL, word: INK },
  reversed: { main: WHITE, accent: SIGNAL, word: WHITE },
  "on-signal": { main: WHITE, accent: INK, word: INK },
  mono: { main: "currentColor", accent: "currentColor", word: "currentColor" },
};

export interface RespokLogoProps
  extends Omit<SVGProps<SVGSVGElement>, "height" | "width"> {
  concept?: RespokConcept;
  variant?: RespokVariant;
  colorway?: RespokColorway;
  height?: number | string;
  width?: number | string;
  /** Symbol only: force (true) or prevent (false) the small cut. Default: 32 px and below. */
  small?: boolean;
  /** Accessible name. Pass an empty string for a decorative logo next to visible text. */
  title?: string;
}

export function RespokLogo({
  concept = "open",
  variant = "horizontal",
  colorway = "color",
  height,
  width,
  small,
  title = "Respok",
  ...rest
}: RespokLogoProps) {
  const c = COLORWAYS[colorway];
  const px =
    typeof height === "number"
      ? height
      : typeof width === "number"
        ? width
        : height === undefined && width === undefined
          ? 32
          : undefined;
  const useSmall =
    variant === "symbol-small" ||
    (variant === "symbol" && (small ?? (px !== undefined && px <= 32)));
  const s = (useSmall ? SYMBOL_SMALL : RESPOK_SYMBOL)[concept];
  const symbol = (
    <>
      <path d={s.main} fill={c.main} />
      {"circle" in s.accent ? (
        <circle
          cx={s.accent.circle[0]}
          cy={s.accent.circle[1]}
          r={s.accent.circle[2]}
          fill={c.accent}
        />
      ) : (
        <path d={s.accent.path} fill={c.accent} />
      )}
    </>
  );
  const wordmark = (
    <path
      d={WORDMARK}
      fill="none"
      stroke={c.word}
      strokeWidth={23}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );

  let viewBox: string;
  let body: ReactNode;
  if (variant === "symbol" || variant === "symbol-small") {
    viewBox = `0 0 ${s.box[0]} ${s.box[1]}`;
    body = symbol;
  } else if (variant === "wordmark") {
    viewBox = "0 -42 568 184";
    body = wordmark;
  } else {
    const layout = LAYOUT[concept][variant];
    viewBox = layout.vb;
    body = (
      <>
        <g transform={layout.sym}>{symbol}</g>
        <g transform={layout.wm}>{wordmark}</g>
      </>
    );
  }
  const [, , vw = 1, vh = 1] = viewBox.split(" ").map(Number);
  const h = height ?? (width === undefined ? 32 : undefined);
  const w = width ?? (typeof h === "number" ? (h * vw) / vh : undefined);
  const decorative = title === "";

  return (
    <svg
      viewBox={viewBox}
      height={h}
      width={w}
      {...(decorative
        ? { "aria-hidden": true, focusable: "false" }
        : { role: "img", "aria-label": title })}
      {...rest}
    >
      {!decorative && <title>{title}</title>}
      {body}
    </svg>
  );
}
