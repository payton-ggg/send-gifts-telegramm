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
  // User specifically requested to find the first "15" and click it (likely the price)
  const giftItemSelector =
    'div[class*="_gridItem_"], ._gridItem_1prhd_20, div[class*="_viewList_"]';
  const priceSelector = 'span:has-text("15"), div:has-text("15")';

  logger.info("Waiting for gift list items (targeting '15' or grid items)...");

  let targetFrame = page;
  let giftItem = null;

  try {
    // Try to find by text "15" first as requested
    giftItem = await page
      .waitForSelector(priceSelector, { state: "visible", timeout: 7000 })
      .catch(() => null);

    if (!giftItem) {
      logger.info("Text '15' not found immediately, checking grid items...");
      giftItem = await page
        .waitForSelector(giftItemSelector, { state: "visible", timeout: 5000 })
        .catch(() => null);
    }

    // Check frames if still not found
    if (!giftItem) {
      logger.info("Searching in sub-frames...");
      for (const frame of page.frames()) {
        giftItem = await frame
          .waitForSelector(`${priceSelector}, ${giftItemSelector}`, {
            state: "visible",
            timeout: 2000,
          })
          .catch(() => null);
        if (giftItem) {
          logger.info(`Found element in frame: ${frame.url()}`);
          targetFrame = frame;
          break;
        }
      }
    }

    if (!giftItem) {
      // Final fallback wait
      giftItem = await page.waitForSelector(
        `${giftItemSelector}, ${priceSelector}`,
        { state: "visible", timeout: 10000 }
      );
    }

    logger.info("Gift trigger element detected.");
  } catch (e) {
    logger.error(
      "Could not find gift items or price '15'. Saving debug info..."
    );
    const content = await page.content();
    require("fs").writeFileSync("debug_gift_list.html", content);
    throw e;
  }

  await sleep(1500);

  // Click strategy
  try {
    // First try to click the specific "15" element if we found it
    const priceItems = await targetFrame.$$(priceSelector);
    if (priceItems.length > 0) {
      logger.info(
        `Found ${priceItems.length} elements with text '15'. Clicking the first one.`
      );
      await priceItems[0].click({ force: true });
      await sleep(1000);
    } else {
      // Fallback to general grid items
      const items = await targetFrame.$$(giftItemSelector);
      logger.info(`Found ${items.length} gift grid items.`);
      if (items.length > 0) {
        await items[0].click({ force: true });
        await sleep(1000);
      } else {
        throw new Error(
          "No clickable elements found despite success in waitForSelector"
        );
      }
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
