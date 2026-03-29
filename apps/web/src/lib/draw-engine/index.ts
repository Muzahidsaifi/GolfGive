// ============================================================
// DRAW ENGINE — Core Logic
// Supports: Random Draw & Algorithmic (frequency-weighted) Draw
// ============================================================

import { MatchType } from '@/types'

const MIN_SCORE = 1
const MAX_SCORE = 45
const DRAW_COUNT = 5

// ---------- Random Draw ----------

/**
 * Generates 5 unique random numbers between 1 and 45 (Stableford range)
 */
export function generateRandomDraw(): number[] {
  const numbers = new Set<number>()
  while (numbers.size < DRAW_COUNT) {
    numbers.add(Math.floor(Math.random() * MAX_SCORE) + MIN_SCORE)
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

// ---------- Algorithmic Draw ----------

interface ScoreFrequency {
  score: number
  frequency: number
  weight: number
}

/**
 * Builds a frequency map from all user scores
 */
export function buildFrequencyMap(allScores: number[]): Map<number, number> {
  const freq = new Map<number, number>()
  for (let i = MIN_SCORE; i <= MAX_SCORE; i++) freq.set(i, 0)
  allScores.forEach(score => freq.set(score, (freq.get(score) || 0) + 1))
  return freq
}

/**
 * Algorithmic draw: weighted toward LEAST frequent scores (rarer = harder to match = fairer)
 * This makes the draw harder to win if everyone picks the same scores.
 */
export function generateAlgorithmicDraw(allScores: number[]): number[] {
  const freqMap = buildFrequencyMap(allScores)
  const maxFreq = Math.max(...freqMap.values()) + 1

  // Invert frequency: rare scores get higher weight
  const weighted: ScoreFrequency[] = []
  freqMap.forEach((frequency, score) => {
    weighted.push({
      score,
      frequency,
      weight: maxFreq - frequency,
    })
  })

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0)
  const selected = new Set<number>()

  while (selected.size < DRAW_COUNT) {
    let rand = Math.random() * totalWeight
    for (const item of weighted) {
      rand -= item.weight
      if (rand <= 0 && !selected.has(item.score)) {
        selected.add(item.score)
        break
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b)
}

// ---------- Match Detection ----------

/**
 * Counts how many of a user's scores match the winning numbers
 */
export function countMatches(userScores: number[], winningNumbers: number[]): number {
  const winSet = new Set(winningNumbers)
  return userScores.filter(score => winSet.has(score)).length
}

/**
 * Determines the match type for a user's scores against winning numbers
 */
export function getMatchType(userScores: number[], winningNumbers: number[]): MatchType {
  const matches = countMatches(userScores, winningNumbers)
  if (matches >= 5) return '5-match'
  if (matches >= 4) return '4-match'
  if (matches >= 3) return '3-match'
  return 'no-match'
}

// ---------- Prize Pool Calculation ----------

export interface PrizePoolCalculation {
  totalPool: number
  jackpotPool: number      // 40%
  fourMatchPool: number    // 35%
  threeMatchPool: number   // 25%
}

const POOL_PERCENTAGES = {
  jackpot:    0.40,
  fourMatch:  0.35,
  threeMatch: 0.25,
}

export function calculatePrizePool(
  subscriberCount: number,
  monthlyPriceGBP: number,
  poolContributionPercent: number = 0.5,   // 50% of subscription goes to prize pool
  rolloverAmount: number = 0
): PrizePoolCalculation {
  const basePool = subscriberCount * monthlyPriceGBP * poolContributionPercent
  const totalPool = basePool + rolloverAmount

  return {
    totalPool,
    jackpotPool:   totalPool * POOL_PERCENTAGES.jackpot,
    fourMatchPool: totalPool * POOL_PERCENTAGES.fourMatch,
    threeMatchPool: totalPool * POOL_PERCENTAGES.threeMatch,
  }
}

/**
 * Splits a prize tier equally among multiple winners
 */
export function splitPrize(poolAmount: number, winnerCount: number): number {
  if (winnerCount === 0) return 0
  return Math.floor((poolAmount / winnerCount) * 100) / 100
}

// ---------- Simulation ----------

export interface DrawSimulation {
  winningNumbers: number[]
  fiveMatchWinners: number
  fourMatchWinners: number
  threeMatchWinners: number
  prizePerFiveMatch: number
  prizePerFourMatch: number
  prizePerThreeMatch: number
  jackpotRolls: boolean
}

export function simulateDraw(
  allUserScores: number[][],        // Array of each user's 5 scores
  winningNumbers: number[],
  prizePool: PrizePoolCalculation
): DrawSimulation {
  let fiveMatch = 0
  let fourMatch = 0
  let threeMatch = 0

  allUserScores.forEach(userScores => {
    const matchType = getMatchType(userScores, winningNumbers)
    if (matchType === '5-match') fiveMatch++
    else if (matchType === '4-match') fourMatch++
    else if (matchType === '3-match') threeMatch++
  })

  return {
    winningNumbers,
    fiveMatchWinners: fiveMatch,
    fourMatchWinners: fourMatch,
    threeMatchWinners: threeMatch,
    prizePerFiveMatch: splitPrize(prizePool.jackpotPool, fiveMatch),
    prizePerFourMatch: splitPrize(prizePool.fourMatchPool, fourMatch),
    prizePerThreeMatch: splitPrize(prizePool.threeMatchPool, threeMatch),
    jackpotRolls: fiveMatch === 0,
  }
}
