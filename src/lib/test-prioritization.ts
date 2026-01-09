import { ABTestSuggestion } from "./mock-data";

/**
 * Automatic A/B Test Prioritization Algorithm
 *
 * Calculates a priority score based on multiple factors:
 * - Expected impact (conversion lift)
 * - Implementation effort
 * - Data source reliability
 * - Statistical confidence
 * - Business value
 */

interface PrioritizationFactors {
  impactWeight: number;      // 0-1, default 0.4
  effortWeight: number;       // 0-1, default 0.3
  confidenceWeight: number;   // 0-1, default 0.2
  urgencyWeight: number;      // 0-1, default 0.1
}

const DEFAULT_WEIGHTS: PrioritizationFactors = {
  impactWeight: 0.4,
  effortWeight: 0.3,
  confidenceWeight: 0.2,
  urgencyWeight: 0.1,
};

/**
 * Extract numeric value from expected impact string
 * Examples: "+15% CR" -> 15, "+€5,000" -> 5000
 */
function parseExpectedImpact(impactString: string): number {
  const percentMatch = impactString.match(/(\d+(?:\.\d+)?)%/);
  if (percentMatch) {
    return parseFloat(percentMatch[1]);
  }

  const currencyMatch = impactString.match(/[€$]?([\d,]+)/);
  if (currencyMatch) {
    return parseFloat(currencyMatch[1].replace(/,/g, '')) / 1000; // Normalize to thousands
  }

  return 0;
}

/**
 * Calculate effort score (0-100, higher = less effort)
 * Based on heuristics about test complexity
 */
function calculateEffortScore(suggestion: ABTestSuggestion): number {
  const element = suggestion.element.toLowerCase();
  const hypothesis = suggestion.hypothesis.toLowerCase();

  // Simple text/color changes = low effort (high score)
  if (
    element.includes('button') ||
    element.includes('color') ||
    element.includes('text') ||
    element.includes('headline') ||
    element.includes('copy')
  ) {
    return 90;
  }

  // Form changes = medium effort
  if (
    element.includes('form') ||
    element.includes('field') ||
    element.includes('input')
  ) {
    return 70;
  }

  // Layout/navigation changes = higher effort (lower score)
  if (
    element.includes('layout') ||
    element.includes('navigation') ||
    element.includes('redesign') ||
    hypothesis.includes('restructure')
  ) {
    return 40;
  }

  // Default medium effort
  return 60;
}

/**
 * Calculate confidence score based on data source reliability
 */
function calculateConfidenceScore(suggestion: ABTestSuggestion): number {
  const sourceScores: Record<string, number> = {
    'google_analytics': 95,
    'clarity': 90,
    'crazy_egg': 85,
    'combined': 80,
  };

  return sourceScores[suggestion.dataSource] || 70;
}

/**
 * Calculate urgency score based on test age and status
 */
function calculateUrgencyScore(suggestion: ABTestSuggestion): number {
  const createdDate = new Date(suggestion.createdAt);
  const now = new Date();
  const daysOld = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  // Older pending tests are more urgent
  if (suggestion.status === 'pending') {
    if (daysOld > 30) return 90;
    if (daysOld > 14) return 70;
    if (daysOld > 7) return 50;
    return 30;
  }

  // Running tests have medium urgency
  if (suggestion.status === 'running') {
    return 60;
  }

  // Completed/dismissed tests have low urgency
  return 10;
}

/**
 * Calculate overall priority score (0-100)
 */
export function calculatePriorityScore(
  suggestion: ABTestSuggestion,
  weights: PrioritizationFactors = DEFAULT_WEIGHTS
): number {
  const impactScore = parseExpectedImpact(suggestion.expectedImpact);
  const effortScore = calculateEffortScore(suggestion);
  const confidenceScore = calculateConfidenceScore(suggestion);
  const urgencyScore = calculateUrgencyScore(suggestion);

  // Normalize impact score to 0-100 range (assuming max impact is 50%)
  const normalizedImpact = Math.min((impactScore / 50) * 100, 100);

  // Weighted sum
  const totalScore =
    normalizedImpact * weights.impactWeight +
    effortScore * weights.effortWeight +
    confidenceScore * weights.confidenceWeight +
    urgencyScore * weights.urgencyWeight;

  return Math.round(totalScore);
}

/**
 * Assign priority level based on score
 */
export function assignPriorityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/**
 * Sort tests by priority score (highest first)
 */
export function prioritizeTests(
  tests: ABTestSuggestion[],
  weights?: PrioritizationFactors
): Array<ABTestSuggestion & { priorityScore: number }> {
  const testsWithScores = tests.map(test => ({
    ...test,
    priorityScore: calculatePriorityScore(test, weights),
  }));

  return testsWithScores.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Get recommended tests to run next (top N by priority)
 */
export function getRecommendedTests(
  tests: ABTestSuggestion[],
  count: number = 3,
  weights?: PrioritizationFactors
): Array<ABTestSuggestion & { priorityScore: number; recommendation: string }> {
  const pendingTests = tests.filter(t => t.status === 'pending');
  const prioritized = prioritizeTests(pendingTests, weights);

  return prioritized.slice(0, count).map(test => ({
    ...test,
    recommendation: generateRecommendation(test),
  }));
}

/**
 * Generate a recommendation message for why this test should be prioritized
 */
function generateRecommendation(test: ABTestSuggestion & { priorityScore: number }): string {
  const impact = parseExpectedImpact(test.expectedImpact);
  const effort = calculateEffortScore(test);

  if (test.priorityScore >= 80) {
    return `High ROI opportunity: ${test.expectedImpact} with ${effort >= 80 ? 'minimal' : 'moderate'} effort. Start ASAP.`;
  }

  if (test.priorityScore >= 65) {
    return `Strong candidate: Good balance of impact (${test.expectedImpact}) and feasibility.`;
  }

  if (effort >= 80) {
    return `Quick win: Low effort implementation that could deliver ${test.expectedImpact}.`;
  }

  return `Consider testing: Expected ${test.expectedImpact} improvement.`;
}

/**
 * Calculate ICE Score (Impact, Confidence, Ease)
 * Alternative prioritization framework
 */
export function calculateICEScore(suggestion: ABTestSuggestion): {
  impact: number;
  confidence: number;
  ease: number;
  score: number;
} {
  const impact = Math.min(parseExpectedImpact(suggestion.expectedImpact) * 2, 10);
  const confidence = calculateConfidenceScore(suggestion) / 10;
  const ease = calculateEffortScore(suggestion) / 10;

  const score = (impact * confidence * ease) / 3;

  return {
    impact: Math.round(impact * 10) / 10,
    confidence: Math.round(confidence * 10) / 10,
    ease: Math.round(ease * 10) / 10,
    score: Math.round(score * 10) / 10,
  };
}
