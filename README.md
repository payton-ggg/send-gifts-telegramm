# Telegram Gift Agent

Automated agent for sending gifts on Telegram Web.

## setup

1. `npm install`
2. Configure `app/config/scenario.js` and `app/config/timing.js`.

## Usage

1. Run `node app/index.js` once to open browser and login.
   - Note: The script will fail validation if not logged in, but the browser will open.
   - Login manually in the opened window.
   - Close the script/browser.
2. Run `node app/index.js` again to execute the schedule.

## Structure

- `app/config`: Settings
- `app/browser`: Playwright control
- `app/telegram`: Telegram actions
- `app/scheduler`: Timing logic
