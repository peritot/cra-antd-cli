const fse = require('fs-extra');
const path = require('path');
const sanitize = require('sanitize-filename');
const ejs = require('ejs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const downloadRepo = require('../utils/download');
const walk = require('../utils/walk');
const { Path, TemplateEnum } = require('../config');

const cwdPath = process.cwd();

/**
 * 验证文件夹名称是否有效
 * @param {string} project
 */
const valid = async (project) => {
  const filename = sanitize(project);
  if (filename !== project) {
    const answers = await inquirer.prompt([
      {
        name: 'ok',
        type: 'confirm',
        message: `Project name ${chalk.blue.underline(project)} is not valid, change to ${chalk.blue.underline(filename)} ?`,
        default: true,
      },
    ]);
    if (!answers.ok) {
      process.exit(0);
    }
  }

  return Promise.resolve(filename);
};

/**
 * 验证文件夹是否存在
 * @param {string} filename
 * @param {boolean} force
 */
const exist = async (filename, force) => {
  const pathname = path.join(cwdPath, filename);

  if (fse.pathExistsSync(pathname)) {
    if (force) {
      console.warn(chalk.yellow(`Project ${chalk.blue.underline(filename)} exist, ${chalk.red('force')} overwrite`));
    } else {
      const answers = await inquirer.prompt([
        {
          name: 'ok',
          type: 'confirm',
          message: `Project ${chalk.blue.underline(filename)} exist, ${chalk.red('force')} overwrite ?`,
          default: false,
        },
      ]);
      if (!answers.ok) {
        process.exit(0);
      }
    }
  }

  return Promise.resolve(pathname);
};

/**
 * 下载模板
 * @param {string} template
 */
const download = async (template) => {
  // 模板
  const { repository } = TemplateEnum[template];
  // 仓库
  const { type, owner, name } = repository;
  // 目录
  const dest = path.join(cwdPath, Path.temp);

  // 开始
  const spinner = ora(`Download template ${chalk.blue.underline(name)}`).start();

  try {
    // 清空
    await fse.remove(dest);

    // 下载
    const success = await downloadRepo(`${type}:${owner}/${name}`, dest);
    if (success) {
      // 成功
      spinner.succeed();
    } else {
      // 失败
      spinner.fail();

      // 重试
      const url = `https://${origin}/${owner}/${name}`;
      const answers = await inquirer.prompt([
        {
          name: 'ok',
          type: 'confirm',
          message: `Download template ${chalk.blue.underline(url)} fail, retry ?`,
          default: true,
        },
      ]);
      if (answers.ok) {
        return download(repository);
      }
    }
  } catch (error) {
    spinner.fail();
    return Promise.reject(error);
  }

  return Promise.resolve(dest);
};

const compile = async (tempPath, destPath, filename) => {
  const answers = await inquirer.prompt([
    {
      name: 'description',
      type: 'input',
      message: 'Project description',
      default: 'A React App With Ant Design',
    },
    {
      name: 'version',
      type: 'input',
      message: 'Project version',
      default: '0.1.0',
    },
    {
      name: 'author',
      type: 'input',
      message: 'Author name',
      default: 'name',
    },
    {
      name: 'email',
      type: 'input',
      message: 'Author email',
      default: 'email',
    },
  ]);
  if (answers) {
    // 开始
    const spinner = ora('Compile template').start();

    try {
      // 遍历文件
      const files = await walk('**', { cwd: tempPath, dot: true });

      // 为空报错
      if (files.length === 0) {
        spinner.fail();
        return Promise.reject(new Error('No files matchs'));
      }

      // 同步执行
      const promises = files.map(async (file) => {
        const readPath = path.join(tempPath, file);
        const writePath = path.join(destPath, file);

        if (fse.statSync(readPath).isDirectory()) {
          fse.ensureDirSync(writePath);
        } else {
          const result = await ejs.renderFile(readPath, { ...answers, name: filename });
          fse.writeFileSync(writePath, result);
        }
      });
      await Promise.all(promises);

      spinner.succeed();
    } catch (error) {
      spinner.fail();
      return Promise.reject(error);
    }
  }

  return Promise.resolve(true);
};

/**
 * 创建
 * @param {string} project
 * @param {object} option
 * @param {string} template
 */
const create = async (project, option, template = 'react') => {
  // 验证文件夹名称是否有效
  const filename = await valid(project);

  // 验证文件夹是否存在
  const pathname = await exist(filename, option.force);

  try {
    // 目录
    await fse.ensureDir(pathname);

    // 模板
    const dest = await download(template);

    // 编译
    await compile(dest, pathname, filename);
  } catch (error) {
    console.error(chalk.red(error.message));

    process.exit(1);
  }
};

// create('test', { force: true });

module.exports = {
  create,
};
