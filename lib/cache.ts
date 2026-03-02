import { Rug } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

// The main rug pool - stored server-side in memory
let rugPool: Rug[] = [];
let poolTimestamp = 0;
const POOL_TTL = 30 * 60 * 1000; // 30 minutes
let poolRefreshing = false;

export function getRugPool(): Rug[] {
  return rugPool;
}

export function isPoolStale(): boolean {
  return rugPool.length === 0 || Date.now() - poolTimestamp > POOL_TTL;
}

export function isPoolRefreshing(): boolean {
  return poolRefreshing;
}

export function setPoolRefreshing(v: boolean): void {
  poolRefreshing = v;
}

export function setRugPool(rugs: Rug[]): void {
  rugPool = rugs;
  poolTimestamp = Date.now();
}

export function removeFromPool(id: string): void {
  rugPool = rugPool.filter(r => r.id !== id);
}

// Daily scores - in-memory store keyed by date string
const dailyScores = new Map<string, number[]>();

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDailyScore(score: number): void {
  const key = getTodayKey();
  const scores = dailyScores.get(key) || [];
  scores.push(score);
  dailyScores.set(key, scores);
}

export function getDailyScores(): number[] {
  const key = getTodayKey();
  return dailyScores.get(key) || [];
}
