/* SIS - Cotizador: runtime configuration
 * File-backed config loaded from config.json or /api/config.
 */
(function () {
  var API_PATH = '/api/config';
  var FILE_PATH = 'config.json';

  var BASE_DEFAULTS = {
    PROFIT_PCT: 1,
    IVA_PCT: 12,
    LABOR_RATIO_PCT: 30,
    ACABADO_T1_PCT: 15,
    ACABADO_T2_PCT: 25,
    HSP: 4.5,
    EFF_PCT: 87,
    PANEL_W: 625,
    PRICE_PANEL: 800,
    PRICE_HUAWEI_8K: 8200,
    SAVINGS_PCT: 90,
    GRID_FIXED_FEE_Q: 120,
    CABLE_M_DEFAULT: 30,
    HUAWEI_BASE_KW: 8
  };

  var configCache = null;
  var loadPromise = null;

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function normalize(raw) {
    var src = raw || {};
    var out = {};
    Object.keys(BASE_DEFAULTS).forEach(function (key) {
      var value = src[key];
      out[key] = (value !== undefined && value !== '' && !isNaN(+value)) ? +value : BASE_DEFAULTS[key];
    });
    return out;
  }

  function buildRuntime(raw) {
    return {
      PROFIT_PCT: raw.PROFIT_PCT / 100,
      IVA: raw.IVA_PCT / 100,
      LABOR_RATIO: raw.LABOR_RATIO_PCT / 100,
      ACABADO_T1_PCT: raw.ACABADO_T1_PCT / 100,
      ACABADO_T2_PCT: raw.ACABADO_T2_PCT / 100,
      HSP: raw.HSP,
      EFF: raw.EFF_PCT / 100,
      PANEL_W: raw.PANEL_W,
      PRICE_PANEL: raw.PRICE_PANEL,
      PRICE_HUAWEI_8K: raw.PRICE_HUAWEI_8K,
      SAVINGS_PCT: raw.SAVINGS_PCT / 100,
      GRID_FIXED_FEE_Q: raw.GRID_FIXED_FEE_Q,
      CABLE_M: raw.CABLE_M_DEFAULT,
      HUAWEI_BASE_KW: raw.HUAWEI_BASE_KW,
      _raw: clone(raw),
      _defaults: clone(BASE_DEFAULTS)
    };
  }

  function applyConfig(raw) {
    configCache = normalize(raw);
    window.CFG = buildRuntime(configCache);
    return clone(configCache);
  }

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('Config request failed for ' + path);
      return res.json();
    });
  }

  function loadConfig() {
    if (configCache) return Promise.resolve(clone(configCache));
    if (loadPromise) return loadPromise.then(function () { return clone(configCache); });

    loadPromise = fetchJson(API_PATH)
      .then(function (data) { return applyConfig(data); })
      .catch(function () {
        return fetchJson(FILE_PATH).then(function (data) { return applyConfig(data); });
      })
      .catch(function () {
        return applyConfig(BASE_DEFAULTS);
      })
      .finally(function () {
        loadPromise = null;
      });

    return loadPromise;
  }

  function saveConfig(data) {
    var normalized = normalize(data);
    return fetch(API_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(normalized, null, 2)
    }).then(function (res) {
      if (!res.ok) throw new Error('Could not save config');
      applyConfig(normalized);
      return clone(configCache);
    });
  }

  function resetConfig() {
    return saveConfig(BASE_DEFAULTS);
  }

  function getRawConfig() {
    return clone(configCache || normalize(BASE_DEFAULTS));
  }

  // Set initial window.CFG with defaults for immediate use, but do NOT call
  // applyConfig(BASE_DEFAULTS) here because that would set configCache and
  // cause loadConfig() to short-circuit and never fetch config.json.
  window.CFG = buildRuntime(normalize(BASE_DEFAULTS));

  window.SISConfig = {
    API_PATH: API_PATH,
    FILE_PATH: FILE_PATH,
    DEFAULTS: clone(BASE_DEFAULTS),
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    resetConfig: resetConfig,
    getRawConfig: getRawConfig
  };
})();
