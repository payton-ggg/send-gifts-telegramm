# Troubleshooting

The agent relies on Playwright selectors to interact with Telegram Web. Since Telegram Web has multiple versions (K, A, Z) and updates frequently, selectors might fail.

## Common Errors

### "Header selector failed" / "Timeout exceeded"

This means the agent cannot find the chat header to open the profile.

**Solution:**

1. Open Telegram Web in your browser.
2. Open a Chat.
3. Right-click the top header > Inspect Element.
4. Find the class name of the header container (e.g., `chat-info`, `sidebar-header`, `top`).
5. Update `app/telegram/openGifts.js`:
   ```javascript
   const headerSelector = ".YOUR_NEW_CLASS, .chat-info...";
   ```

### "Send Gift not visible"

The agent opened the profile (or menu) but couldn't find the "Send Gift" button.

**Solution:**

1. Manually check where the Gift button is (Profile or 3-dots menu).
2. Inspect the button to find its text (English/Russian) or class key.
3. Update `app/telegram/openGifts.js`:
   ```javascript
   const giftBtnSelector = 'button:has-text("Your Text"), ...';
   ```

### Execution Hangs

If the execution hangs without error, it might be waiting for a selector that never appears. Check logs for "Trying..." messages.
