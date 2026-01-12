const dayjs = require("dayjs");
const sleep = require("../utils/sleep");
const logger = require("../utils/logger");
const { maxDrift } = require("../config/timing");

module.exports = async (targetTime) => {
  logger.step("Waiting for scheduled time...");

  while (true) {
    const now = dayjs();
    const diff = targetTime - now;

    if (diff <= 0) {
      if (Math.abs(diff) > maxDrift) {
        logger.warn(`Time drift detected: ${Math.abs(diff)}ms`);
      }
      logger.success("Target time reached");
      break;
    }

    // Dynamic sleep interval
    if (diff > 10000) {
      await sleep(1000); // Check every second if far away
    } else {
      await sleep(100); // Check more frequently when close
    }
  }
};
