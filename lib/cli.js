const { Command } = require('commander');
const { create } = require('./commands');
const pack = require('../package.json');

const program = new Command(pack.name);

program.version(pack.version).usage('<command> [options]');

/**
 * command create, default
 */
program
  .command('create <project> [template]', { isDefault: true })
  .description('create a new project')
  .option('-f, --force', 'force overwrite exists project')
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log(`  ${pack.name} project`);
    console.log(`  ${pack.name} create project`);
    console.log(`  ${pack.name} create -f project`);
  })
  .action((project, template, cwd) => {
    create(project, cwd, template);
  });

/**
 * catch error
 */
const onError = (error) => {
  console.error(error);

  process.exit(1);
};

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);

program.parse(process.argv);
