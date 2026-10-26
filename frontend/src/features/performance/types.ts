export type Performance = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  ageRating: string;
};

export type PerformanceSession = {
  sessionId: number;
  startsAt: string;
  minPrice: number | null;
  maxPrice: number | null;
  remainingSeatCount: number;
};
