import type { IngredientId, IngredientState } from "../game/types";

const INK = "#3B2A23";

export function IngredientIcon({
  id,
  state = "raw",
  size = 34,
  className,
}: {
  id: IngredientId;
  state?: IngredientState;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    className,
    "aria-hidden": true,
  } as const;

  if (id === "bun") {
    return (
      <svg {...common}>
        <path
          d="M7 25c0-9 7.6-16 17-16s17 7 17 16c0 3-2 5-5 5H12c-3 0-5-2-5-5Z"
          fill="#E8AE68"
          stroke={INK}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <rect x="9" y="29" width="30" height="7" rx="3.5" fill="#D79751" stroke={INK} strokeWidth="2.6" />
        <path d="M15 31.5h18" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".35" />
        <circle cx="18" cy="19" r="1.6" fill="#FFF1CF" />
        <circle cx="27" cy="15.5" r="1.6" fill="#FFF1CF" />
        <circle cx="33" cy="21" r="1.4" fill="#FFF1CF" />
        <circle cx="24" cy="23" r="1.4" fill="#FFF1CF" />
      </svg>
    );
  }

  if (id === "meat") {
    const fill =
      state === "burnt" ? "#4A3A31" : state === "cooked" ? "#8B5232" : "#D97A72";
    const line = state === "burnt" ? "#251D19" : "#6E3A2D";
    return (
      <svg {...common}>
        <ellipse cx="24" cy="27" rx="17" ry="12" fill={fill} stroke={INK} strokeWidth="2.6" />
        <ellipse cx="24" cy="24" rx="17" ry="11.5" fill={fill} stroke={INK} strokeWidth="2.6" />
        {state === "cooked" || state === "burnt" ? (
          <>
            <path d="M13 22l7 6M21 19l7 6M29 19l7 6" stroke={line} strokeWidth="2.6" strokeLinecap="round" />
            {state === "burnt" ? (
              <path d="M17 15c-2-4 3-6 1-10 5 2 6 5 4 9M28 15c-2-4 3-6 1-10 5 2 6 5 4 9" fill="#7A6557" stroke={INK} strokeWidth="1.8" />
            ) : null}
          </>
        ) : (
          <>
            <circle cx="18" cy="22" r="1.5" fill="#F6B0A8" />
            <circle cx="28" cy="19" r="1.5" fill="#F6B0A8" />
            <circle cx="31" cy="27" r="1.5" fill="#F6B0A8" />
          </>
        )}
      </svg>
    );
  }

  if (id === "lettuce") {
    const chopped = state === "chopped";
    return (
      <svg {...common}>
        {chopped ? (
          <>
            <path d="M11 31c4-10 9-6 12-15 3 9 10 5 13 15-7 7-18 8-25 0Z" fill="#8CC653" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M18 30c2-5 4-7 5-10M29 28c-1-4-3-6-5-8" stroke="#4E7E31" strokeWidth="2.4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M9 29c-2-9 5-14 9-8 1-9 9-12 12-5 5-5 11 1 9 8 4 9-5 15-15 15S7 38 9 29Z" fill="#7AB94D" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M14 29c3-3 5-2 8 0M26 25c3-2 5-1 7 2M20 36c2-2 6-2 9 0" stroke="#4E7E31" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M24 39V30" stroke="#EAF4C9" strokeWidth="2.6" strokeLinecap="round" />
          </>
        )}
      </svg>
    );
  }

  if (id === "tomato") {
    const chopped = state === "chopped";
    return (
      <svg {...common}>
        {chopped ? (
          <>
            <rect x="10" y="22" width="12" height="12" rx="3" fill="#E75B45" stroke={INK} strokeWidth="2.4" transform="rotate(-8 16 28)" />
            <rect x="23" y="15" width="12" height="12" rx="3" fill="#D94834" stroke={INK} strokeWidth="2.4" transform="rotate(12 29 21)" />
            <rect x="26" y="27" width="10" height="10" rx="3" fill="#F0775E" stroke={INK} strokeWidth="2.4" />
          </>
        ) : (
          <>
            <circle cx="24" cy="28" r="14" fill="#E4543E" stroke={INK} strokeWidth="2.6" />
            <path d="M24 15c-2-5 1-7 4-8-1 4 0 6 4 7-3 1-5 1-8 1ZM24 15c-4-3-7-2-9 0 3 1 5 3 6 5M24 15c3-1 6 0 8 2-3 0-5 1-6 3" fill="#5F9A43" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <path d="M17 24c2-2 4-2 6 0" stroke="#F7A99A" strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
      </svg>
    );
  }

  return null;
}

export function PlateIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <ellipse cx="24" cy="26" rx="19" ry="14" fill="#FFFDF5" stroke={INK} strokeWidth="2.6" />
      <ellipse cx="24" cy="24" rx="19" ry="14" fill="#FFF8E8" stroke={INK} strokeWidth="2.6" />
      <ellipse cx="24" cy="24" rx="13" ry="9" fill="#F0DEC2" opacity=".65" />
    </svg>
  );
}

