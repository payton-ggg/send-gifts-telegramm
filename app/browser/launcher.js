const { chromium } = require("playwright");
const config = require("../config/browser");
const logger = require("../utils/logger");

module.exports = async () => {
  logger.step("Launching browser...");
  try {
    const context = await chromium.launchPersistentContext(config.userDataDir, {
      headless: config.headless,
      args: config.args,
      viewport: config.viewport,
    });

    // Create a new page if none exists (though persistent context usually has one)
    const pages = context.pages();
    const page = pages.length > 0 ? pages[0] : await context.newPage();

    logger.success("Browser launched successfully");
    return { context, page };
  } catch (error) {
    logger.error(`Failed to launch browser: ${error.message}`);
    throw error;
  }
};
