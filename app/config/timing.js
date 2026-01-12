const dayjs = require("dayjs");

module.exports = {
  // Set execution time: e.g., run 2 minutes from now
  // For production, set specific date: dayjs('2024-10-25 15:30:00')
  startTime: dayjs().add(1, "minute").toDate(),

  // Max allowed drift in ms
  maxDrift: 500,
};