export function StarIcon({
  size = 30,
  filled = true,
  className,
}: {
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        d="m24 5 5.7 11.6 12.8 1.9-9.3 9 2.2 12.8L24 34.2l-11.4 6.1 2.2-12.8-9.3-9 12.8-1.9L24 5Z"
        fill={filled ? "#F6C64C" : "rgba(59,42,35,.18)"}
        stroke={filled ? INK : "rgba(59,42,35,.25)"}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {filled ? (
        <path d="M24 10.4 27 19l7 1-5.6 5.2 1.4 7.2-5.8-3.3-5.8 3.3 1.4-7.2L14 20l7-1 3-8.6Z" fill="#FFE39B" opacity=".55" />
      ) : null}
    </svg>
  );
}

export function ClockIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="12" fill="#FFF4DE" stroke={INK} strokeWidth="2.4" />
      <path d="M16 8v8l6 4" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CoinIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="12" fill="#F5C74F" stroke={INK} strokeWidth="2.4" />
      <circle cx="16" cy="16" r="7.5" fill="#FFE8A0" stroke={INK} strokeWidth="1.8" />
      <path d="M16 11v10M13 13.5c1-1.2 2-1.8 3.2-1.8 1.8 0 2.8 1 2.8 2.3 0 1.4-1.2 2-3.4 2.4-2 .4-2.6 1-2.6 2.2 0 1.4 1.3 2.2 3.1 2.2 1.3 0 2.3-.5 3.1-1.4" fill="none" stroke={INK} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function SoundIcon({ muted, size = 24 }: { muted: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M6 12h5l6-5v18l-6-5H6Z" fill="#FFF4DE" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      {muted ? (
        <path d="m22 12 7 8m0-8-7 8" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        <>
          <path d="M21 12c2 2.4 2 5.6 0 8" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M25 9c4 4 4 10 0 14" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function PauseIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="8" y="6" width="6" height="20" rx="2.5" fill={INK} />
      <rect x="18" y="6" width="6" height="20" rx="2.5" fill={INK} />
    </svg>
  );
}

export function ArrowIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M4 12h14m-5-6 6 6-6 6" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlameIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 3c1 6 7 8 7 15a7 7 0 0 1-14 0c0-4 2-6 4-8 0 3 1 4 3 4-1-5 0-8 0-11Z" fill="#F2833D" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M16 15c0 4 3 5 3 8a3 3 0 0 1-6 0c0-3 2-4 3-8Z" fill="#FFD66B" />
    </svg>
  );
}

export function ChefHatIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path d="M12 30c-6 0-9-5-7-10 2-4 6-5 9-3 1-7 6-11 12-11s11 4 12 11c3-2 7-1 9 3 2 5-1 10-7 10Z" fill="#FFFDF5" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="13" y="30" width="24" height="9" rx="3" fill="#FFF8E8" stroke={INK} strokeWidth="2.6" />
      <path d="M13 33h25" stroke={INK} strokeWidth="2" opacity=".3" />
    </svg>
  );
}
