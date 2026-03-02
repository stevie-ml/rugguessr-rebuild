export interface RugLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface Rug {
  id: string;
  title: string;
  imageUrl: string;
  location: RugLocation;
  source: string;
  museumUrl: string;
  date?: string;
  medium?: string;
  dimensions?: string;
  culture?: string;
  description?: string;
  collection?: string;
}

export interface RoundResult {
  rug: Rug;
  guessLat: number;
  guessLng: number;
  distanceKm: number;
  score: number;
}

export interface GameState {
  rounds: RoundResult[];
  currentRound: number;
  totalRounds: number;
  currentRug: Rug | null;
  phase: 'loading' | 'guessing' | 'result' | 'finished';
}

export interface DailyScore {
  score: number;
  timestamp: number;
}

export interface ProvenanceValidation {
  isSpecific: boolean;
  isRug: boolean;
  lat?: number;
  lng?: number;
  reason?: string;
}
