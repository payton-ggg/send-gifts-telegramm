const logger = require("../utils/logger");
const sleep = require("../utils/sleep");

/**
 * Opens the gift interface for the current chat
 * @param {import('playwright').Page} page
 */
module.exports = async (page) => {
  logger.step("Opening gifts interface...");

  // Example flow: Open profile -> Click Gift icon or Menu -> Send Gift
  // This is highly dependent on the Telegram Web version (K or A)

  // Strategy: Profile header click
  await page.click(".chat-info, .sidebar-header");
  await sleep(1000);

  // Look for "Send Gift" or similar button in profile
  // Or sometimes it's under the "More" (...) menu
  try {
    const giftBtnSelector = 'button:has-text("Send Gift"), .btn-gift';
    if (await page.isVisible(giftBtnSelector)) {
      await page.click(giftBtnSelector);
    } else {
      // Try 'More' menu
      await page.click(".btn-menu-more, .chat-utils .btn-icon");
      await sleep(500);
      await page.click('div:has-text("Send Gift")');
    }
  } catch (e) {
    logger.error("Could not find Send Gift button. Check selectors.");
    throw e;
  }

  await sleep(1500); // Wait for gift modal
  logger.success("Gifts interface opened");
};
