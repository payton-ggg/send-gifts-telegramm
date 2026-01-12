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

  const headerSelector = ":is(.chat-info, .chat-header, .sidebar-header)";
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
      // Robust strategy: Find all candidates and click the one in the top header (y < 150)
      // We iterate and Verification that the menu actually opened
      const moreCandidates = await page.$$(
        "button[title='More actions'], .btn-menu-more, .tgico-more, .chat-utils .btn-icon"
      );
      let menuOpened = false;

      for (const btn of moreCandidates) {
        if (await btn.isVisible()) {
          const box = await btn.boundingBox();
          // Check if button is in header area (top 150px)
          if (box && box.y < 150 && box.x > 0) {
            logger.info(`Clicking candidate at (${box.x}, ${box.y})...`);
            await btn.click({ force: true });
            // Wait and check if menu appeared
            try {
              // Look for the menu container or an item within it
              await page.waitForSelector(
                ".bubble.menu-container, .btn-menu-item",
                { state: "visible", timeout: 2000 }
              );
              logger.info("Menu opened successfully!");
              menuOpened = true;
              break;
            } catch (e) {
              logger.warn("Menu did not open, trying next candidate...");
            }
          }
        }
      }

      if (!menuOpened) {
        logger.warn(
          "Could not open More menu with any candidate. Trying fallback selector..."
        );
        const moreBtnSelector = `
            :is(.chat-info, .chat-header, .sidebar-header) .btn-menu-more,
            :is(.chat-info, .chat-header, .sidebar-header) button[title='More actions']
          `;
        if (await page.isVisible(moreBtnSelector)) {
          await page.click(moreBtnSelector, { force: true });
          await sleep(1000);
        }
      }

      logger.info("Looking for Gift option in menu...");
      const giftMenuSelector =
        'div:has-text("Send Gift"), div:has-text("Отправить подарок"), .btn-menu-item:has-text("Gift"), .btn-menu-item:has-text("Send a Gift")';
      try {
        await page.waitForSelector(giftMenuSelector, { timeout: 3000 });
        await page.click(giftMenuSelector, { force: true });
      } catch (e) {
        if (menuOpened) {
          logger.warn(
            "Gift menu item not found by text. Trying icon/generic selectors in menu..."
          );
          // Scope to the open menu if possible, or just look for typical items
          await page.click(
            '.bubble.menu-container div[role="menuitem"]:has-text("Gift"), .bubble.menu-container div[role="menuitem"]:has-text("🎁")',
            { force: true }
          );
        } else {
          logger.error("Menu never opened, skipping gift selection.");
          throw new Error("Failed to open More menu");
        }
      }
    }
  } catch (e) {
    logger.error(`Error in openGifts: ${e.message}`);
    // Check for "Share Contact" or other blocking modals
    if (await page.isVisible(".modal-dialog")) {
      logger.warn("Modal detected, attempting to close...");
      await page.click(
        '.modal-dialog .btn-close, .modal-dialog button[aria-label="Close"]',
        { force: true }
      );
      await sleep(500);
      // Retry logic could go here
    }

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
