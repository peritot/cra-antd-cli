const { execSync } = require('child_process');

/**
 * exec with encoding utf8 and replace \n
 * @param {string} command
 * @param {object} options
 */
const exec = (command, options) => {
  try {
    const string = execSync(command, { ...options, encoding: 'utf8' });

    return string.replace(/\n$/g, '');
  } catch (error) {
    return '';
  }
};

module.exports = exec;
