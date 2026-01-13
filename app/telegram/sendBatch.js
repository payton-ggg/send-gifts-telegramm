const logger = require("../utils/logger");
const randomDelay = require("../utils/randomDelay");
const sendGift = require("./sendGift");
const openGifts = require("./openGifts");

/**
 * Sends a batch of gifts
 * @param {import('playwright').Page} page
 * @param {string} target
 * @param {number} count
 * @param {object} delays - {min, max}
 */
module.exports = async (page, target, count, delays) => {
  logger.step(`Starting batch send of ${count} gifts...`);

  // Initial stabilization delay
  await require("../utils/randomDelay")(delays.min / 2, delays.min);

  for (let i = 1; i <= count; i++) {
    logger.info(`Processing gift ${i}/${count}`);

    try {
      // Pass the delays config to maintain consistency throughout the flow
      await openGifts(page, target, delays);
      await sendGift(page, delays);

      logger.success(`Gift ${i} sent successfully`);

      if (i < count) {
        const delay = await randomDelay(delays.min, delays.max);
        logger.info(`Waiting ${delay}ms before next gift...`);
      }
    } catch (e) {
      logger.error(`Failed to send gift ${i}: ${e.message}`);
      // Decide whether to break or continue.
      // Usually break to avoid wasting money or loops.
      throw e;
    }
  }

  logger.success("Batch sending completed");
};
