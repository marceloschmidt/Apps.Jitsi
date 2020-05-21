import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

export class JitsiSlashCommand implements ISlashCommand {
    public command: string;
    public i18nParamsExample: string;
    public i18nDescription: string;
    public providesPreview: boolean;

    constructor() {
        this.command = 'jitsi';
        this.i18nParamsExample = 'params_example';
        this.i18nDescription = 'command_description';
        this.providesPreview = false;
    }

    // tslint:disable-next-line:max-line-length
    public async executor(context: SlashCommandContext, read: IRead, modify: IModify): Promise<void> {
        let serverUrl = await read.getEnvironmentReader().getServerSettings().getValueById('Jitsi_Domain') as string;
        serverUrl = this.ensureUrlIsValid(serverUrl);

        const urlPrefix = await read.getEnvironmentReader().getServerSettings().getValueById('Jitsi_URL_Room_Prefix') as string;

        const [roomName] = context.getArguments();

        const url = serverUrl + this.makeUrlSafeForJitsiWeb(roomName ? roomName : urlPrefix + context.getRoom().id + context.getSender().id);

        return await this.sendMessage(context, modify, `Join the video call: ${ url }\nLink generated by slashcommand \`/jitsi\``);
    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, text: string): Promise<void> {
        const msg = modify.getCreator()
            .startMessage()
            .setText(text)
            // .setUsernameAlias('Jitsi')
            // .setEmojiAvatar(':calendar:')
            .setRoom(context.getRoom())
            .setSender(context.getSender());

        await modify.getCreator().finish(msg);
    }

    private ensureUrlIsValid(url: string): string {
        let server = url;

        if (!url || url.length === 0) {
            server = 'https://meet.jit.si/';
        }

        // ensure the url starts with either https:// or http://
        if (!server.includes('https://') && !server.includes('http://')) {
            server = `https://${ server }`;
        }

        // ensure the url ends with a trailing slash
        if (!server.endsWith('/')) {
            server = `${ server }/`;
        }

        return server;
    }

    private makeUrlSafeForJitsiWeb(value: string): string {
        return value.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\s]/g, '');
    }
}
