import chalk from 'chalk';

function log(tag, color, ...args) {
  console.log(color(`[${tag.toUpperCase().padEnd(5, ' ')}]`), ...args);
}

export default {
  info: log.bind(null, 'info', chalk.cyan),
  error: log.bind(null, 'error', chalk.red),
  warn: log.bind(null, 'warn', chalk.yellow),
  debug: log.bind(null, 'debug', chalk.magenta)
}
