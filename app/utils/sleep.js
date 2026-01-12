/**
 * Pauses execution for a set amount of time
 * @param {number} ms - Milliseconds to sleep
 */
module.exports = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
