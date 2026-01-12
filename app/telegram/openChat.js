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
  // Wait for search results
  // Check if any results appear
  try {
    await page.waitForSelector(".search-group, .chat-list, .search-result", {
      timeout: 5000,
    });
  } catch (e) {
    logger.warn("Search results did not appear in time");
  }

  // Check for "no results"
  const noResults = await page.isVisible('text="No results"');
  if (noResults) {
    throw new Error(`User ${target} not found`);
  }

  await sleep(1000);

  // Try navigation approach: ArrowDown -> Enter
  await page.keyboard.press("ArrowDown");
  await sleep(300);
  await page.keyboard.press("Enter");

  // Wait to see if chat opened
  const chatLimitElement =
    ".chat-input, .composer-wrapper, .chat-info, .chat-header";
  try {
    await page.waitForSelector(chatLimitElement, { timeout: 5000 });
    logger.success(`Chat with ${target} opened (via Keyboard)`);
    return;
  } catch (e) {
    logger.warn("Keyboard navigation did not open chat, trying click...");
  }

  // Fallback: Click first result
  const firstResultSelector =
    ".search-group .list-item, .search-group-contacts .list-item, .chat-list .list-item, .search-result, .list-item-peer";

  try {
    await page.waitForSelector(firstResultSelector, { timeout: 5000 });
    const results = page.locator(firstResultSelector);
    await results.first().click();
  } catch (e) {
    // Text match fallback
    logger.warn("Generic selector failed, trying text match...");
    await page.click(`text="${target}"`);
  }

  // Final verification
  await page.waitForSelector(
    ".chat-input, .composer-wrapper, .chat-info, .chat-header, .sidebar-header .person",
    {
      timeout: 10000,
    }
  );
  logger.success(`Chat with ${target} opened`);
};
