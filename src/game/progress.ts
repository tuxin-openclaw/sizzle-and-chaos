import { LEVEL_STORAGE_KEY } from "./data";

export interface BestRecord {
  score: number;
  stars: number;
  served: number;
}

export type BestBook = Record<string, BestRecord>;

export function loadBestBook(): BestBook {
  try {
    const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BestBook;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function recordBest(
  levelId: string,
  score: number,
  stars: number,
  served: number,
): BestRecord {
  const book = loadBestBook();
  const previous = book[levelId];
  if (!previous || score > previous.score) {
    book[levelId] = { score, stars, served };
    try {
      localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(book));
    } catch {
      /* private mode can reject storage */
    }
  } else if (stars > previous.stars) {
    book[levelId] = { ...previous, stars };
    try {
      localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(book));
    } catch {
      /* ignore */
    }
  }
  return book[levelId] ?? { score, stars, served };
}
