const logger = require("../utils/logger");
const randomDelay = require("../utils/randomDelay");
const sendGift = require("./sendGift");
const openGifts = require("./openGifts");

/**
 * Sends a batch of gifts
 * @param {import('playwright').Page} page
 * @param {number} count
 * @param {object} delays - {min, max}
 */
module.exports = async (page, count, delays) => {
  logger.step(`Starting batch send of ${count} gifts...`);

  for (let i = 1; i <= count; i++) {
    logger.info(`Processing gift ${i}/${count}`);

    // We assume we need to re-open gift UI or it stays open?
    // Safer to ensure flow context.
    // If Send Gift closes the modal, we might need to reopen.
    // For now assuming we return to chat or need to re-click "Send Gift" button

    try {
      await openGifts(page); // Ensure UI is open
      await sendGift(page);

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
