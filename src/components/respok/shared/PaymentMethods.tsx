/**
 * Accepted payment methods for the English site's footer: the methods Paddle (merchant of
 * record) offers at checkout, as small card-shaped chips with each brand's own mark.
 */
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import {
  siAmericanexpress,
  siApplepay,
  siDiscover,
  siGooglepay,
  siJcb,
  siPaypal,
  siVisa,
} from "simple-icons";

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

function Mark({ path, color, className }: { path: string; color: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill={color}
    >
      <path d={path} />
    </svg>
  );
}

/** Mastercard's two interlocking circles in their own colours (the icon set is single-colour). */
function MastercardMark() {
  return (
    <svg viewBox="0 0 40 24" aria-hidden="true" focusable="false" className="h-[15px] w-auto">
      <circle cx="14" cy="12" r="10" fill="#EB001B" />
      <circle cx="26" cy="12" r="10" fill="#F79E1B" />
      <path d="M20 4a10 10 0 0 1 0 16a10 10 0 0 1 0-16Z" fill="#FF5F00" />
    </svg>
  );
}

interface Method {
  name: string;
  mark: ReactNode;
}

const METHODS: Method[] = [
  { name: "Visa", mark: <Mark path={siVisa.path} color="#1A1F71" className="h-[22px] w-auto" /> },
  { name: "Mastercard", mark: <MastercardMark /> },
  {
    name: "American Express",
    mark: <Mark path={siAmericanexpress.path} color="#2E77BC" className="h-[26px] w-auto" />,
  },
  {
    name: "Discover",
    mark: <Mark path={siDiscover.path} color="#231F20" className="h-[34px] w-auto" />,
  },
  { name: "JCB", mark: <Mark path={siJcb.path} color="#0B4EA2" className="h-[22px] w-auto" /> },
  {
    name: "PayPal",
    mark: <Mark path={siPaypal.path} color="#003087" className="h-[16px] w-auto" />,
  },
  {
    name: "Apple Pay",
    mark: <Mark path={siApplepay.path} color="#000000" className="h-[24px] w-auto" />,
  },
  {
    name: "Google Pay",
    mark: <Mark path={siGooglepay.path} color="#3C4043" className="h-[24px] w-auto" />,
  },
];

/** On the Ink footers: a quiet label and a row of white card chips. */
export function PaymentMethods({ className }: { className?: string }) {
  return (
    <div className={cx("flex flex-col gap-3 sm:items-end", className)}>
      <p className="inline-flex items-center gap-2 font-rpk-mono text-[12px] tracking-[0.04em] text-white/60">
        <Lock aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
        Secure checkout by Paddle
      </p>
      <ul aria-label="Accepted payment methods" className="flex flex-wrap gap-1.5 sm:justify-end">
        {METHODS.map((method) => (
          <li
            key={method.name}
            title={method.name}
            className="grid h-8 w-[50px] place-items-center rounded-[6px] bg-white shadow-[0_1px_0_rgb(255_255_255/0.08),inset_0_0_0_1px_rgb(22_20_43/0.06)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {method.mark}
            <span className="sr-only">{method.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
