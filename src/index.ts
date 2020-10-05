import yargs from 'yargs';
import { generateBuilder, generateHandler } from './generate';

yargs
  .scriptName('printing-press')
  .usage('$0 <cmd> [args]')
  .command(
    'generate',
    'Generate a static site from markdown files in the current directory',
    generateBuilder as any,
    generateHandler
  )
  .demandCommand(1, '')
  .help()
  .parse();
