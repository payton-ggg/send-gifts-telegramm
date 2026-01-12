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

  // Wait for grid
  await page.waitForSelector(".gift-grid, .stars-gift-list");

  // Click a gift item
  const gifts = await page.$$(".gift-item, .stars-gift-item");
  if (gifts.length > 0) {
    // Pick random or first
    await gifts[0].click();
  } else {
    throw new Error("No gifts found");
  }
  await sleep(1000);

  // Click Send/Pay button
  // Usually "Send for X Stars"
  await page.click('button:has-text("Send"), button.btn-primary');

  // Confirm payment if needed (password or just confirm)
  // If payment modal appears
  await sleep(2000);

  // Check for successful close or confirmation toast
  logger.success("Gift sent command issued");
};
