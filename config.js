/* SIS — Cotizador: runtime configuration
 * Loaded before any cotizador script. Merges defaults with values
 * saved in localStorage (key: 'sis_cfg') and exposes window.CFG.
 */
(function () {
  var D = {
    PROFIT_PCT:      1,    // Margen de ganancia adicional (%)
    IVA_PCT:         12,   // IVA (%)
    LABOR_RATIO_PCT: 30,   // Mano de obra % sobre materiales
    ACABADO_T1_PCT:  15,   // Acabado Tipo 1 markup (%)
    ACABADO_T2_PCT:  25,   // Acabado Tipo 2 markup (%)
    HSP:             4.5,  // Horas Solar Pico — Ciudad de Guatemala
    EFF_PCT:         87,   // Rendimiento del sistema (%)
    PANEL_W:         625,  // Potencia del panel (W)
    PRICE_PANEL:     800,  // Precio panel JA Solar 625W (Q)
    PRICE_HUAWEI_8K: 8200, // Precio inversor Huawei SUN2000-8K (Q)
    SAVINGS_PCT:     90,   // Ahorro estimado al cliente — Cotizador Rápido (%)
    CABLE_M_DEFAULT: 30,   // Metros de cable DC por defecto
    HUAWEI_BASE_KW:  8     // Base kW por unidad para escalar Huawei 8K
  };

  var saved;
  try { saved = JSON.parse(localStorage.getItem('sis_cfg') || '{}'); }
  catch (e) { saved = {}; }

  var m = {};
  Object.keys(D).forEach(function (k) {
    var v = saved[k];
    m[k] = (v !== undefined && v !== '' && !isNaN(+v)) ? +v : D[k];
  });

  window.CFG = {
    PROFIT_PCT:      m.PROFIT_PCT      / 100,
    IVA:             m.IVA_PCT         / 100,
    LABOR_RATIO:     m.LABOR_RATIO_PCT / 100,
    ACABADO_T1_PCT:  m.ACABADO_T1_PCT  / 100,
    ACABADO_T2_PCT:  m.ACABADO_T2_PCT  / 100,
    HSP:             m.HSP,
    EFF:             m.EFF_PCT         / 100,
    PANEL_W:         m.PANEL_W,
    PRICE_PANEL:     m.PRICE_PANEL,
    PRICE_HUAWEI_8K: m.PRICE_HUAWEI_8K,
    SAVINGS_PCT:     m.SAVINGS_PCT     / 100,
    CABLE_M:         m.CABLE_M_DEFAULT,
    HUAWEI_BASE_KW:  m.HUAWEI_BASE_KW,
    _raw:            m,
    _defaults:       D
  };
})();
