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

// Simplified CUA koala logo (derived from cua-logo-accent.svg)
const CUA_LOGO_SVG = `<svg width="28" height="28" viewBox="0 0 1117 1117" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cua-g" x1="145" y1="134" x2="972" y2="961" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#61BCFF"/>
      <stop offset="1" stop-color="#4FD37E"/>
    </linearGradient>
  </defs>
  <path fill="url(#cua-g)" d="M556.48,280.01c-16.36,0-29.62-13.26-29.62-29.62V116.01c0-16.36,13.26-29.62,29.62-29.62c16.36,0,29.62,13.26,29.62,29.62v134.38C586.1,266.75,572.84,280.01,556.48,280.01z"/>
  <path fill="url(#cua-g)" d="M475.52,305.74c-11.57,11.57-30.32,11.57-41.89,0l-72.36-72.36c-11.57-11.57-11.57-30.32,0-41.89c11.57-11.57,30.32-11.57,41.89,0l72.36,72.36C487.08,275.42,487.08,294.17,475.52,305.74z"/>
  <path fill="url(#cua-g)" d="M637.94,305.73c11.57,11.57,30.32,11.57,41.89,0l72.36-72.36c11.57-11.57,11.57-30.32,0-41.89c-11.57-11.57-30.32-11.57-41.89,0l-72.36,72.36C626.37,275.41,626.37,294.16,637.94,305.73z"/>
  <path fill="url(#cua-g)" d="M601.53,1028.22c-19.42,1.2-38.9,1.58-58.35,1.13c-115.28-2.64-253.01-26.14-326.27-125.85c-14.2-19.33-25.22-40.85-33-63.51c-2.81-8.19-4.94-17.26-12.46-22.28c-16.07-10.73-32.64-20.22-43.86-36.46c-10.38-15.01-15.75-33.56-14.37-51.81c0.71-9.44,2.3-15.28-6.43-20.98c-17.74-11.58-33.7-22.79-40.14-44.18c-7.31-24.28,0.84-47.29,14.48-67.45c2-2.95,3.91-6.08,4.58-9.58c1.38-7.26-2.73-13.89-5.66-20.2c-3-6.46-6.01-12.86-9.15-19.27c-6.66-13.6-12.78-27.91-13.65-43.23c-1.14-20.17,0.76-40.73,9.99-59.01c9.06-17.95,21.94-33.98,37.58-46.62c45.67-36.92,109.66-23.27,160.19-5.44c26.71,9.43,52.68,21.59,77.38,35.45c4.19,2.35,6.39,2.69,10.51,0.03c61.83-39.97,133.45-67.99,207.82-68.46c27.5-0.17,54.97,3.43,81.65,10.01c39.72,9.8,78.62,25.85,113.96,46.46c6.28,3.66,16.86,12.9,24.45,11.44c3-0.58,6.7-3.66,9.35-5.11c23.86-13.04,47.3-25.88,73.1-34.82c38.21-13.24,82.43-24.74,121.38-8.67c50.83,20.96,86.78,78.31,73.93,133.46c-4.08,17.5-15.64,32-19.59,49.41c-1.04,4.58-1.43,9.46,0.09,13.91c3.09,9.06,11.64,15.83,15.67,24.74c4.23,9.33,6.63,19.51,6.71,29.76c0.12,15.44-5.15,30.99-15.21,42.7c-7.35,8.57-17.14,15.49-26.9,21.03c-2.36,1.34-4.94,2.78-5.99,5.28c-0.73,1.74-0.58,3.7-0.43,5.58c0.74,8.9,1.95,17.53,0.67,26.39c-0.61,4.24-1.6,8.42-2.91,12.5c-1.03,3.21-4.9,8.7-4.9,11.86c-7.92,15.52-20.54,28.36-35.03,38.04c-3.79,2.53-9.12,5.06-11.87,8.8c-1.96,2.68-2.36,6.29-3.24,9.55c-1.52,5.61-3.04,11.21-4.56,16.82c-4.83,17.82-12,34.64-22.29,49.99c-36.82,54.93-85.32,90.26-147.3,112.25C723.56,1012.39,662.8,1024.43,601.53,1028.22z"/>
  <path fill="url(#cua-g)" d="M615.45,884.56c-19.83,6.49-41.54,7.23-62.2,6.71c-32.28-0.81-70.99-6.35-89.89-36.09c-10.85-17.08-6.21-42.43-2.2-60.95c5.58-25.77,13.62-51.02,23.98-75.27c8.85-20.73,20.01-42.15,38.89-55.46c19.7-13.89,44.92-15.47,65.19-1.66c24.79,16.89,36.18,48.86,47.62,75.37c8.2,19.01,15.26,38.59,19.94,58.79c4.48,19.35,8.07,39.26-1.52,57.73c-7.37,14.19-21.31,24.12-36.32,29.62C617.78,883.77,616.62,884.17,615.45,884.56z"/>
  <path fill="url(#cua-g)" d="M358.94,765.85h-38.7c-11.05,0-20-8.95-20-20V644.88c0-11.05,8.95-20,20-20h38.7c11.05,0,20,8.95,20,20v100.97C378.94,756.9,369.99,765.85,358.94,765.85z"/>
  <path fill="url(#cua-g)" d="M796.7,765.49H758c-11.05,0-20-8.95-20-20V644.52c0-11.05,8.95-20,20-20h38.7c11.05,0,20,8.95,20,20v100.97C816.7,756.54,807.74,765.49,796.7,765.49z"/>
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

    /** Called by DeviceTracker.buildDeviceRow when the first active device is found. */
    static onDeviceFound(udid: string): void {
        const loadingEl = document.getElementById('cua-loading');
        if (loadingEl) {
            loadingEl.remove();
        }
        // Build the ws proxy URL — ws-scrcpy uses proxy-adb action to relay ADB over WebSocket
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = location.port || (location.protocol === 'https:' ? '443' : '80');
        const wsUrl = `${protocol}//${location.hostname}:${port}${location.pathname}?action=proxy-adb&remote=tcp:8886&udid=${encodeURIComponent(udid)}`;

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
