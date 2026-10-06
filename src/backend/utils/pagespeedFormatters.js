
const getScoreStatus = (score) => {
  if (score === null) return null;
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
};

const getLcpStatus = (value) => {
  if (value === null) return null;
  if (value <= 2500) return 'Good';
  if (value <= 4000) return 'Needs Improvement';
  return 'Poor';
};

const getInpStatus = (value) => {
  if (value === null) return null;
  if (value <= 200) return 'Good';
  if (value <= 500) return 'Needs Improvement';
  return 'Poor';
};

const getClsStatus = (value) => {
  if (value === null) return null;
  if (value <= 0.1) return 'Good';
  if (value <= 0.25) return 'Needs Improvement';
  return 'Poor';
};

const normalizeUrl = (url) => {
  if (!url) return '';
  let norm = url.replace(/%20/g, '').replace(/ /g, '');
  if (norm.endsWith('/')) norm = norm.slice(0, -1);
  return norm;
};

module.exports = { getScoreStatus, getLcpStatus, getInpStatus, getClsStatus, normalizeUrl };
