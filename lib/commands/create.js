const fse = require('fs-extra');
const path = require('path');
const sanitize = require('sanitize-filename');
const ejs = require('ejs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const downloadRepo = require('../utils/download');
const walk = require('../utils/walk');
const { gitConfig, gitInit } = require('../utils/git');
const { Path, TemplateEnum } = require('../config');

const cwdPath = process.cwd();

// 临时目录
const tempPath = path.join(cwdPath, Path.temp);

/**
 * 询问获取配置
 */
const prompt = async () => {
  // git 配置
  const { name, email } = gitConfig();

  const answers = await inquirer.prompt([
    {
      name: 'description',
      type: 'input',
      message: 'Project description',
      default: 'A React app with antd',
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
      default: name,
    },
    {
      name: 'email',
      type: 'input',
      message: 'Author email',
      default: email,
    },
  ]);

  return Promise.resolve(answers);
};

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
        message: `Project name ${chalk.green(project)} is not valid, change to ${chalk.green(filename)} ?`,
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
      console.warn(chalk.yellow(`\nProject ${chalk.green(filename)} exist, ${chalk.red('force')} overwrite\n`));
    } else {
      const answers = await inquirer.prompt([
        {
          name: 'ok',
          type: 'confirm',
          message: `Project ${chalk.green(filename)} exist, ${chalk.red('force')} overwrite ?`,
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

  // 开始
  const spinner = ora(`Download template ${chalk.green.underline(name)}`).start();

  try {
    // 清空
    await fse.remove(tempPath);

    // 下载
    const success = await downloadRepo(`${type}:${owner}/${name}`, tempPath);
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
          message: `Download template ${chalk.green.underline(url)} fail, retry?`,
          default: true,
        },
      ]);
      if (answers.ok) {
        return download(repository);
      }
    }
  } catch (error) {
    spinner.fail();

    await fse.remove(tempPath);
    return Promise.reject(error);
  }

  return Promise.resolve(true);
};

/**
 * 编译
 * @param {string} startPath
 * @param {string} destPath
 * @param {string} filename
 */
const compile = async (answers, startPath, destPath) => {
  if (answers) {
    // 开始
    const spinner = ora('Compile template').start();

    try {
      // 遍历文件
      const files = await walk('**', { cwd: startPath, dot: true });

      // 为空报错
      if (files.length === 0) {
        spinner.fail();
        return Promise.reject(new Error('No files matchs'));
      }

      // 同步执行
      const promises = files.map(async (file) => {
        const readPath = path.join(startPath, file);
        const writePath = path.join(destPath, file);

        if (fse.statSync(readPath).isDirectory()) {
          fse.ensureDirSync(writePath);
        } else {
          let result;
          // 二进制文件过滤
          if (/\.(png|bmp|jpe?g|tiff?|gif|ico|svg|webp)$/i.test(file)) {
            result = fse.readFileSync(readPath);
          } else {
            result = await ejs.renderFile(readPath, answers);
          }

          fse.writeFileSync(writePath, result);
        }
      });
      await Promise.all(promises);

      spinner.succeed();
    } catch (error) {
      spinner.fail();

      await fse.remove(destPath);
      return Promise.reject(error);
    }
  }

  return Promise.resolve(true);
};

/**
 * 初始化 Git
 * @param {string} destPath
 */
const init = async (destPath) => {
  // 开始
  const spinner = ora('Initialize git repository').start();

  try {
    gitInit(destPath);

    spinner.succeed();
  } catch (error) {
    spinner.fail();
  }

  return Promise.resolve(true);
};

/**
 * 创建
 * @param {string} project
 * @param {object} cwd
 * @param {string} template
 */
const create = async (project, cwd, template = 'react') => {
  // 验证文件夹名称是否有效
  const filename = await valid(project);

  // 验证文件夹是否存在
  const pathname = await exist(filename, cwd.force);

  try {
    // 询问
    const answers = await prompt();
    console.log('');

    // 目录
    await fse.ensureDir(pathname);

    // 模板
    await download(template);

    // 编译
    await compile({ ...answers, name: filename }, tempPath, pathname);

    // 初始化
    init(pathname);
  } catch (error) {
    console.error(chalk.red(error.message));

    await fse.remove(tempPath);
    await fse.remove(pathname);
    process.exit(1);
  }

  // 清理
  await fse.remove(tempPath);

  // 成功
  console.log(`\nSuccessfully created project ${chalk.green(filename)}.\n`);

  // 提示
  console.log('Get started with the following commands:\n');
  console.log(chalk.cyan(`  ${chalk.gray('$')} cd ${filename}`));
  console.log(chalk.cyan(`  ${chalk.gray('$')} npm install`));
  console.log(chalk.cyan(`  ${chalk.gray('$')} npm start\n`));
  console.log(chalk.green('Enjoy Coding!\n'));
};

// create('.temp-reate-app', { force: true });

module.exports = {
  create,
};
