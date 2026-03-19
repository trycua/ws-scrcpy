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

const CUA_LOGO_HTML = `<img src="/images/cua-logo.svg" class="cua-nav-logo" alt="cua" />`;

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
        brand.innerHTML = CUA_LOGO_HTML + '<span>cua</span>';
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
        // Carry the ws proxy URL across tab navigations
        const wsUrl = parsedQuery.get('ws') || '';

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
            // Stream tab requires ws param
            if (tab.action === 'stream' && wsUrl) {
                params.set('ws', wsUrl);
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

    /** Called by DeviceTracker.buildDeviceRow when the first active device is found.
     *  wsUrl is the proxy-adb WebSocket URL built by DeviceTracker.createUrl(). */
    static onDeviceFound(udid: string, wsUrl: string): void {
        const loadingEl = document.getElementById('cua-loading');
        if (loadingEl) {
            loadingEl.remove();
        }
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
