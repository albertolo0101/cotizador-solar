(async function () {
  const HSP = CFG.HSP;
  const EFF = CFG.EFF;
  const LABOR_RATIO = CFG.LABOR_RATIO;
  const IVA = CFG.IVA;
  const ACABADO_PCT = CFG.ACABADO_T1_PCT;
  const CABLE_M = CFG.CABLE_M;
  const SAVINGS_PCT = CFG.SAVINGS_PCT;

  const MATERIAL_PRICES = {
    'A-SMART-SENSOR': 914.52,
    'A-DONGLE-WLAN': 585,
    'E-RIEL-6M': 336,
    'E-MIDCLAMP': 23.75,
    'E-ENDCLAMP': 23.75,
    'E-FIJTIERRA': 6.02,
    'E-UNION-RIEL': 28.75,
    'E-PATA-DEL': 131.95,
    'E-PATA-TRAS-S': 95,
    'E-PATA-TRAS-M': 122.5,
    'C-MC4': 31.25,
    'C-CAB4-NEGRO': 14.99,
    'C-CAB4-ROJO': 14.99,
    'A-FLIP-2X25DC': 112.50,
    'A-SUP-2P-DC': 385.50,
    'A-FLIP-2X32AC': 98.06,
    'A-SUP-2P-AC': 321.25,
    'A-CAJA-8P': 294.46
  };

  let fueraMetro = false;
  let equipmentLine = 'GENERIC';

  function fmt(n, d) {
    return n.toLocaleString('es-GT', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }

  function fmtQ(n) {
    return 'Q ' + fmt(n, 0);
  }

  function getPanel() {
    return SISCatalog.getActivePanels()[0] || null;
  }

  function getInverters(cat) {
    return SISCatalog.getInvertersByCategory(cat);
  }

  function selectInverter(panels, category) {
    const options = getInverters(category);
    const best = options.find(inv => inv.maxPanels >= panels) || options[options.length - 1];
    const units = Math.max(1, Math.ceil(panels / best.maxPanels));
    return {
      inv: best,
      units,
      displayName: `${units > 1 ? `${units} x ` : ''}${best.brand} ${best.model}`
    };
  }

  function calcSystemPrice(panels, isFueraMetro, category) {
    const panel = getPanel();
    const selected = selectInverter(panels, category);
    const large = panels > 8;
    const rieles = Math.ceil(Math.ceil(panels / 2.3) / 2) * 2;

    let mat = 0;
    mat += panels * panel.price;
    mat += selected.units * selected.inv.price;
    if (selected.inv.isHuawei) {
      mat += MATERIAL_PRICES['A-SMART-SENSOR'];
      mat += MATERIAL_PRICES['A-DONGLE-WLAN'];
    }
    mat += rieles * MATERIAL_PRICES['E-RIEL-6M'];
    mat += panels * 2 * MATERIAL_PRICES['E-MIDCLAMP'];
    mat += Math.ceil(panels * 0.85) * MATERIAL_PRICES['E-ENDCLAMP'];
    mat += rieles * MATERIAL_PRICES['E-FIJTIERRA'];
    mat += Math.ceil(rieles / 2) * MATERIAL_PRICES['E-UNION-RIEL'];
    mat += rieles * MATERIAL_PRICES['E-PATA-DEL'];
    mat += Math.ceil(panels / 2.5) * MATERIAL_PRICES['E-PATA-TRAS-S'];
    mat += rieles * MATERIAL_PRICES['E-PATA-TRAS-M'];
    mat += Math.ceil(panels * 0.5) * MATERIAL_PRICES['C-MC4'];
    mat += CABLE_M * MATERIAL_PRICES['C-CAB4-NEGRO'];
    mat += CABLE_M * MATERIAL_PRICES['C-CAB4-ROJO'];
    mat += (large ? 2 : 1) * MATERIAL_PRICES['A-FLIP-2X25DC'];
    mat += (large ? 2 : 1) * MATERIAL_PRICES['A-SUP-2P-DC'];
    mat += MATERIAL_PRICES['A-FLIP-2X32AC'];
    mat += MATERIAL_PRICES['A-SUP-2P-AC'];
    mat += Math.ceil(panels / 7 + 0.5) * MATERIAL_PRICES['A-CAJA-8P'];

    const acabado = mat * ACABADO_PCT;
    const labor = mat * LABOR_RATIO;
    const subtotalBase = mat + acabado + labor;
    const profit = subtotalBase * CFG.PROFIT_PCT;
    const transportSurcharge = isFueraMetro ? mat * 0.08 : 0;
    const subtotal = subtotalBase + profit + transportSurcharge;
    const iva = subtotal * IVA;

    return {
      total: Math.round((subtotal + iva) / 100) * 100,
      selected,
      transportSurcharge,
      panel
    };
  }

  window.toggleFueraMetro = function () {
    fueraMetro = !fueraMetro;
    document.getElementById('fueraMetroRowR').classList.toggle('active', fueraMetro);
    update();
  };

  window.setEquipmentLine = function (line) {
    equipmentLine = line;
    document.getElementById('lineBtnGeneric').classList.toggle('active', line === 'GENERIC');
    document.getElementById('lineBtnPremium').classList.toggle('active', line === 'HUAWEI');
    update();
  };

  function update() {
    const panel = getPanel();
    if (!panel) return;
    const kwh = Math.max(50, parseInt(document.getElementById('kwhInput').value, 10) || 600);
    const factura = Math.max(0, parseFloat(document.getElementById('facturaInput').value) || 0);
    const kwpNeeded = kwh / (HSP * EFF * 30);
    const panels = Math.max(1, Math.ceil(kwpNeeded * 1000 / panel.watts));
    const kwpReal = panels * panel.watts / 1000;
    const genMes = kwpReal * HSP * EFF * 30;
    const coverage = Math.min(genMes / kwh * 100, 100);
    const result = calcSystemPrice(panels, fueraMetro, equipmentLine);
    const lineLabel = equipmentLine === 'HUAWEI' ? 'Premium' : 'Generico';
    const ahorroMensual = factura * SAVINGS_PCT;
    const nuevaCuota = factura * (1 - SAVINGS_PCT);

    let paybackStr = '—';
    if (ahorroMensual > 0) {
      const mo = result.total / ahorroMensual;
      const yy = Math.floor(mo / 12);
      const mm = Math.round(mo % 12);
      paybackStr = mm > 0 ? `${yy} anos ${mm} meses` : `${yy} anos`;
    }

    document.getElementById('systemCardTitle').textContent = `Sistema recomendado · ${lineLabel} · Losa · Acabado Tipo 1`;
    document.getElementById('specInv').textContent = result.selected.displayName;
    document.getElementById('specPanels').textContent = `${panels} und.`;
    document.getElementById('specKwp').textContent = `${fmt(kwpReal, 2)} kWp`;
    document.getElementById('specPrice').textContent = fmtQ(result.total);
    document.getElementById('specPriceSub').textContent = fueraMetro
      ? `Incluye equipos ${lineLabel.toLowerCase()}, acabado Tipo 1, mano de obra y recargo fuera area metropolitana (${fmtQ(result.transportSurcharge)}) · referencial`
      : `Incluye equipos ${lineLabel.toLowerCase()}, acabado Tipo 1 y mano de obra · referencial`;
    document.getElementById('billBefore').textContent = `Q ${fmt(factura, 0)}`;
    document.getElementById('billAfter').textContent = `Q ${fmt(nuevaCuota, 0)}`;
    document.getElementById('rowAhorro').textContent = `Q ${fmt(ahorroMensual, 0)} / mes`;
    document.getElementById('rowCobertura').textContent = `${fmt(coverage, 0)}% de tu consumo`;
    document.getElementById('rowPayback').textContent = paybackStr;
    document.getElementById('proj5').textContent = `Q ${fmt(Math.max(0, 5 * 12 * ahorroMensual - result.total), 0)}`;
    document.getElementById('proj10').textContent = `Q ${fmt(Math.max(0, 10 * 12 * ahorroMensual - result.total), 0)}`;
    document.getElementById('proj25').textContent = `Q ${fmt(Math.max(0, 25 * 12 * ahorroMensual - result.total), 0)}`;
  }

  window.imprimirPDF = function () {
    document.getElementById('print-date').textContent = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    window.print();
  };

  await SISCatalog.loadCatalog();
  document.getElementById('kwhInput').addEventListener('input', update);
  document.getElementById('facturaInput').addEventListener('input', update);
  update();
})();
