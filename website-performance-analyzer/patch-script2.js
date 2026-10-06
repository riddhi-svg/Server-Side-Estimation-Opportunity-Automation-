const fs = require('fs');
let content = fs.readFileSync('pagespeed-test.js', 'utf8');

const startStr = '    estimated: {';
const endStr = '    methodology: {';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `    estimated: {
        performanceScore: estimatedPerformanceScore,
        gtmTransferSize: Number((estimatedTransferSize / 1024).toFixed(2)),
        gtmMainThreadTime: Number(estimatedMainThreadTime.toFixed(2)),
        gtmBootupTime: Number(estimatedBootupTime.toFixed(2)),
        tbt: estimatedTbt,
        speedIndex: estimatedSpeedIndex,
        lcp: estimatedLcp,
        cls: estimatedCls,
        inp: estimatedInp,
        ttfb: estimatedTtfb,
        fcp: estimatedFcp
    },
    change: {
        gtmTransferSize: {
            absolute: calcAbsChange(currentGtmTransferSize / 1024, estimatedTransferSize / 1024),
            percentage: calcChange(currentGtmTransferSize, estimatedTransferSize)
        },
        gtmMainThreadTime: {
            absolute: calcAbsChange(currentGtmMainThreadTime, estimatedMainThreadTime),
            percentage: calcChange(currentGtmMainThreadTime, estimatedMainThreadTime)
        },
        gtmBootupTime: {
            absolute: calcAbsChange(currentGtmBootupTime, estimatedBootupTime),
            percentage: calcChange(currentGtmBootupTime, estimatedBootupTime)
        },
        tbt: {
            absolute: tbtAbsChange,
            percentage: tbtPctChange
        },
        speedIndex: {
            absolute: speedIndexAbsChange,
            percentage: speedIndexPctChange
        },
        inp: {
            absolute: inpAbsChange,
            percentage: inpPctChange
        },
        lcp: {
            absolute: lcpAbsChange,
            percentage: lcpPctChange
        },
        cls: {
            absolute: clsAbsChange,
            percentage: clsPctChange
        },
        fcp: {
            absolute: fcpAbsChange,
            percentage: fcpPctChange
        },
        ttfb: {
            absolute: ttfbAbsChange,
            percentage: ttfbPctChange
        },
        performanceScore: {
            points: estimatedScoreImprovement,
            status: scoreEstimationStatus,
            method: scoreEstimationMethod,
            estimatedValue: estimatedPerformanceScore,
            currentValue: currentScore,
            reconstructedScore: typeof currentScore === 'number' && mScores && mScores.tbt !== null ? Math.round(((mScores.fcp * 0.10) + (mScores.si * 0.10) + (mScores.lcp * 0.25) + (mScores.cls * 0.25) + (mScores.tbt * 0.30)) * 100) : null
        }
    },
`;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('pagespeed-test.js', content, 'utf8');
  console.log("Updated pagespeed-test.js end block successfully");
} else {
  console.log("Could not find start or end strings in pagespeed-test.js.");
}
