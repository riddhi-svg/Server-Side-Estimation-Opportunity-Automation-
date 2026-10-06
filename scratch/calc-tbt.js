// No mathjs

// Approximation of erf
function erf_approx(x) {
    // sign
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    // constants
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    // A&S formula 7.1.26
    const t = 1.0/(1.0 + p*x);
    const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
    return sign * y;
}

function getLogNormalScore(value, median, p10) {
    if (value === 0) return 1;
    const p10Score = 0.1;
    const location = Math.log(median);
    // erf_inv(1 - 2*0.1) = erf_inv(0.8) = 0.9061938
    const logRatio = Math.log(p10) - location;
    const shape = Math.abs(logRatio / (Math.SQRT2 * -0.9061938));
    
    const standardizedX = (Math.log(value) - location) / (Math.SQRT2 * shape);
    return 0.5 - 0.5 * erf_approx(standardizedX);
}

console.log("Current TBT (2659) score:", getLogNormalScore(2659, 600, 200));
console.log("Estimated TBT (1349) score:", getLogNormalScore(1349, 600, 200));
