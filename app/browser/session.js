const logger = require("../utils/logger");

module.exports = {
  /**
   * Validates if the session is logged in
   * @param {import('playwright').Page} page
   */
  async validate(page) {
    logger.step("Validating session...");

    await page.goto("https://web.telegram.org/a/", {
      waitUntil: "networkidle",
    });

    // Check for a common element present when logged in (e.g., chat list)
    // Note: Selectors might change, this is a basic check
    try {
      await page.waitForSelector(".chat-list, #telegram-search-input", {
        timeout: 40000,
      });
      logger.success("Session is valid");
    } catch (e) {
      logger.error(
        "Session invalid or not logged in. Please login manually first."
      );
      throw new Error("NOT_LOGGED_IN");
    }
  },
};
