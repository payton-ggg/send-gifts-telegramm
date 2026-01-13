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

  // Select the first gift in the grid
  // User specifically requested to find the first "15" and click it
  // We refine the selector to avoid matching large containers like #portals
  const giftItemSelector = 'div[class*="_gridItem_"], ._gridItem_1prhd_20';
  const priceSelector =
    'div[class*="_itemPrice_"] span, ._itemPrice_1prhd_41 span';

  logger.info("Waiting for gift list items (targeting '15' price span)...");

  let targetFrame = page;
  let giftTrigger = null;

  try {
    // We look for a span containing "15" that is INSIDE an itemPrice container
    // Using a more restrictive search to find exactly the digit
    const candidates = await page.$$(`${priceSelector}`);
    for (const cand of candidates) {
      const text = await cand.innerText();
      if (text.trim() === "15" && (await cand.isVisible())) {
        logger.info("Found exact '15' price span.");
        giftTrigger = cand;
        break;
      }
    }

    if (!giftTrigger) {
      logger.info(
        "Exact '15' span not found in main frame, searching grid items..."
      );
      giftTrigger = await page
        .waitForSelector(giftItemSelector, { state: "visible", timeout: 5000 })
        .catch(() => null);
    }

    // Check frames if still not found
    if (!giftTrigger) {
      logger.info("Searching in sub-frames...");
      for (const frame of page.frames()) {
        const frameCandidates = await frame.$$(`${priceSelector}`);
        for (const cand of frameCandidates) {
          const text = await cand.innerText();
          if (text.trim() === "15" && (await cand.isVisible())) {
            logger.info(`Found '15' in frame: ${frame.url()}`);
            giftTrigger = cand;
            targetFrame = frame;
            break;
          }
        }
        if (giftTrigger) break;
      }
    }

    if (!giftTrigger) {
      // Final fallback wait for any gift item
      logger.warn(
        "Target '15' not found specifically, waiting for any grid item..."
      );
      giftTrigger = await page.waitForSelector(giftItemSelector, {
        state: "visible",
        timeout: 10000,
      });
    }

    logger.info("Gift trigger element detected.");
  } catch (e) {
    logger.error("Could not find gift items. Saving debug info...");
    const content = await page.content();
    require("fs").writeFileSync("debug_gift_list.html", content);
    throw e;
  }

  await sleep(1500);

  // Click strategy
  try {
    if (giftTrigger) {
      const box = await giftTrigger.boundingBox();
      logger.info(
        `Clicking gift trigger at (${box ? box.x : "?"}, ${box ? box.y : "?"})`
      );
      await giftTrigger.click({ force: true });
      await sleep(1000);
    } else {
      throw new Error("Gift trigger is null at click stage.");
    }
  } catch (err) {
    logger.error(`Failed to select gift: ${err.message}`);
    throw err;
  }

  // Click final Send button
  logger.info('Waiting for "Send" / "Подарить" button...');
  const sendButtonSelector =
    'button:has-text("Send"), button:has-text("Подарить"), button:has-text("Send for"), .Button.primary.fluid, .Button.confirm';

  try {
    const sendBtn = await targetFrame.waitForSelector(sendButtonSelector, {
      timeout: 10000,
    });
    if (sendBtn) {
      logger.info("Clicking final button...");
      await sendBtn.click({ force: true });
    }
  } catch (e) {
    logger.error("Could not find final send button. Error: " + e.message);
    throw e;
  }

  await sleep(2000);
  logger.success("Gift send sequence completed");
};
