/**
 * Lighthouse Scoring Curves & Weights
 */

const LIGHTHOUSE_WEIGHTS = {
  fcp: 0.10,
  si: 0.10,
  lcp: 0.25,
  tbt: 0.30,
  cls: 0.25
};

const LIGHTHOUSE_SCORING_CURVES = {
  mobile: {
    fcp: { p10: 1800, median: 3000 },
    si: { p10: 3387, median: 5800 },
    lcp: { p10: 2500, median: 4000 },
    tbt: { p10: 200, median: 600 },
    cls: { p10: 0.10, median: 0.25 }
  },
  desktop: {
    fcp: { p10: 934, median: 1600 },
    si: { p10: 1311, median: 2300 },
    lcp: { p10: 1200, median: 2400 },
    tbt: { p10: 150, median: 350 },
    cls: { p10: 0.10, median: 0.25 }
  }
};

module.exports = {
  LIGHTHOUSE_WEIGHTS,
  LIGHTHOUSE_SCORING_CURVES
};
