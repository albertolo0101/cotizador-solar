(function () {
  var API_PATH = '/api/catalog';

  var BASE_DEFAULTS = {
    panels: [
      {
        id: 'P-JA-625W',
        brand: 'JA Solar',
        model: '625W bifacial',
        watts: 625,
        price: 800,
        active: true
      }
    ],
    inverters: [
      { id: 'I-HOYMILES-1.8K', brand: 'Hoymiles', model: '1.8 kW', note: 'Microinversor', capacityKw: 1.8, maxPanels: 4, price: 3000, isHuawei: false, active: true },
      { id: 'I-APS-DS3D', brand: 'APS', model: '2 kW', note: 'Microinversor', capacityKw: 2, maxPanels: 4, price: 4500, isHuawei: false, active: true },
      { id: 'I-SOLIS-2.5K', brand: 'Solis 1P', model: '2.5 kW', note: 'Monofasico', capacityKw: 2.5, maxPanels: 5, price: 5250, isHuawei: false, active: true },
      { id: 'I-GROWATT-SPF3K', brand: 'Growatt', model: '3 kW', note: 'Hibrido', capacityKw: 3, maxPanels: 6, price: 6536, isHuawei: false, active: true },
      { id: 'I-GROWATT-MIC3.3K', brand: 'Growatt', model: '3.3 kW', note: 'Monofasico', capacityKw: 3.3, maxPanels: 7, price: 5519, isHuawei: false, active: true },
      { id: 'I-CSOLAR-5K', brand: 'Canadian Solar', model: '5 kW', note: 'Monofasico', capacityKw: 5, maxPanels: 9, price: 5269.45, isHuawei: false, active: true },
      { id: 'I-GROWATT-MIN5K', brand: 'Growatt', model: '5 kW', note: 'Monofasico', capacityKw: 5, maxPanels: 10, price: 5749, isHuawei: false, active: true },
      { id: 'I-CSOLAR-7K', brand: 'Canadian Solar', model: '7 kW', note: 'Monofasico', capacityKw: 7, maxPanels: 12, price: 6700, isHuawei: false, active: true },
      { id: 'I-GROWATT-MIN6K', brand: 'Growatt', model: '6 kW', note: 'Monofasico', capacityKw: 6, maxPanels: 12, price: 6499, isHuawei: false, active: true },
      { id: 'I-GROWATT-SPF6K', brand: 'Growatt', model: '6 kW', note: 'Hibrido', capacityKw: 6, maxPanels: 12, price: 12346, isHuawei: false, active: true },
      { id: 'I-GROWATT-MIN7K', brand: 'Growatt', model: '7 kW', note: 'Monofasico', capacityKw: 7, maxPanels: 14, price: 8200, isHuawei: false, active: true },
      { id: 'I-GROWATT-MIN10K', brand: 'Growatt', model: '10 kW', note: 'Monofasico', capacityKw: 10, maxPanels: 20, price: 11910, isHuawei: false, active: true },
      { id: 'I-GROWATT-MAC15K', brand: 'Growatt', model: '15 kW', note: 'Trifasico', capacityKw: 15, maxPanels: 29, price: 22540, isHuawei: false, active: true },
      { id: 'I-GROWATT-MAC25K', brand: 'Growatt', model: '25 kW', note: 'Trifasico', capacityKw: 25, maxPanels: 48, price: 40668, isHuawei: false, active: true },
      { id: 'I-GROWATT-MAC36K', brand: 'Growatt', model: '36 kW', note: 'Trifasico', capacityKw: 36, maxPanels: 70, price: 50836, isHuawei: false, active: true },
      { id: 'I-HUAWEI-3K', brand: 'Huawei', model: 'SUN2000-3K', note: 'Monofasico', capacityKw: 3, maxPanels: 6, price: 8500, isHuawei: true, active: true },
      { id: 'I-HUAWEI-4K', brand: 'Huawei', model: 'SUN2000-4K', note: 'Monofasico', capacityKw: 4, maxPanels: 8, price: 10000, isHuawei: true, active: true },
      { id: 'I-HUAWEI-5K', brand: 'Huawei', model: 'SUN2000-5K', note: 'Monofasico', capacityKw: 5, maxPanels: 10, price: 11000, isHuawei: true, active: true },
      { id: 'I-HUAWEI-6K', brand: 'Huawei', model: 'SUN2000-6K', note: 'Monofasico', capacityKw: 6, maxPanels: 12, price: 10300, isHuawei: true, active: true },
      { id: 'I-HUAWEI-8K', brand: 'Huawei', model: 'SUN2000-8K', note: 'Trifasico', capacityKw: 8, maxPanels: 20, price: 8200, isHuawei: true, active: true }
    ]
  };

  var catalogCache = null;
  var loadPromise = null;

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function getDefaults() {
    var defaults = clone(BASE_DEFAULTS);
    if (typeof window !== 'undefined' && window.CFG) {
      defaults.panels[0].watts = Number(window.CFG.PANEL_W) || defaults.panels[0].watts;
      defaults.panels[0].price = Number(window.CFG.PRICE_PANEL) || defaults.panels[0].price;
      defaults.panels[0].model = defaults.panels[0].watts + 'W bifacial';
      defaults.inverters.forEach(function (inv) {
        if (inv.id === 'I-HUAWEI-8K') inv.price = Number(window.CFG.PRICE_HUAWEI_8K) || inv.price;
      });
    }
    return defaults;
  }

  function sanitizePanel(panel) {
    var watts = Number(panel.watts);
    var price = Number(panel.price);
    if (!panel || !panel.id || !panel.brand || !panel.model || !isFinite(watts) || watts <= 0 || !isFinite(price) || price < 0) return null;
    return {
      id: String(panel.id).trim(),
      brand: String(panel.brand).trim(),
      model: String(panel.model).trim(),
      watts: watts,
      price: price,
      active: panel.active !== false
    };
  }

  function sanitizeInverter(inv) {
    var capacityKw = Number(inv.capacityKw);
    var maxPanels = Number(inv.maxPanels);
    var price = Number(inv.price);
    if (!inv || !inv.id || !inv.brand || !inv.model || !isFinite(capacityKw) || capacityKw <= 0 || !isFinite(maxPanels) || maxPanels <= 0 || !isFinite(price) || price < 0) return null;
    return {
      id: String(inv.id).trim(),
      brand: String(inv.brand).trim(),
      model: String(inv.model).trim(),
      note: String(inv.note || '').trim(),
      capacityKw: capacityKw,
      maxPanels: Math.round(maxPanels),
      price: price,
      isHuawei: !!inv.isHuawei,
      active: inv.active !== false
    };
  }

  function normalize(raw) {
    var defaults = getDefaults();
    var panels = Array.isArray(raw && raw.panels) ? raw.panels.map(sanitizePanel).filter(Boolean) : clone(defaults.panels);
    var inverters = Array.isArray(raw && raw.inverters) ? raw.inverters.map(sanitizeInverter).filter(Boolean) : clone(defaults.inverters);
    if (!panels.length) panels = clone(defaults.panels);
    if (!inverters.length) inverters = clone(defaults.inverters);
    return { panels: panels, inverters: inverters };
  }

  function loadCatalog() {
    if (catalogCache) return Promise.resolve(clone(catalogCache));
    if (loadPromise) return loadPromise.then(function () { return clone(catalogCache); });

    loadPromise = fetch(API_PATH, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Catalog request failed');
        return res.json();
      })
      .then(function (data) {
        catalogCache = normalize(data);
        return clone(catalogCache);
      })
      .catch(function () {
        catalogCache = normalize(getDefaults());
        return clone(catalogCache);
      })
      .finally(function () {
        loadPromise = null;
      });

    return loadPromise;
  }

  function saveCatalog(data) {
    var normalized = normalize(data);
    return fetch(API_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(normalized, null, 2)
    }).then(function (res) {
      if (!res.ok) throw new Error('Could not save catalog');
      catalogCache = normalized;
      return clone(catalogCache);
    });
  }

  function resetCatalog() {
    return saveCatalog(getDefaults());
  }

  function getCatalog() {
    return clone(catalogCache || normalize(getDefaults()));
  }

  function getActivePanels() {
    return getCatalog().panels.filter(function (p) { return p.active !== false; });
  }

  function getActiveInverters() {
    return getCatalog().inverters
      .filter(function (i) { return i.active !== false; })
      .sort(function (a, b) { return a.maxPanels - b.maxPanels || a.capacityKw - b.capacityKw || a.price - b.price; });
  }

  function getPanelById(id) {
    return getCatalog().panels.find(function (p) { return p.id === id; }) || null;
  }

  function getInverterById(id) {
    return getCatalog().inverters.find(function (i) { return i.id === id; }) || null;
  }

  function getInvertersByCategory(cat) {
    return getActiveInverters().filter(function (inv) {
      return cat === 'HUAWEI' ? inv.isHuawei : !inv.isHuawei;
    });
  }

  window.SISCatalog = {
    API_PATH: API_PATH,
    DEFAULTS: getDefaults(),
    loadCatalog: loadCatalog,
    saveCatalog: saveCatalog,
    resetCatalog: resetCatalog,
    getCatalog: getCatalog,
    getActivePanels: getActivePanels,
    getActiveInverters: getActiveInverters,
    getPanelById: getPanelById,
    getInverterById: getInverterById,
    getInvertersByCategory: getInvertersByCategory
  };
})();
