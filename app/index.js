const fs = require("fs");
const path = require("path");
const logger = require("./utils/logger");
const runConfig = require("./config/scenario");
const timeConfig = require("./config/timing");
const browserLauncher = require("./browser/launcher");
const session = require("./browser/session");
const scheduler = require("./scheduler/waitUntil");
const openChat = require("./telegram/openChat");
const sendBatch = require("./telegram/sendBatch");

const STATE_FILE = path.resolve(__dirname, "state/run.json");

(async () => {
  logger.info("Starting Telegram Gift Agent...");
  // Automation sequence initiated

  try {
    // 1. Launch Browser
    const { context, page } = await browserLauncher();

    // 2. Validate Session
    await session.validate(page);

    // 3. Wait for scheduled time
    await scheduler(timeConfig.startTime);

    // 4. Execute Scenario
    logger.step("Executing scenario...");
    await openChat(page, runConfig.target, runConfig.delays);
    await sendBatch(
      page,
      runConfig.target,
      runConfig.gift.count,
      runConfig.delays
    );

    // 5. Update State
    const runState = {
      lastRun: new Date().toISOString(),
      status: "SUCCESS",
      target: runConfig.target,
      count: runConfig.gift.count,
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(runState, null, 2));
    logger.success("Scenario completed successfully");

    // Close browser after short delay
    await page.waitForTimeout(2000);
    logger.success("Scenario completed successfully");
    await context.close();
  } catch (error) {
    logger.error(`Critical Error: ${error.message}`);
    await page.screenshot({ path: "error_screenshot.png" });
    try {
      logger.info("Saved error_screenshot.png");
    } catch (e) {
      logger.error("Could not save screenshot");
    }
    process.exit(1);
  }
})();
