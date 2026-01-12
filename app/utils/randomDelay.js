const sleep = require("./sleep");

/**
 * Sleeps for a random duration between min and max
 * @param {number} min - Minimum ms
 * @param {number} max - Maximum ms
 */
module.exports = async (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  return sleep(delay);
};
