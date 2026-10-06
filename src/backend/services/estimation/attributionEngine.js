/**
 * Attribution Engine Entry Point
 */

const { normalizeUrl, attributeScriptUrl } = require('./scriptAttributor');
const { aggregateWorkload } = require('./workloadAggregator');

function attributeWorkload(normalizedLhr, gtmTagClassification = {}, options = {}) {
  return aggregateWorkload(normalizedLhr, gtmTagClassification, options);
}

module.exports = {
  normalizeUrl,
  attributeScriptUrl,
  attributeWorkload
};
