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
  // We need to wait for the grid to appear
  const giftGrid = ".gift-list, .react-virtuoso-grid, .scrollable-y";
  logger.info("Waiting for gift list...");
  try {
    await page.waitForSelector(giftGrid, { timeout: 10000 });
  } catch (e) {
    logger.error("Gift grid not found.");
    const fs = require("fs");
    fs.writeFileSync("debug_gift_list.html", await page.content());
    logger.info("Saved debug_gift_list.html");
    throw e;
  }
  await sleep(2000); // Allow grid to populate

  // Click first gift (often a button or div inside grid)
  await page.click(`${giftGrid} button, ${giftGrid} > div:first-child`, {
    force: true,
  });
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
