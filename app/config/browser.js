const path = require("path");

module.exports = {
  headless: false, // Must be false to see the persistent session
  userDataDir: path.resolve(__dirname, "../../profile"),
  args: ["--disable-blink-features=AutomationControlled", "--start-maximized"],
  viewport: null, // Uses window size
};
