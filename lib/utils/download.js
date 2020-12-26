const download = require('download-git-repo');

/**
 * download git repo use promise
 * @param {string} repo
 * @param {string} dest
 * @param {object} opts
 */
const downloadRepo = (repo, dest, opts) => {
  const promise = new Promise((resolve, reject) => {
    try {
      download(repo, dest, opts, (error) => {
        resolve(!error);
      });
    } catch (error) {
      reject(error);
    }
  });

  return promise;
};

module.exports = downloadRepo;
