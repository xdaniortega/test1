#!/usr/bin/env node
import { Command } from 'commander';
import { registerCreateCommand } from './commands/create.js';
import { registerImportCommand } from './commands/import.js';
import { registerSessionCommand } from './commands/session.js';
import { registerSendCommand } from './commands/send.js';
import { registerBalanceCommand } from './commands/balance.js';
import { registerInfoCommand } from './commands/info.js';

const program = new Command();

program
  .name('arbitrum-wallet')
  .description('CLI for managing AI agent wallets on Arbitrum')
  .version('0.1.0');

registerCreateCommand(program);
registerImportCommand(program);
registerSessionCommand(program);
registerSendCommand(program);
registerBalanceCommand(program);
registerInfoCommand(program);

program.parse();
