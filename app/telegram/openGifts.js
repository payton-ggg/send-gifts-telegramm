const logger = require("../utils/logger");
const sleep = require("../utils/sleep");

/**
 * Opens the gift interface for the current chat
 * @param {import('playwright').Page} page
 * @param {string} target - Username or Name to click in header
 */
module.exports = async (page, target) => {
  logger.step("Opening gifts interface...");
  logger.info(`Current URL: ${page.url()}`);
  await sleep(2000); // Allow UI to settle strictly

  const giftBtnSelector =
    'button:has-text("Send Gift"), button:has-text("Отправить подарок"), .btn-gift';
  const moreMenuSelector =
    ".btn-menu-more, .chat-utils .btn-icon, .btn-menu-toggle";

  await sleep(500);

  // Strategy: Click the user's name in the header
  // This is generic and should work across versions
  try {
    logger.info(`Looking for header with name "${target}"...`);
    // We look for the text in the top area (rough assumption)
    // or just any text element with the name that is visible
    // We exclude the input field or chat list items if possible, but simplest is just text=target

    // Note: target might be "guilemt", but display name might be different?
    // If target is username, display name might be "Guilem T".
    // If so, this fails.
    // BUT, we opened the chat using this target.
    // Let's assume the header contains it.
    // If not, we fall back to coordinate click.

    const headerNameSelector = `.chat-info :text("${target}"), .sidebar-header :text("${target}"), .top :text("${target}"), h3:has-text("${target}")`;

    if (await page.isVisible(headerNameSelector)) {
      logger.info(`Found name "${target}", clicking...`);
      await page.click(headerNameSelector, { force: true });
      await sleep(1000);
    } else {
      logger.warn(
        `Name "${target}" not found in header. Trying Generic JS Click...`
      );
      // ... existing JS/Coordinate fallback ...
      const viewport = page.viewportSize();
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
        logger.warn("JS Click failed. performing Coordinate Click...");
        const x = viewport && viewport.width ? viewport.width / 2 : 500;
        await page.mouse.click(x, 40);
      }
      await sleep(1000);
    }
  } catch (e) {
    logger.error(`Header Open Error: ${e.message}`);
  }

  // Look for "Send Gift" or similar button in profile
  try {
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
