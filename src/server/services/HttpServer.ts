import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';
import path from 'path';
import { Service } from './Service';
import { Utils } from '../Utils';
import express, { Express, Request, Response, NextFunction } from 'express';
import { Config } from '../Config';
import { TypedEmitter } from '../../common/TypedEmitter';
import * as process from 'process';
import { EnvName } from '../EnvName';

export const VNC_PASSWORD = process.env['VNC_PASSWORD'] || '';
const AUTH_COOKIE = 'cua_auth';

function makeToken(password: string): string {
    return crypto.createHmac('sha256', 'cua-ws-scrcpy').update(password).digest('hex');
}

function parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach((part) => {
        const [k, ...v] = part.trim().split('=');
        if (k) cookies[k.trim()] = decodeURIComponent(v.join('='));
    });
    return cookies;
}

export function isAuthorized(cookieHeader: string | undefined): boolean {
    if (!VNC_PASSWORD) return true;
    if (!cookieHeader) return false;
    const cookies = parseCookies(cookieHeader);
    return cookies[AUTH_COOKIE] === makeToken(VNC_PASSWORD);
}

const LOGIN_PAGE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>cua — sign in</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0c10; color: #f6f8fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  form { display: flex; flex-direction: column; gap: 12px; width: 280px; }
  input[type=password] { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; color: #f6f8fb; font-size: 14px; padding: 10px 14px; outline: none; }
  input[type=password]:focus { border-color: rgba(97,188,255,0.5); }
  button { background: #61bcff; color: #0a0c10; border: none; border-radius: 8px;
    font-size: 14px; font-weight: 600; padding: 10px; cursor: pointer; }
  .err { color: #ff5f73; font-size: 13px; display: none; }
  .err.show { display: block; }
</style>
</head>
<body>
<form method="GET">
  <input type="password" name="password" placeholder="Password" autofocus />
  <button type="submit">Sign in</button>
  <span class="err __ERR__">Incorrect password</span>
</form>
</body>
</html>`;

const DEFAULT_STATIC_DIR = path.join(__dirname, './public');

const PATHNAME = process.env[EnvName.WS_SCRCPY_PATHNAME] || __PATHNAME__;

export type ServerAndPort = {
    server: https.Server | http.Server;
    port: number;
};

interface HttpServerEvents {
    started: boolean;
}

export class HttpServer extends TypedEmitter<HttpServerEvents> implements Service {
    private static instance: HttpServer;
    private static PUBLIC_DIR = DEFAULT_STATIC_DIR;
    private static SERVE_STATIC = true;
    private servers: ServerAndPort[] = [];
    private mainApp?: Express;
    private started = false;

    protected constructor() {
        super();
    }

    public static getInstance(): HttpServer {
        if (!this.instance) {
            this.instance = new HttpServer();
        }
        return this.instance;
    }

    public static hasInstance(): boolean {
        return !!this.instance;
    }

    public static setPublicDir(dir: string): void {
        if (HttpServer.instance) {
            throw Error('Unable to change value after instantiation');
        }
        HttpServer.PUBLIC_DIR = dir;
    }

    public static setServeStatic(enabled: boolean): void {
        if (HttpServer.instance) {
            throw Error('Unable to change value after instantiation');
        }
        HttpServer.SERVE_STATIC = enabled;
    }

    public async getServers(): Promise<ServerAndPort[]> {
        if (this.started) {
            return [...this.servers];
        }
        return new Promise<ServerAndPort[]>((resolve) => {
            this.once('started', () => {
                resolve([...this.servers]);
            });
        });
    }

    public getName(): string {
        return `HTTP(s) Server Service`;
    }

    public async start(): Promise<void> {
        this.mainApp = express();

        // Auth middleware — only active when VNC_PASSWORD is set
        if (VNC_PASSWORD) {
            this.mainApp.use((req: Request, res: Response, next: NextFunction) => {
                // Allow ?password= to set cookie
                if (req.query['password'] !== undefined) {
                    const supplied = req.query['password'] as string;
                    if (supplied === VNC_PASSWORD) {
                        const clean = req.path + (Object.keys(req.query).filter(k => k !== 'password').length
                            ? '?' + new URLSearchParams(
                                Object.entries(req.query as Record<string, string>)
                                    .filter(([k]) => k !== 'password')
                              ).toString()
                            : '');
                        res.setHeader('Set-Cookie', `${AUTH_COOKIE}=${makeToken(VNC_PASSWORD)}; Path=/; HttpOnly; SameSite=Lax`);
                        res.redirect(302, clean || '/');
                        return;
                    }
                    res.status(401).send(LOGIN_PAGE.replace('__ERR__', 'show'));
                    return;
                }
                if (!isAuthorized(req.headers['cookie'])) {
                    res.status(401).send(LOGIN_PAGE.replace('__ERR__', ''));
                    return;
                }
                next();
            });
        }

        if (HttpServer.SERVE_STATIC && HttpServer.PUBLIC_DIR) {
            this.mainApp.use(PATHNAME, express.static(HttpServer.PUBLIC_DIR));

            /// #if USE_WDA_MJPEG_SERVER

            const { MjpegProxyFactory } = await import('../mw/MjpegProxyFactory');
            this.mainApp.get('/mjpeg/:udid', new MjpegProxyFactory().proxyRequest);
            /// #endif
        }
        const config = Config.getInstance();
        config.servers.forEach((serverItem) => {
            const { secure, port, redirectToSecure } = serverItem;
            let proto: string;
            let server: http.Server | https.Server;
            if (secure) {
                if (!serverItem.options) {
                    throw Error('Must provide option for secure server configuration');
                }
                server = https.createServer(serverItem.options, this.mainApp);
                proto = 'https';
            } else {
                const options = serverItem.options ? { ...serverItem.options } : {};
                proto = 'http';
                let currentApp = this.mainApp;
                let host = '';
                let port = 443;
                let doRedirect = false;
                if (redirectToSecure === true) {
                    doRedirect = true;
                } else if (typeof redirectToSecure === 'object') {
                    doRedirect = true;
                    if (typeof redirectToSecure.port === 'number') {
                        port = redirectToSecure.port;
                    }
                    if (typeof redirectToSecure.host === 'string') {
                        host = redirectToSecure.host;
                    }
                }
                if (doRedirect) {
                    currentApp = express();
                    currentApp.use(function (req, res) {
                        const url = new URL(`https://${host ? host : req.headers.host}${req.url}`);
                        if (port && port !== 443) {
                            url.port = port.toString();
                        }
                        return res.redirect(301, url.toString());
                    });
                }
                server = http.createServer(options, currentApp);
            }
            this.servers.push({ server, port });
            server.listen(port, () => {
                Utils.printListeningMsg(proto, port, PATHNAME);
            });
        });
        this.started = true;
        this.emit('started', true);
    }

    public release(): void {
        this.servers.forEach((item) => {
            item.server.close();
        });
    }
}
