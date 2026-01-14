const logger = require("../utils/logger");
const sleep = require("../utils/sleep");

/**
 * Sends a selected gift
 * @param {import('playwright').Page} page
 * @param {object} delays - {min, max}
 */
module.exports = async (page, delays) => {
  logger.step("Sending a gift...");

  // Select a gift (e.g., the first available one or a specific one)
  // Assuming a grid of gifts. We pick one around the middle or random.

  // Select the first gift in the grid
  // User provided new structure: .starGiftItem containing a button with "15"
  const giftItemSelector =
    '.starGiftItem, div[class*="starGiftItem"], .interactive-gift, div[class*="_gridItem_"]';
  const priceButtonSelector =
    'button:has-text("15"), .starGiftItem button, .starGiftItem .Button';

  logger.info(
    "Waiting for gift list items (targeting starGiftItem or '15' stars)..."
  );

  let targetFrame = page;
  let giftTrigger = null;

  try {
    // 1. Try to find by the new specific class provided by the user
    giftTrigger = await page
      .waitForSelector(".starGiftItem", { state: "visible", timeout: 5000 })
      .catch(() => null);

    // 2. Try to find by the price button with "15" specifically
    if (!giftTrigger) {
      logger.info("starGiftItem not found, searching for '15' price button...");
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await btn.innerText();
        if (text.includes("15") && (await btn.isVisible())) {
          logger.info("Found button with '15' stars.");
          giftTrigger = btn;
          break;
        }
      }
    }

    // 3. Fallback to older class patterns if still not found
    if (!giftTrigger) {
      logger.info("New selectors failed, trying fallback grid items...");
      giftTrigger = await page
        .waitForSelector('div[class*="_gridItem_"]', {
          state: "visible",
          timeout: 5000,
        })
        .catch(() => null);
    }

    // 4. Check frames if still not found
    if (!giftTrigger) {
      logger.info("Searching in sub-frames...");
      for (const frame of page.frames()) {
        giftTrigger = await frame
          .waitForSelector('.starGiftItem, button:has-text("15")', {
            state: "visible",
            timeout: 2000,
          })
          .catch(() => null);
        if (giftTrigger) {
          logger.info(`Found element in frame: ${frame.url()}`);
          targetFrame = frame;
          break;
        }
      }
    }

    if (!giftTrigger) {
      // Final fallback wait for anything interactive
      logger.warn(
        "Target not found specifically, waiting for any gift-like item..."
      );
      giftTrigger = await page.waitForSelector(`${giftItemSelector}`, {
        state: "visible",
        timeout: 5000,
      });
    }

    logger.info("Gift trigger element detected.");
  } catch (e) {
    logger.error("Could not find gift items. Saving debug info...");
    const content = await page.content();
    require("fs").writeFileSync("debug_gift_list.html", content);
    throw e;
  }

  await sleep(delays.min / 2);

  // Click strategy
  try {
    if (giftTrigger) {
      const box = await giftTrigger.boundingBox();
      logger.info(
        `Clicking gift trigger at (${box ? box.x : "?"}, ${box ? box.y : "?"})`
      );
      // We click the trigger (the whole item or the button)
      await giftTrigger.click({ force: true });
      await sleep(delays.min / 2);
    } else {
      throw new Error("Gift trigger is null at click stage.");
    }
  } catch (err) {
    logger.error(`Failed to select gift: ${err.message}`);
    throw err;
  }

  // Click final Send button
  logger.info("Waiting for confirm Send button...");
  // User provided: <button type="button" class="Button IDuhjrne smaller primary no-upper-case">Send a Gift for ... 15</button>
  const sendButtonSelector =
    'button:has-text("Send a Gift"), button:has-text("15"), .IDuhjrne, button:has-text("Send"), button:has-text("Подарить")';

  try {
    const sendBtn = await targetFrame.waitForSelector(sendButtonSelector, {
      timeout: 5000,
    });
    if (sendBtn) {
      logger.info("Clicking final confirmation button...");
      await sendBtn.click({ force: true });
    }
  } catch (e) {
    logger.error(
      "Could not find final send button. Looking for ANY primary button in modal..."
    );
    const fallbackBtn = await targetFrame.$(
      'div[role="dialog"] button.primary, .modal-content button.primary'
    );
    if (fallbackBtn) {
      // await fallbackBtn.click({ force: true });
    } else {
      throw new Error("Final send button not found: " + e.message);
    }
  }

  await sleep(delays.min);
  logger.success("Gift send sequence completed");
};
