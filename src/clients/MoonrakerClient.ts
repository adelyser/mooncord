import {ConsoleLogger} from '../helper/ConsoleLogger'
import {ConfigHelper} from '../helper/ConfigHelper'
import {Websocket, WebsocketBuilder, WebsocketEvents} from 'websocket-ts'
import {APIKeyHelper} from '../helper/APIKeyHelper';

const logger = new ConsoleLogger()

let websocket: Websocket

export class MoonrakerClient {
    protected config = new ConfigHelper()
    protected apiKeyHelper = new APIKeyHelper()

    public constructor() {
        logger.logSuccess('connect to MoonRaker...')

        this.connect()

        this.sendInitCommands()

        this.subscribeToCommands()
    }

    private connect() {
        const oneShotToken = this.apiKeyHelper.getOneShotToken()
        websocket = new WebsocketBuilder(`${this.config.getMoonrakerSocketUrl()}?token=${oneShotToken}`).build()

        websocket.addEventListener(WebsocketEvents.error, ((instance, ev) => {
            logger.logError('Websocket Error:')
            console.log(ev)
            process.exit(5)
        }))
    }

    private subscribeToCommands() {
        logger.logRegular('Subscribe to MoonRaker Events...')

        const objects = this.send(`{"jsonrpc": "2.0", "method": "printer.objects.list"}`)

        console.log(objects)
    }

    private sendInitCommands() {
        logger.logRegular('Send Initial MoonRaker Commands...')

        const id = 1

        websocket.send(`{"jsonrpc": "2.0", "method": "machine.update.status", "params":{"refresh": "true"}, "id": ${id}}`)
        websocket.send(`{"jsonrpc": "2.0", "method": "printer.info", "id": ${id}}`)
        websocket.send(`{"jsonrpc": "2.0", "method": "server.info", "id": ${id}}`)
    }

    public send(message: string) {
        const id = Math.floor(Math.random() * Number.parseInt('10_000')) + 1
        const messageData = JSON.parse(message)

        let response

        messageData.id = id

        function handler(instance: Websocket, ev: any) {
            const responseData = JSON.parse(ev.data);
            if(responseData.id === id) {
                response = responseData
                websocket.removeEventListener(WebsocketEvents.message, handler)
            }
        }

        websocket.addEventListener(WebsocketEvents.message, handler)

        websocket.send(JSON.stringify(messageData))

        return response
    }

    public getWebsocket() {
        return websocket
    }
}