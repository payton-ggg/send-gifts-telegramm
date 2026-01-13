const logger = require("../utils/logger");
const sleep = require("../utils/sleep");

/**
 * Sends a selected gift
 * @param {import('playwright').Page} page
 */
module.exports = async (page) => {
  logger.step("Sending a gift...");

  // Select a gift (e.g., the first available one or a specific one)
  // Assuming a grid of gifts. We pick one around the middle or random.

  // Select the first gift in the grid
  // Use specific classes provided by user: _gridItem_1prhd_20, _viewList_1prhd_62
  // We refine the giftGrid to be more specific to the dialog content
  const dialogSelector =
    'div[role="dialog"], .modal-content, .popup, .KAn2UaN5'; // Added common telegram modal class
  const giftItemSelector =
    'div[class*="_gridItem_"], div[class*="_viewList_"], .gift-item, .react-virtuoso-grid div[role="listitem"]';

  logger.info("Waiting for gift list or dialog...");
  try {
    // Wait for dialog or specific gift container
    await page.waitForSelector(`${dialogSelector}, ${giftItemSelector}`, {
      state: "visible",
      timeout: 10000,
    });
    logger.info("Gift interface/item detected.");
  } catch (e) {
    logger.error("Gift grid or item not found.");
    const content = await page.content();
    require("fs").writeFileSync("debug_gift_list.html", content);
    logger.info("Saved debug_gift_list.html for analysis.");
    throw e;
  }

  await sleep(1500); // Allow animation and data loading

  // Click strategy: Find visible gift items and click the first one
  logger.info("Attempting to click first gift item...");
  try {
    // Prioritize the user's specific classes if they exist
    const items = await page.$$(giftItemSelector);
    let clicked = false;
    for (const item of items) {
      if (await item.isVisible()) {
        const box = await item.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          logger.info(`Clicking gift item at (${box.x}, ${box.y})`);
          await item.click({ force: true });
          clicked = true;
          break;
        }
      }
    }

    if (!clicked) {
      logger.warn("No visible gift items found. Trying fallback click...");
      await page.click(
        'div[class*="_gridItem_"]:first-child, .gift-item:first-child',
        { force: true }
      );
    }
  } catch (err) {
    logger.error(`Failed to click gift: ${err.message}`);
    throw err;
  }
  await sleep(1000);

  // Click send button
  logger.info('Clicking "Send" button...');
  // Usually "Send for X Stars"
  await page.click(
    'button:has-text("Send"), button:has-text("Подарить"), button.btn-primary'
  );

  // Confirm payment if needed (password or just confirm)
  // If payment modal appears
  await sleep(2000);

  // Check for successful close or confirmation toast
  logger.success("Gift sent command issued");
};
