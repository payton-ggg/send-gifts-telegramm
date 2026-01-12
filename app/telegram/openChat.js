const logger = require("../utils/logger");
const sleep = require("../utils/sleep");

/**
 * Opens a chat with the target user
 * @param {import('playwright').Page} page
 * @param {string} target - Username or phone
 */
module.exports = async (page, target) => {
  logger.step(`Opening chat with ${target}...`);

  // Click search and clear
  const searchInput = "#telegram-search-input, .input-search-input";
  await page.waitForSelector(searchInput);
  await page.click(searchInput);
  // data-test-id usually helps if available, but fill is safe
  await page.fill(searchInput, target);
  await sleep(2000); // Wait for search results

  // Select first result
  const firstResultSelector =
    ".search-group .list-item, .search-group-contacts .list-item, .chat-list .list-item, .search-result, .list-item-peer";

  try {
    await page.waitForSelector(firstResultSelector, { timeout: 15000 });
    const results = page.locator(firstResultSelector);
    // Prefer exact match if possible (optional refinement)
    await results.first().click();
  } catch (e) {
    logger.warn("Generic selector failed, trying text match fallback...");
    // Fallback: click text with target name
    await page.click(`text="${target}"`);
  }

  // Wait for chat header to ensure navigation happened
  await page.waitForSelector(".chat-info, .sidebar-header, .chat-header", {
    timeout: 10000,
  });
  logger.success(`Chat with ${target} opened`);
};
