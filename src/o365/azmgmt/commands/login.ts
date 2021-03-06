import auth from '../AzmgmtAuth';
import config from '../../../config';
import commands from '../commands';
import GlobalOptions from '../../../GlobalOptions';
import Command, {
  CommandCancel,
  CommandOption,
  CommandValidate,
  CommandError
} from '../../../Command';
import appInsights from '../../../appInsights';
import { AuthType } from '../../../Auth';

const vorpal: Vorpal = require('../../../vorpal-init');

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  authType?: string;
  userName?: string;
  password?: string;
}

class AzmgmtLoginCommand extends Command {
  public get name(): string {
    return `${commands.LOGIN}`;
  }

  public get description(): string {
    return 'Log in to the Azure Management Service';
  }

  public alias(): string[] | undefined {
    return [commands.CONNECT];
  }

  public commandAction(cmd: CommandInstance, args: CommandArgs, cb: (err?: any) => void): void {
    const chalk: any = vorpal.chalk;

    this.showDeprecationWarning(cmd, commands.CONNECT, commands.LOGIN);

    appInsights.trackEvent({
      name: this.getUsedCommandName(cmd)
    });

    // disconnect before re-connecting
    if (this.debug) {
      cmd.log(`Logging out from Azure Management Service...`);
    }

    const logout: () => void = (): void => {
      auth.service.logout();
      auth.service.resource = 'https://management.azure.com/';
      if (this.verbose) {
        cmd.log(chalk.green('DONE'));
      }
    }

    const login: () => void = (): void => {
      if (this.verbose) {
        cmd.log(`Authenticating with Azure Management Service...`);
      }

      if (args.options.authType === 'password') {
        auth.service.authType = AuthType.Password;
        auth.service.userName = args.options.userName;
        auth.service.password = args.options.password;
      }

      auth
        .ensureAccessToken(auth.service.resource, cmd, this.debug)
        .then((accessToken: string): Promise<void> => {
          if (this.verbose) {
            cmd.log(chalk.green('DONE'));
          }

          auth.service.connected = true;
          return auth.storeConnectionInfo();
        })
        .then((): void => {
          cb();
        }, (rej: string): void => {
          if (this.debug) {
            cmd.log('Error:');
            cmd.log(rej);
            cmd.log('');
          }

          if (rej !== 'Polling_Request_Cancelled') {
            cb(new CommandError(rej));
            return;
          }
          cb();
        });
    }

    auth
      .clearConnectionInfo()
      .then((): void => {
        logout();
        login();
      }, (error: any): void => {
        if (this.debug) {
          cmd.log(new CommandError(error));
        }

        logout();
        login();
      });
  }

  public cancel(): CommandCancel {
    return (): void => {
      auth.cancel();
    }
  }

  public options(): CommandOption[] {
    const options: CommandOption[] = [
      {
        option: '-t, --authType [authType]',
        description: 'The type of authentication to use. Allowed values deviceCode|password. Default deviceCode',
        autocomplete: ['deviceCode', 'password']
      },
      {
        option: '-u, --userName [userName]',
        description: 'Name of the user to authenticate. Required when authType is set to password'
      },
      {
        option: '-p, --password [password]',
        description: 'Password for the user. Required when authType is set to password'
      }
    ];

    const parentOptions: CommandOption[] = super.options();
    return options.concat(parentOptions);
  }

  public validate(): CommandValidate {
    return (args: CommandArgs): boolean | string => {
      if (args.options.authType === 'password') {
        if (!args.options.userName) {
          return 'Required option userName missing';
        }

        if (!args.options.password) {
          return 'Required option password missing';
        }
      }

      return true;
    };
  }

  public commandHelp(args: CommandArgs, log: (help: string) => void): void {
    const chalk = vorpal.chalk;
    log(vorpal.find(commands.LOGIN).helpInformation());
    log(
      `  Remarks:

    ${chalk.yellow('Attention:')} This command is based on an API that is currently
    in preview and is subject to change once the API reached general
    availability.
    
    Using the ${chalk.blue(commands.LOGIN)} command you can log in to
    the Azure Management Service to manage your Azure objects.

    By default, the ${chalk.blue(commands.LOGIN)} command uses device code OAuth flow
    to log in to the Azure Management Service. Alternatively, you can
    authenticate using a user name and password, which is convenient for CI/CD
    scenarios, but which comes with its own limitations. See the Office 365 CLI
    manual for more information.
    
    When logging in to the Azure Management Service, the ${chalk.blue(commands.LOGIN)}
    command stores in memory the access token and the refresh token. Both tokens
    are cleared from memory after exiting the CLI or by calling the
    ${chalk.blue(commands.LOGOUT)} command.

    When logging in to the Azure Management Service using the user name and
    password, next to the access and refresh token, the Office 365 CLI will
    store the user credentials so that it can automatically reauthenticate if
    necessary. Similarly to the tokens, the credentials are removed by
    reauthenticating using the device code or by calling the ${chalk.blue(commands.LOGOUT)}
    command.

  Examples:
  
    Log in to the Azure Management Service using the device code
      ${chalk.grey(config.delimiter)} ${commands.LOGIN}

    Log in to the Azure Management Service using the device code in debug mode
    including detailed debug information in the console output
      ${chalk.grey(config.delimiter)} ${commands.LOGIN} --debug

    Log in to the Azure Management Service using a user name and password
      ${chalk.grey(config.delimiter)} ${commands.LOGIN} --authType password --userName user@contoso.com --password pass@word1
`);
  }
}

module.exports = new AzmgmtLoginCommand();