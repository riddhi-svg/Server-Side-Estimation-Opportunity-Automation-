function erf_approx(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    const t = 1.0/(1.0 + p*x);
    const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
    return sign * y;
}

function getLogNormalScore(value, median, p10) {
    if (value === 0) return 1;
    const location = Math.log(median);
    const logRatio = Math.log(p10) - location;
    const shape = Math.abs(logRatio / (Math.SQRT2 * -0.9061938));
    const standardizedX = (Math.log(value) - location) / (Math.SQRT2 * shape);
    return 0.5 - 0.5 * erf_approx(standardizedX);
}

const metrics = {
    fcp: { value: 6451.01, median: 3000, p10: 1800, weight: 0.10 },
    lcp: { value: 21301.05, median: 3900, p10: 2500, weight: 0.25 },
    tbt: { value: 3727, median: 600, p10: 200, weight: 0.30 },
    cls: { value: 0.1036, median: 0.25, p10: 0.1, weight: 0.25 },
    si: { value: 15222.16, median: 5800, p10: 3400, weight: 0.10 }
};

let totalScore = 0;
for (const [key, m] of Object.entries(metrics)) {
    const score = getLogNormalScore(m.value, m.median, m.p10);
    console.log(`${key.toUpperCase()} Score:`, score);
    totalScore += score * m.weight;
}

console.log("Calculated Score:", Math.round(totalScore * 100));
