import '../../style/cua-dashboard.css';

interface TabDef {
    label: string;
    action: string;
    extra?: Record<string, string>;
}

const TABS: TabDef[] = [
    { label: 'Device', action: 'stream', extra: { player: 'broadway' } },
    { label: 'Shell', action: 'shell' },
    { label: 'Devtools', action: 'devtools' },
    { label: 'List Files', action: 'list-files' },
];

export class CuaDashboard {
    private static navInjected = false;

    static injectNavbar(udid?: string): void {
        if (CuaDashboard.navInjected) {
            CuaDashboard.updateNavbar(udid);
            return;
        }
        CuaDashboard.navInjected = true;

        const nav = document.createElement('nav');
        nav.id = 'cua-nav';

        const brand = document.createElement('div');
        brand.className = 'cua-nav-brand';
        brand.textContent = 'cua';
        nav.appendChild(brand);

        const tabs = document.createElement('div');
        tabs.id = 'cua-nav-tabs';
        tabs.className = 'cua-nav-tabs';
        nav.appendChild(tabs);

        document.body.insertBefore(nav, document.body.firstChild);

        CuaDashboard.updateNavbar(udid);
    }

    static updateNavbar(udid?: string): void {
        const tabs = document.getElementById('cua-nav-tabs');
        if (!tabs) return;

        const hash = location.hash.replace(/^#!/, '');
        const parsedQuery = new URLSearchParams(hash);
        const currentAction = parsedQuery.get('action') || '';

        tabs.innerHTML = '';

        TABS.forEach((tab) => {
            if (!udid) {
                const span = document.createElement('span');
                span.className = 'cua-nav-tab-disabled';
                span.textContent = tab.label;
                tabs.appendChild(span);
                return;
            }

            const params = new URLSearchParams();
            params.set('action', tab.action);
            params.set('udid', udid);
            if (tab.extra) {
                Object.entries(tab.extra).forEach(([k, v]) => params.set(k, v));
            }

            const a = document.createElement('a');
            a.className = 'cua-nav-tab';
            a.href = `#!${params.toString()}`;
            a.textContent = tab.label;

            if (currentAction === tab.action) {
                a.classList.add('active');
            }

            tabs.appendChild(a);
        });
    }

    static init(): void {
        const hash = location.hash.replace(/^#!/, '');
        const parsedQuery = new URLSearchParams(hash);
        const action = parsedQuery.get('action');
        const udid = parsedQuery.get('udid') || undefined;

        CuaDashboard.injectNavbar(udid);

        const knownActions = TABS.map((t) => t.action);
        const needsAutoConnect = !action || action === 'goog-device-list' || !knownActions.includes(action);

        if (needsAutoConnect) {
            CuaDashboard.autoConnect();
        }
    }

    static autoConnect(): void {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = location.port || '8080';
        const wsUrl = `${protocol}//${location.hostname}:${port}${location.pathname}?action=goog-device-list`;

        const loadingEl = document.createElement('div');
        loadingEl.id = 'cua-loading';
        loadingEl.innerHTML = '<span>Connecting to device...</span>';
        document.body.appendChild(loadingEl);

        let ws: WebSocket;
        try {
            ws = new WebSocket(wsUrl);
        } catch (e) {
            loadingEl.innerHTML = '<span>Failed to connect to device server.</span>';
            return;
        }

        ws.onmessage = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'devicelist' && Array.isArray(msg.data) && msg.data.length > 0) {
                    const device = msg.data.find((d: any) => d.state === 'device') || msg.data[0];
                    if (device && device.udid) {
                        ws.close();
                        const params = new URLSearchParams();
                        params.set('action', 'stream');
                        params.set('udid', device.udid);
                        params.set('player', 'broadway');
                        location.hash = `!${params.toString()}`;
                        location.reload();
                    }
                }
            } catch (_) {
                // ignore parse errors
            }
        };

        ws.onerror = () => {
            loadingEl.innerHTML = '<span>Error connecting to device server.</span>';
        };

        ws.onclose = () => {
            if (document.getElementById('cua-loading')) {
                loadingEl.innerHTML = '<span>Connection closed. No devices found.</span>';
            }
        };
    }
}
