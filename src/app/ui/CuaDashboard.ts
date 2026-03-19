import '../../style/cua-dashboard.css';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CUA_LOGO_SVG: string = require('../../public/images/cua-logo.svg');

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
    static autoConnectEnabled = false;

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
        brand.innerHTML = CUA_LOGO_SVG;
        nav.appendChild(brand);

        const tabs = document.createElement('div');
        tabs.id = 'cua-nav-tabs';
        tabs.className = 'cua-nav-tabs';
        nav.appendChild(tabs);

        const controls = document.createElement('div');
        controls.id = 'cua-nav-controls';
        controls.className = 'cua-nav-controls';
        nav.appendChild(controls);

        document.body.insertBefore(nav, document.body.firstChild);

        CuaDashboard.updateNavbar(udid);
    }

    static updateNavbar(udid?: string): void {
        const tabs = document.getElementById('cua-nav-tabs');
        if (!tabs) return;

        const hash = location.hash.replace(/^#!/, '');
        const parsedQuery = new URLSearchParams(hash);
        const currentAction = parsedQuery.get('action') || '';
        // Carry the ws proxy URL across tab navigations — prefer hash, fall back to sessionStorage
        const wsUrl = parsedQuery.get('ws') || sessionStorage.getItem('cua-ws-url') || '';

        tabs.innerHTML = '';
        const controls = document.getElementById('cua-nav-controls');
        if (controls) controls.innerHTML = '';

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
            // Stream tab requires ws param
            if (tab.action === 'stream' && wsUrl) {
                params.set('ws', wsUrl);
            }

            const a = document.createElement('a');
            a.className = 'cua-nav-tab';
            a.href = '#';
            a.textContent = tab.label;

            if (currentAction === tab.action) {
                a.classList.add('active');
            }

            const hash = `!${params.toString()}`;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                location.hash = hash;
                location.reload();
            });

            tabs.appendChild(a);
        });

        // Renderer dropdown — only shown on Device (stream) tab
        if (udid && currentAction === 'stream' && controls) {
            const currentPlayer = parsedQuery.get('player') || 'broadway';
            const PLAYERS = [
                { code: 'broadway', label: 'Broadway.js' },
                { code: 'webcodecs', label: 'WebCodecs' },
                { code: 'mse', label: 'H264 Converter' },
                { code: 'tinyh264', label: 'Tiny H264' },
            ];

            const label = document.createElement('span');
            label.className = 'cua-nav-renderer-label';
            label.textContent = 'Renderer';
            controls.appendChild(label);

            const select = document.createElement('select');
            select.className = 'cua-nav-renderer-select';
            PLAYERS.forEach(({ code, label: name }) => {
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = name;
                if (code === currentPlayer) opt.selected = true;
                select.appendChild(opt);
            });
            select.addEventListener('change', () => {
                const params = new URLSearchParams();
                params.set('action', 'stream');
                params.set('udid', udid);
                params.set('player', select.value);
                if (wsUrl) params.set('ws', wsUrl);
                location.hash = `!${params.toString()}`;
                location.reload();
            });
            controls.appendChild(select);
        }
    }

    /** Called by DeviceTracker.buildDeviceRow when the first active device is found.
     *  wsUrl is the proxy-adb WebSocket URL built by DeviceTracker.createUrl(). */
    static onDeviceFound(udid: string, wsUrl: string): void {
        const loadingEl = document.getElementById('cua-loading');
        if (loadingEl) {
            loadingEl.remove();
        }
        // Persist ws URL so tab navigation works without it in the hash
        sessionStorage.setItem('cua-ws-url', wsUrl);
        const params = new URLSearchParams();
        params.set('action', 'stream');
        params.set('udid', udid);
        params.set('player', 'broadway');
        params.set('ws', wsUrl);
        location.hash = `!${params.toString()}`;
        location.reload();
    }

    static showLoading(): void {
        const existing = document.getElementById('cua-loading');
        if (existing) return;
        const loadingEl = document.createElement('div');
        loadingEl.id = 'cua-loading';
        loadingEl.innerHTML = '<span>Connecting to device...</span>';
        document.body.appendChild(loadingEl);
    }
}
