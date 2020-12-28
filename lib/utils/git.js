const exec = require('./exec');

/**
 * get gitconfig
 */
const gitConfig = () => {
  const cmdGit = 'git config --get';

  const name = exec(`${cmdGit} user.name`);
  const email = exec(`${cmdGit} user.email`);

  return {
    name,
    email,
  };
};

/**
 * git init
 * @param {string} destPath
 */
const gitInit = (destPath) => {
  try {
    // git install ?
    const version = exec('git --version');
    if (!version) {
      throw Error('git is not install!');
    }

    // git init
    const option = { cwd: destPath };
    exec('git init', option);
    exec('git add .', option);
    exec('git commit -m "feat: initial"', option);
  } catch (error) {
    throw Error(error);
  }
};

gitConfig();

module.exports = {
  gitConfig,
  gitInit,
};
