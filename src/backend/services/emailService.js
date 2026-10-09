const { sendRawEmail } = require('./email/gmailClient');
const { renderEmailTemplate } = require('./email/emailTemplate');

/**
 * Sends a structured sGTM Speed & Performance Estimation report email.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email (default: jimit@tatvic.com)
 * @param {string} options.url - Analyzed URL
 * @param {string} options.strategy - 'mobile' | 'desktop'
 * @param {Object} options.finalResult - Final GTM migration estimation payload
 * @returns {Promise<Object>} Gmail API response
 */
async function sendReportEmail({
  to = 'jimit@tatvic.com',
  cc = '',
  url,
  strategy = 'mobile',
  finalResult
}) {
  if (!url) {
    throw new Error('Analyzed URL is required to send report email');
  }

  const scoreData = finalResult?.performanceScore ||
                    finalResult?.estimatedImpact?.performanceScore ||
                    finalResult?.performanceReport?.performanceScore || {};

  const currentScore = Math.round(Number(scoreData.current ?? finalResult?.current?.performanceScore ?? 0));
  const estScore = Math.round(Number(scoreData.projected ?? scoreData.estimated ?? finalResult?.estimated?.performanceScore ?? currentScore));
  const gain = Math.round(Number(scoreData.deltaPoints ?? (estScore - currentScore)));

  const subject = `sGTM Performance Estimation Report: ${new URL(url).hostname} (Score: ${currentScore} ➔ ${estScore}, +${gain} pts)`;

  const htmlBody = renderEmailTemplate({
    url,
    strategy,
    finalResult
  });

  return await sendRawEmail({
    to,
    cc,
    subject,
    htmlBody
  });
}

module.exports = {
  sendReportEmail,
  sendRawEmail
};
