const chalk = require("chalk");
const dayjs = require("dayjs");

const format = (msg) => `[${dayjs().format("HH:mm:ss")}] ${msg}`;

module.exports = {
  info: (msg) => console.log(chalk.blue(format(msg))),
  success: (msg) => console.log(chalk.green(format(msg))),
  warn: (msg) => console.log(chalk.yellow(format(msg))),
  error: (msg) => console.log(chalk.red(format(msg))),
  step: (msg) => console.log(chalk.cyan(format(`STEP: ${msg}`))),
};
