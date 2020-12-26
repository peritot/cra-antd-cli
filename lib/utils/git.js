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

gitConfig();

module.exports = {
  gitConfig,
};
