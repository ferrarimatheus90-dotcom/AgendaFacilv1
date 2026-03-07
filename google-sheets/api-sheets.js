// ============================================================
// AgendaFácil — Módulo de integração com Google Sheets
// Inclua este arquivo ANTES do script principal do index.html
// <script src="google-sheets/api-sheets.js"></script>
// ============================================================

const SheetsAPI = (() => {

    // ──────────────────────────────────────────────────────
    // Configuração (salva no localStorage)
    // ──────────────────────────────────────────────────────
    const CONFIG_KEY = 'agendafacil_sheets_config';

    function getConfig() {
        const raw = localStorage.getItem(CONFIG_KEY);
        if (raw) return JSON.parse(raw);
        return {
            url: 'https://script.google.com/macros/s/AKfycbzb3Q5pRh35xWA_9d1lmHGMY8yaXbv8iLOWCqCm__ju2X3IzvOc3d2RAV89Q02Kt4zS/exec',
            token: 'senhaSecreta123!'
        };
    }

    function saveConfig(url, token) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, token }));
    }

    function isConfigured() {
        return true;
    }

    // ──────────────────────────────────────────────────────
    // Request JSONP (resolve CORS com Google Apps Script)
    // ──────────────────────────────────────────────────────
    function request(params) {
        return new Promise((resolve, reject) => {
            const config = getConfig();
            if (!config) return reject(new Error('Google Sheets não configurado.'));

            const callbackName = 'gsCallback_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            const timeout = setTimeout(() => {
                delete window[callbackName];
                if (script.parentNode) script.remove();
                reject(new Error('Timeout ao chamar Google Sheets (15s).'));
            }, 15000);

            window[callbackName] = (data) => {
                clearTimeout(timeout);
                delete window[callbackName];
                if (script.parentNode) script.remove();
                if (data.ok) {
                    resolve(data.data);
                } else {
                    reject(new Error(data.error || 'Erro na API do Sheets.'));
                }
            };

            const urlParams = new URLSearchParams({
                ...params,
                token: config.token,
                callback: callbackName,
            });

            const script = document.createElement('script');
            script.src = config.url + '?' + urlParams.toString();
            script.onerror = () => {
                clearTimeout(timeout);
                delete window[callbackName];
                reject(new Error('Erro ao carregar script do Google Apps Script.'));
            };
            document.head.appendChild(script);
        });
    }

    // ──────────────────────────────────────────────────────
    // API Pública
    // ──────────────────────────────────────────────────────

    async function stats() {
        return request({ action: 'stats' });
    }

    async function list(resource) {
        return request({ action: 'list', resource });
    }

    async function create(resource, data) {
        return request({
            action: 'create',
            resource,
            data: encodeURIComponent(JSON.stringify(data)),
        });
    }

    async function update(resource, id, data) {
        return request({
            action: 'update',
            resource,
            id,
            data: encodeURIComponent(JSON.stringify(data)),
        });
    }

    async function remove(resource, id) {
        return request({ action: 'delete', resource, id });
    }

    async function horariosDisponiveis(profissionalId, data) {
        return request({ action: 'horarios', profissional_id: profissionalId, data });
    }

    async function agendar(dados) {
        return request({
            action: 'agendar',
            data: encodeURIComponent(JSON.stringify(dados)),
        });
    }

    async function getClinicaConfig() {
        return request({ action: 'getConfig' });
    }

    async function setClinicaConfig(dados) {
        return request({
            action: 'setConfig',
            data: encodeURIComponent(JSON.stringify(dados)),
        });
    }

    // Testar conexão
    async function testarConexao(url, token) {
        return new Promise((resolve, reject) => {
            const callbackName = 'gsTest_' + Date.now();
            const timeout = setTimeout(() => {
                delete window[callbackName];
                if (script.parentNode) script.remove();
                reject(new Error('Timeout — verifique a URL e se o script está publicado.'));
            }, 10000);

            window[callbackName] = (data) => {
                clearTimeout(timeout);
                delete window[callbackName];
                if (script.parentNode) script.remove();
                data.ok ? resolve(data.data) : reject(new Error(data.error));
            };

            const script = document.createElement('script');
            script.src = url + '?action=stats&token=' + encodeURIComponent(token) + '&callback=' + callbackName;
            script.onerror = () => { clearTimeout(timeout); reject(new Error('Erro de rede.')); };
            document.head.appendChild(script);
        });
    }

    return {
        isConfigured, getConfig, saveConfig,
        stats, list, create, update, remove,
        horariosDisponiveis, agendar,
        getClinicaConfig, setClinicaConfig,
        testarConexao,
    };

})();
