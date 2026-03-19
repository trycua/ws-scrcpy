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

const CUA_LOGO_SVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="28" height="28" rx="6" fill="#61bcff" fill-opacity="0.15"/>
  <path d="M7 14C7 10.134 10.134 7 14 7C16.209 7 18.181 8.014 19.485 9.6L17.6 11.2C16.74 10.138 15.447 9.5 14 9.5C11.515 9.5 9.5 11.515 9.5 14C9.5 16.485 11.515 18.5 14 18.5C15.447 18.5 16.74 17.862 17.6 16.8L19.485 18.4C18.181 19.986 16.209 21 14 21C10.134 21 7 17.866 7 14Z" fill="#61bcff"/>
</svg>`;

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
        brand.innerHTML = CUA_LOGO_SVG + '<span>cua</span>';
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

    /** Called by DeviceTracker.buildDeviceRow when the first active device is found. */
    static onDeviceFound(udid: string): void {
        const loadingEl = document.getElementById('cua-loading');
        if (loadingEl) {
            loadingEl.remove();
        }
        const params = new URLSearchParams();
        params.set('action', 'stream');
        params.set('udid', udid);
        params.set('player', 'broadway');
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
