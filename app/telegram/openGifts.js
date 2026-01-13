const logger = require("../utils/logger");
const sleep = require("../utils/sleep");

/**
 * Opens the gift interface for the current chat
 * @param {import('playwright').Page} page
 * @param {string} target - Username or Name to click in header
 * @param {object} delays - {min, max}
 */
module.exports = async (page, target, delays) => {
  logger.step("Opening gifts interface...");
  logger.info(`Current URL: ${page.url()}`);
  await sleep(delays.min); // Allow UI to settle strictly

  const headerSelector = ":is(.chat-info, .chat-header, .sidebar-header)";
  const giftBtnSelector =
    'button:has-text("Send Gift"), button:has-text("Отправить подарок"), .btn-gift';
  const moreMenuSelector =
    ".btn-menu-more, .chat-utils .btn-icon, .btn-menu-toggle";

  await sleep(delays.min / 4);

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
      await sleep(delays.min / 2);
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
      await sleep(delays.min / 2);
    }
  } catch (e) {
    logger.error(`Header Open Error: ${e.message}`);
  }

  // Look for "Send Gift" or similar button in profile
  try {
    logger.info("Checking for Send Gift button...");
    // Retry loop: Try once, if fail, toggle profile and try again
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        logger.info("Retrying gift open strategy after toggling profile...");
        // Click header to toggle profile
        const headerInfo = await page.$(
          ".chat-info, .chat-header .person-name, .chat-header h3"
        );
        if (headerInfo) {
          logger.info("Clicking header info to toggle profile...");
          await headerInfo.click();
          await sleep(delays.min); // Wait for sidebar animation
        } else {
          logger.warn("Could not find header info to click.");
        }
      }

      // 1. Check if Send Gift button is directly visible
      if (await page.isVisible(giftBtnSelector)) {
        logger.info("Found Send Gift button directly.");
        await page.click(giftBtnSelector, { force: true });
        return;
      }

      logger.info('Send Gift not visible, trying "More" menu...');

      // 2. Try "More" menu
      const moreCandidates = await page.$$(
        "button[title='More actions'], .btn-menu-more, .tgico-more, .chat-utils .btn-icon"
      );
      let menuOpened = false;

      // Filter candidates to top header only (avoid sticker picker buttons etc)
      const validCandidates = [];
      for (const btn of moreCandidates) {
        const box = await btn.boundingBox();
        if (box && box.y < 150 && box.x > 0) validCandidates.push(btn);
      }
      logger.info(
        `Found ${validCandidates.length} 'More' button candidates in header.`
      );

      for (const btn of validCandidates) {
        const box = await btn.boundingBox();
        const html = await btn.evaluate((el) => el.outerHTML);
        logger.info(`Clicking candidate at (${box.x}, ${box.y}): ${html}`);

        // Click strategy: Hover then Click
        try {
          await btn.scrollIntoViewIfNeeded();
          await btn.hover();
          await sleep(delays.min / 10);
          await btn.click();
        } catch (clickErr) {
          logger.warn(
            `Standard click failed, using force: ${clickErr.message}`
          );
          await btn.click({ force: true });
        }

        // Verification
        try {
          await page.waitForSelector(
            '.bubble.menu-container, .btn-menu-item, div[role="presentation"] .menu-container',
            { state: "visible", timeout: 3000 }
          );
          logger.info("Menu opened successfully!");
          menuOpened = true;
          break; // Stop trying candidates
        } catch (e) {
          logger.warn(
            "Menu did not open by selector (timeout). Checking button state..."
          );
          // Check if button is active
          const isBtnActive = await btn.evaluate((el) =>
            el.classList.contains("active")
          );
          if (isBtnActive) {
            logger.info("Button has 'active' class. Assuming menu is open.");
            menuOpened = true;
            break;
          }
        }
      }

      if (menuOpened) {
        logger.info("Looking for Gift option in menu...");
        const giftMenuSelector =
          'div:has-text("Send Gift"), div:has-text("Отправить подарок"), .btn-menu-item:has-text("Gift"), .btn-menu-item:has-text("Send a Gift")';
        try {
          await page.waitForSelector(giftMenuSelector, { timeout: 3000 });
          await page.click(giftMenuSelector, { force: true });
          return; // Success!
        } catch (e) {
          logger.warn(
            "Gift option not found in menu by text. Trying generic icons..."
          );
          try {
            await page.click(
              '.bubble.menu-container div[role="menuitem"]:has-text("Gift"), .bubble.menu-container div[role="menuitem"]:has-text("🎁")',
              { force: true }
            );
            return; // Success (hopefully)
          } catch (iconErr) {
            logger.error("Failed to find Gift option in menu.");
          }
        }
      }
    } // End attempt loop

    logger.error("Failed to open Gift interface after retries.");
    throw new Error("Failed to open Gift interface");
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
