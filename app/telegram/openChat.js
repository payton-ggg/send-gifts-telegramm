const logger = require("../utils/logger");
const sleep = require("../utils/sleep");

/**
 * Opens a chat with the target user
 * @param {import('playwright').Page} page
 * @param {string} target - Username or phone
 */
module.exports = async (page, target) => {
  logger.step(`Opening chat with ${target}...`);

  // Click search
  await page.click("#telegram-search-input, .input-search-input");
  await sleep(1000);

  // Type target
  await page.keyboard.type(target);
  await sleep(2000);

  // Select first result
  // Note: Selector finding the first search result
  const firstResultSelector =
    ".search-group .search-group-contacts .list-item, .search-group .list-item";
  await page.waitForSelector(firstResultSelector);
  await page.click(firstResultSelector);

  await sleep(2000); // Wait for chat to load
  logger.success(`Chat with ${target} opened`);
};
