const glob = require('glob');

/**
 * glob with promise
 * @param {string} pattern
 * @param {object} options
 */
const walk = (pattern, options) => {
  const promise = new Promise((resolve, reject) => {
    try {
      glob(pattern, options, (error, files) => {
        if (error) {
          reject(error);
        }

        resolve(files);
      });
    } catch (error) {
      reject(error);
    }
  });

  return promise;
};

module.exports = walk;
