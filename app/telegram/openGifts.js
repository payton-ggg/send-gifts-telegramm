const logger = require("../utils/logger");
const sleep = require("../utils/sleep");

/**
 * Opens the gift interface for the current chat
 * @param {import('playwright').Page} page
 */
module.exports = async (page) => {
  logger.step("Opening gifts interface...");
  logger.info(`Current URL: ${page.url()}`);
  await sleep(2000); // Allow UI to settle strictly
  const giftBtnSelector =
    'button:has-text("Send Gift"), button:has-text("Отправить подарок"), .btn-gift';
  const moreMenuSelector =
    ".btn-menu-more, .chat-utils .btn-icon, .btn-menu-toggle";

  await sleep(500);

  if (
    (await page.isVisible(giftBtnSelector)) ||
    (await page.isVisible(moreMenuSelector))
  ) {
    logger.info("Profile/Menu seems open, checking for button...");
  } else {
    logger.info("Opening profile...");
    // Expanded selectors for chat header
    const headerSelector =
      ".chat-info, .sidebar-header, .chat-header, .top .peer-title, .user-title";
    try {
      logger.info("Waiting for header...");
      await page.waitForSelector(headerSelector, { timeout: 5000 });
      logger.info("Header found, clicking...");
      await page.click(headerSelector, { force: true });
    } catch (e) {
      logger.warn("Header selector failed. Trying JS click...");
      const viewport = page.viewportSize();
      logger.info(`Viewport: ${JSON.stringify(viewport)}`);

      const clicked = await page.evaluate(() => {
        const el =
          document.querySelector(".chat-info") ||
          document.querySelector(".sidebar-header") ||
          document.querySelector(".chat-header") ||
          document.querySelector(".top");
        if (el) {
          el.click();
          return true;
        }
        return false;
      });

      if (!clicked) {
        logger.warn(
          "JS Click failed (element not found). Trying coordinate click..."
        );
        const x = viewport && viewport.width ? viewport.width / 2 : 500;
        await page.mouse.click(x, 40);
      } else {
        logger.info("JS Click successful");
      }
    }
    await sleep(1000); // Wait for profile
  }

  // Look for "Send Gift" or similar button in profile
  // Or sometimes it's under the "More" (...) menu
  try {
    const giftBtnSelector =
      'button:has-text("Send Gift"), button:has-text("Отправить подарок"), .btn-gift';
    logger.info("Checking for Send Gift button...");
    if (await page.isVisible(giftBtnSelector)) {
      logger.info("Button found, clicking...");
      await page.click(giftBtnSelector, { force: true });
    } else {
      logger.info('Send Gift not visible, trying "More" menu...');
      // Try 'More' menu
      await page.click(
        ".btn-menu-more, .chat-utils .btn-icon, .btn-menu-toggle, .tgico-more, button[title='More actions']",
        { force: true }
      );
      await sleep(500);
      logger.info("Menu clicked, looking for Gift option...");
      await page.click(
        'div:has-text("Send Gift"), div:has-text("Отправить подарок"), .btn-menu-item:has-text("Gift")',
        { force: true }
      );
    }
  } catch (e) {
    logger.error(`Error in openGifts: ${e.message}`);
    try {
      const fs = require("fs");
      const content = await page.content();
      fs.writeFileSync("debug_page.html", content);
      logger.info("Saved debug_page.html");
    } catch (err) {
      logger.error("Failed to save debug HTML");
    }
    throw e;
  }

  await sleep(1500); // Wait for gift modal
  logger.success("Gifts interface opened");
};
