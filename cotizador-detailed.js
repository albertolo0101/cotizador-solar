(async function () {
  const HSP = CFG.HSP;
  const EFF = CFG.EFF;
  const LABOR_RATIO = CFG.LABOR_RATIO;
  const IVA = CFG.IVA;

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
    'E-SILLA-L': 20.70,
    'C-MC4': 31.25,
    'C-CAB4-NEGRO': 14.99,
    'C-CAB4-ROJO': 14.99,
    'A-FLIP-2X25DC': 112.50,
    'A-SUP-2P-DC': 385.50,
    'A-FLIP-2X32AC': 98.06,
    'A-SUP-2P-AC': 321.25,
    'A-CAJA-8P': 294.46
  };

  const ACABADO = {
    TIPO1: {
      get pct() { return CFG.ACABADO_T1_PCT; },
      get label() { return `Tipo 1 - Estandar (+${Math.round(CFG.ACABADO_T1_PCT * 100)}%)`; },
      desc: 'Conduit PVC plastico · Cajas de paso plasticas · Amarras plasticas · Etiquetado basico'
    },
    TIPO2: {
      get pct() { return CFG.ACABADO_T2_PCT; },
      get label() { return `Tipo 2 - Premium (+${Math.round(CFG.ACABADO_T2_PCT * 100)}%)`; },
      desc: 'Conduit metalico EMT · Cajas de paso metalicas · Abrazaderas metalicas · Etiquetado profesional · Acabado pintura anticorrosiva'
    }
  };

  let state = {
    kwh: 600,
    struct: 'LOSA',
    cat: 'GENERIC',
    panel: null,
    inversor: null,
    cableM: CFG.CABLE_M,
    huaweiExtras: false,
    acabado: 'TIPO1',
    fueraMetro: false
  };

  function fmt(n, d = 0) {
    return n.toLocaleString('es-GT', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function fmtQ(n) {
    return 'Q ' + fmt(n, 2);
  }

  function fmtQ0(n) {
    return 'Q ' + fmt(n, 0);
  }

  function getPanels() {
    return SISCatalog.getActivePanels();
  }

  function getInverters(cat) {
    return SISCatalog.getInvertersByCategory(cat);
  }

  function getPanel() {
    return SISCatalog.getPanelById(state.panel) || getPanels()[0] || null;
  }

  function getInverter() {
    return SISCatalog.getInverterById(state.inversor) || getInverters(state.cat)[0] || null;
  }

  function refreshSelections() {
    const panels = getPanels();
    if (!panels.length) return;
    if (!panels.some(p => p.id === state.panel)) state.panel = panels[0].id;

    const inverters = getInverters(state.cat);
    if (!inverters.length) return;
    if (!inverters.some(i => i.id === state.inversor)) state.inversor = inverters[0].id;
  }

  function buildPanelGrid() {
    const grid = document.getElementById('panelGrid');
    if (!grid) return;
    grid.innerHTML = '';

    getPanels().forEach(panel => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inv-btn' + (panel.id === state.panel ? ' active' : '');
      btn.innerHTML = `
        <span class="ib-kw">${fmt(panel.watts, 0)} W</span>
        <span class="ib-brand">${panel.brand} · ${panel.model}</span>
        <span class="ib-price">${fmtQ(panel.price)}</span>
      `;
      btn.onclick = function () {
        state.panel = panel.id;
        buildPanelGrid();
        suggestInversor(getSystemSizing().panels);
        buildInvGrid();
        update();
      };
      grid.appendChild(btn);
    });
  }

  function getSystemSizing() {
    const panel = getPanel();
    const kwpNeeded = state.kwh / (HSP * EFF * 30);
    const panels = Math.max(1, Math.ceil(kwpNeeded * 1000 / panel.watts));
    const kwpReal = panels * panel.watts / 1000;
    const genMes = kwpReal * HSP * EFF * 30;
    const coverage = Math.min(genMes / state.kwh * 100, 100);
    return { panel, kwpNeeded, panels, kwpReal, genMes, coverage };
  }

  function getInverterUnits(inv, panels) {
    return Math.max(1, Math.ceil(panels / inv.maxPanels));
  }

  function buildInvGrid() {
    const grid = document.getElementById('invGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const sizing = getSystemSizing();
    getInverters(state.cat).forEach(inv => {
      const units = getInverterUnits(inv, sizing.panels);
      const price = inv.price * units;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inv-btn' + (inv.id === state.inversor ? ' active' : '');
      btn.innerHTML = `
        <span class="ib-kw">${units > 1 ? `${units} x ${inv.model}` : inv.model}</span>
        <span class="ib-brand">${inv.brand} · ${inv.note || (inv.isHuawei ? 'Huawei Premium' : 'Inversor')}</span>
        <span class="ib-price">${fmtQ(price)}${units > 1 ? ` (${units} x ${fmtQ(inv.price)})` : ''}</span>
      `;
      btn.onclick = function () {
        state.inversor = inv.id;
        buildInvGrid();
        updateHuaweiRow();
        update();
      };
      grid.appendChild(btn);
    });
  }

  window.setCat = function (btn) {
    document.querySelectorAll('[data-cat]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    state.cat = btn.dataset.cat;
    refreshSelections();
    suggestInversor(getSystemSizing().panels, true);
    buildInvGrid();
    updateHuaweiRow();
    update();
  };

  window.setStruct = function (btn) {
    document.querySelectorAll('[data-struct]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    state.struct = btn.dataset.struct;
    update();
  };

  window.setAcabado = function (btn) {
    document.querySelectorAll('[data-acabado]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    state.acabado = btn.dataset.acabado;
    document.getElementById('acabadoDesc').textContent = ACABADO[state.acabado].desc;
    update();
  };

  window.toggleExtras = function () {
    state.huaweiExtras = !state.huaweiExtras;
    const row = document.getElementById('huaweiExtrasRow');
    row.classList.toggle('active', state.huaweiExtras);
    update();
  };

  window.toggleFueraMetro = function () {
    state.fueraMetro = !state.fueraMetro;
    const row = document.getElementById('fueraMetroRow');
    row.classList.toggle('active', state.fueraMetro);
    update();
  };

  function updateHuaweiRow() {
    const row = document.getElementById('huaweiExtrasRow');
    const inv = getInverter();
    if (inv && inv.isHuawei) {
      row.style.display = 'flex';
    } else {
      row.style.display = 'none';
      row.classList.remove('active');
      state.huaweiExtras = false;
    }
  }

  function computeBOM(sizing) {
    const panel = sizing.panel;
    const inv = getInverter();
    const n = sizing.panels;
    const invUnits = getInverterUnits(inv, n);
    const largeSystem = n > 8;
    const prices = Object.assign({}, MATERIAL_PRICES);
    prices[panel.id] = panel.price;
    prices[inv.id] = inv.price;

    const rieles = Math.ceil(Math.ceil(n / 2.3) / 2) * 2;
    const midclamp = n * 2;
    const endclamp = Math.ceil(n * 0.85);
    const tierra = rieles;
    const union = Math.ceil(rieles / 2);
    const mc4 = Math.ceil(n * 0.5);
    const flipDC = largeSystem ? 2 : 1;
    const supDC = largeSystem ? 2 : 1;
    const cajas = Math.ceil(n / 7 + 0.5);

    const patasDel = state.struct === 'LOSA' ? rieles : 0;
    const patasTrS = state.struct === 'LOSA' ? Math.ceil(n / 2.5) : 0;
    const patasTrM = state.struct === 'LOSA' ? rieles : 0;
    const sillasL = state.struct === 'LAMINA' ? Math.ceil(n * 3) : 0;

    const bom = [];
    bom.push({ section: 'Paneles', code: panel.id, desc: `Panel ${panel.brand} ${panel.model}`, qty: n });
    bom.push({ section: 'Inversor', code: inv.id, desc: `${invUnits > 1 ? `${invUnits} x ` : ''}Inversor ${inv.brand} ${inv.model}`, qty: invUnits });

    if (inv.isHuawei && state.huaweiExtras) {
      bom.push({ section: 'Accesorios', code: 'A-SMART-SENSOR', desc: 'Smart Power Sensor trifasico DTSU666-H', qty: 1 });
      bom.push({ section: 'Accesorios', code: 'A-DONGLE-WLAN', desc: 'Dongle WLAN A-05 (monitoreo WiFi)', qty: 1 });
    }

    bom.push({ section: 'Estructura', code: 'E-RIEL-6M', desc: 'Riel de aluminio 6.0 m', qty: rieles });
    bom.push({ section: 'Estructura', code: 'E-MIDCLAMP', desc: 'Mid clamp (abrazadera media)', qty: midclamp });
    bom.push({ section: 'Estructura', code: 'E-ENDCLAMP', desc: 'End clamp (abrazadera extremo)', qty: endclamp });
    bom.push({ section: 'Estructura', code: 'E-FIJTIERRA', desc: 'Fijador de tierra', qty: tierra });
    bom.push({ section: 'Estructura', code: 'E-UNION-RIEL', desc: 'Union para rieles', qty: union });

    if (state.struct === 'LOSA') {
      bom.push({ section: 'Estructura Losa', code: 'E-PATA-DEL', desc: 'Pata delantera telescopica', qty: patasDel });
      bom.push({ section: 'Estructura Losa', code: 'E-PATA-TRAS-S', desc: 'Pata trasera 15-30°', qty: patasTrS });
      bom.push({ section: 'Estructura Losa', code: 'E-PATA-TRAS-M', desc: 'Pata trasera 30-60°', qty: patasTrM });
    } else {
      bom.push({ section: 'Estructura Lamina', code: 'E-SILLA-L', desc: 'Soporte tipo Silla L', qty: sillasL });
    }

    bom.push({ section: 'Cables', code: 'C-MC4', desc: 'Conector MC4 (par)', qty: mc4 });
    bom.push({ section: 'Cables', code: 'C-CAB4-NEGRO', desc: 'Cable fotovoltaico 4mm² negro', qty: state.cableM });
    bom.push({ section: 'Cables', code: 'C-CAB4-ROJO', desc: 'Cable fotovoltaico 4mm² rojo', qty: state.cableM });
    bom.push({ section: 'Protecciones DC', code: 'A-FLIP-2X25DC', desc: 'Flipon 2x25A 500VDC', qty: flipDC });
    bom.push({ section: 'Protecciones DC', code: 'A-SUP-2P-DC', desc: 'Supresor 2 polos 40kA DC', qty: supDC });
    bom.push({ section: 'Protecciones AC', code: 'A-FLIP-2X32AC', desc: 'Flipon 2x32A 240VAC', qty: 1 });
    bom.push({ section: 'Protecciones AC', code: 'A-SUP-2P-AC', desc: 'Supresor 2 polos 40kA 240VAC', qty: 1 });
    bom.push({ section: 'Cajas', code: 'A-CAJA-8P', desc: 'Caja sobreponer 8 polos', qty: cajas });

    bom.forEach(function (item) {
      item.unitPrice = prices[item.code] || 0;
      item.subtotal = item.unitPrice * item.qty;
    });

    return { bom, inv, invUnits };
  }

  function renderBOM(bom) {
    const content = document.getElementById('bdContent');
    const totals = document.getElementById('bdTotals');
    let html = '';
    let section = '';

    bom.forEach(function (item) {
      if (item.section !== section) {
        section = item.section;
        html += `<div class="bd-section-header">${item.section}</div>`;
      }
      html += `
        <div class="bd-row">
          <div class="bd-desc">${item.desc}</div>
          <div class="bd-qty">${fmt(item.qty)}</div>
          <div class="bd-unit-price">${fmtQ(item.unitPrice)}</div>
          <div class="bd-subtotal">${fmtQ0(item.subtotal)}</div>
        </div>`;
    });
    content.innerHTML = html;

    const subtotalMats = bom.reduce((sum, item) => sum + item.subtotal, 0);
    const acabadoAmt = subtotalMats * ACABADO[state.acabado].pct;
    const labor = subtotalMats * LABOR_RATIO;
    const subtotalBase = subtotalMats + acabadoAmt + labor;
    const profitAmt = subtotalBase * CFG.PROFIT_PCT;
    const transportSurcharge = state.fueraMetro ? subtotalMats * 0.08 : 0;
    const subtotalAll = subtotalBase + profitAmt + transportSurcharge;
    const ivaAmt = subtotalAll * IVA;
    const total = subtotalAll + ivaAmt;

    totals.innerHTML = `
      <div class="bd-total-row"><span class="tk">Equipos sin IVA</span><span class="tv">${fmtQ(subtotalMats)}</span></div>
      <div class="bd-total-row"><span class="tk">${ACABADO[state.acabado].label}</span><span class="tv">${fmtQ(acabadoAmt)}</span></div>
      <div class="bd-total-row"><span class="tk">Mano de obra estimada (${Math.round(LABOR_RATIO * 100)}%)</span><span class="tv">${fmtQ(labor)}</span></div>
      ${CFG.PROFIT_PCT > 0 ? `<div class="bd-total-row"><span class="tk">Flete y servicios adicionales (${Math.round(CFG.PROFIT_PCT * 100)}%)</span><span class="tv">${fmtQ(profitAmt)}</span></div>` : ''}
      ${state.fueraMetro ? `<div class="bd-total-row"><span class="tk">Servicios fuera del area metropolitana (8%)</span><span class="tv">${fmtQ(transportSurcharge)}</span></div>` : ''}
      <div class="bd-total-row"><span class="tk">Subtotal sin IVA</span><span class="tv">${fmtQ(subtotalAll)}</span></div>
      <div class="bd-total-row"><span class="tk">IVA ${Math.round(IVA * 100)}%</span><span class="tv">${fmtQ(ivaAmt)}</span></div>
      <div class="bd-total-row grand"><span class="tk">TOTAL CON IVA</span><span class="tv">Q ${fmt(Math.round(total / 100) * 100, 0)}</span></div>
    `;

    return { subtotalMats, acabadoAmt, labor, transportSurcharge, subtotalAll, ivaAmt, total };
  }

  function suggestInversor(panels, forceReplace) {
    const inCat = getInverters(state.cat);
    const best = inCat.find(function (inv) { return inv.maxPanels >= panels; }) || inCat[inCat.length - 1];
    if (!best) return;
    const cur = getInverter();
    if (forceReplace || !cur || panels > cur.maxPanels) {
      state.inversor = best.id;
    }
  }

  function animNum(id, html) {
    const el = document.getElementById(id);
    el.innerHTML = html;
    el.classList.remove('num-pop');
    void el.offsetWidth;
    el.classList.add('num-pop');
  }

  function updateSliderFill() {
    const slider = document.getElementById('kwhSlider');
    if (!slider) return;
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;
    const value = Number(slider.value) || min;
    const pct = ((value - min) / Math.max(max - min, 1)) * 100;
    slider.style.setProperty('--pct', pct + '%');
  }

  function updateROI(factura, coverage, totalPrice) {
    if (factura <= 0) {
      document.getElementById('roiResult').classList.remove('show');
      return;
    }
    const cargoFijo = Number(CFG.GRID_FIXED_FEE_Q) || 120;
    const facturaVariable = Math.max(factura - cargoFijo, 0);
    const ahorro = facturaVariable * (coverage / 100);
    if (ahorro <= 0) {
      document.getElementById('roiResult').classList.remove('show');
      return;
    }
    const meses = Math.round(totalPrice / ahorro);
    const vidaUtil = 25 * 12;
    const pctRec = Math.min(meses / vidaUtil * 100, 50);
    const anosLibres = ((vidaUtil - meses) / 12).toFixed(1);
    document.getElementById('roi-months').innerHTML = fmt(meses) + '<span class="rb-unit">meses</span>';
    document.getElementById('roi-precio').textContent = 'Q ' + fmt(totalPrice, 0);
    document.getElementById('roi-factura').textContent = fmtQ(factura);
    document.getElementById('roi-ahorro').textContent = fmtQ(ahorro) + '/mes';
    document.getElementById('roi-cob').textContent = fmt(coverage, 0) + '% de ' + fmtQ(facturaVariable);
    document.getElementById('rb-inv').style.width = pctRec + '%';
    document.getElementById('roi-free-label').textContent = anosLibres + ' anos de ahorro libre →';
    document.getElementById('roiResult').classList.add('show');
  }

  function update() {
    refreshSelections();
    const sizing = getSystemSizing();
    suggestInversor(sizing.panels, false);
    buildInvGrid();
    const { bom, inv, invUnits } = computeBOM(sizing);
    const { subtotalMats, acabadoAmt, labor, transportSurcharge, subtotalAll, ivaAmt, total } = renderBOM(bom);
    const totalRounded = Math.round(total / 100) * 100;

    animNum('res-kwp', fmt(sizing.kwpReal, 2) + '<span class="kpi-unit">kWp</span>');
    document.getElementById('res-kwp-sub').textContent = fmt(sizing.kwpNeeded, 2) + ' kWp necesarios';
    animNum('res-panels', fmt(sizing.panels) + '<span class="kpi-unit">und.</span>');
    document.getElementById('res-panels-sub').textContent = `${sizing.panel.brand} ${sizing.panel.model} · ${fmt(sizing.kwpReal, 2)} kWp total`;
    animNum('res-gen', fmt(sizing.genMes, 0) + '<span class="kpi-unit">kWh</span>');
    document.getElementById('res-gen-sub').textContent = sizing.genMes >= state.kwh
      ? `+${fmt(sizing.genMes - state.kwh, 0)} kWh excedente/mes`
      : `${fmt(state.kwh - sizing.genMes, 0)} kWh restantes de red`;

    animNum('res-price', 'Q ' + fmt(totalRounded, 0));
    document.getElementById('res-price-sub').textContent = `${ACABADO[state.acabado].label} · incluye equipos, acabado y mano de obra`;
    document.getElementById('bd-mats').textContent = fmtQ(subtotalMats);
    document.getElementById('bd-acabado-lbl').textContent = `Acabado ${state.acabado === 'TIPO1' ? 'Tipo 1 (+15%)' : 'Tipo 2 (+25%)'}`;
    document.getElementById('bd-acabado').textContent = fmtQ(acabadoAmt);
    document.getElementById('bd-labor').textContent = fmtQ(labor);
    document.getElementById('bd-iva').textContent = fmtQ(ivaAmt);
    document.getElementById('bd-porkwp').textContent = fmtQ(totalRounded / sizing.kwpReal) + ' / kWp';

    const maxB = Math.max(state.kwh, sizing.genMes);
    document.getElementById('bar-c').style.width = (state.kwh / maxB * 100) + '%';
    document.getElementById('bar-g').style.width = (sizing.genMes / maxB * 100) + '%';
    document.getElementById('bar-c-val').textContent = fmt(state.kwh, 0) + ' kWh';
    document.getElementById('bar-g-val').textContent = fmt(sizing.genMes, 0) + ' kWh';
    document.getElementById('coverage-pct').textContent = fmt(sizing.coverage, 0) + '% cobertura';

    let note = '';
    if (sizing.panels <= 5) note = `<strong>Sistema compacto (${sizing.panels} paneles · ${fmt(sizing.kwpReal, 2)} kWp).</strong> Inversor ${inv.brand} ${inv.model}. Ideal para apartamento o casa pequena.`;
    else if (sizing.panels <= 9) note = `<strong>Sistema residencial (${sizing.panels} paneles · ${fmt(sizing.kwpReal, 2)} kWp).</strong> Inversor ${invUnits > 1 ? `${invUnits} x ` : ''}${inv.brand} ${inv.model}. Cobertura estimada del ${fmt(sizing.coverage, 0)}% de tu consumo.`;
    else if (sizing.panels <= 14) note = `<strong>Sistema mediano-grande (${sizing.panels} paneles · ${fmt(sizing.kwpReal, 1)} kWp).</strong> ${invUnits > 1 ? `${invUnits} inversores ` : 'Inversor '} ${inv.brand}. Puede requerir analisis del tablero electrico existente.`;
    else note = `<strong>Sistema comercial/industrial (${sizing.panels} paneles · ${fmt(sizing.kwpReal, 1)} kWp).</strong> Requiere visita tecnica, estudio de sombras y diseno estructural personalizado.`;
    note += ` Panel seleccionado: <strong>${sizing.panel.brand} ${sizing.panel.model}</strong>. Estructura tipo <strong>${state.struct === 'LOSA' ? 'losa con patas telescopicas' : 'lamina con soportes Silla L'}</strong>. Basado en <strong>${fmt(HSP, 1)} HSP/dia</strong> para Ciudad de Guatemala.`;
    document.getElementById('techNote').innerHTML = note;

    const footerPanelLabel = document.getElementById('footerPanelLabel');
    if (footerPanelLabel) footerPanelLabel.textContent = `${sizing.panel.brand} ${sizing.panel.model}`;

    const factura = parseFloat(document.getElementById('facturaInput').value) || 0;
    if (factura > 0) updateROI(factura, sizing.coverage, totalRounded);
  }

  window.toggleBreakdown = function () {
    document.getElementById('bdToggle').classList.toggle('open');
    document.getElementById('bdBody').classList.toggle('open');
  };

  window.toggleROI = function () {
    document.getElementById('roiToggle').classList.toggle('open');
    document.getElementById('roiBody').classList.toggle('open');
  };

  window.generarPDF = function () {
    const breakdownToggle = document.getElementById('bdToggle');
    const breakdownBody = document.getElementById('bdBody');
    const roiToggle = document.getElementById('roiToggle');
    const roiBody = document.getElementById('roiBody');
    const printDate = document.getElementById('print-date');
    const hadBreakdownOpen = breakdownBody.classList.contains('open');
    const hadRoiOpen = roiBody.classList.contains('open');

    if (!hadBreakdownOpen) {
      breakdownToggle.classList.add('open');
      breakdownBody.classList.add('open');
    }
    if (!hadRoiOpen) {
      roiToggle.classList.add('open');
      roiBody.classList.add('open');
    }
    if (printDate) {
      printDate.textContent = new Date().toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    window.print();

    setTimeout(function () {
      if (!hadBreakdownOpen) {
        breakdownToggle.classList.remove('open');
        breakdownBody.classList.remove('open');
      }
      if (!hadRoiOpen) {
        roiToggle.classList.remove('open');
        roiBody.classList.remove('open');
      }
    }, 300);
    return;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cotizacion Solar SIS</title></head><body style="font-family:Arial,sans-serif;padding:24px;color:#111;">
      <h2>SIS · Cotizacion Solar</h2>
      <p>Panel: ${sizing.panel.brand} ${sizing.panel.model}<br>Paneles: ${sizing.panels}<br>Potencia: ${fmt(sizing.kwpReal, 2)} kWp<br>Inversor: ${invUnits > 1 ? `${invUnits} x ` : ''}${inv.brand} ${inv.model}</p>
      <table style="width:100%;border-collapse:collapse;" border="1" cellpadding="0" cellspacing="0">
        <thead><tr><th>Descripcion</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
        <tbody>${bomRows}</tbody>
      </table>
      <p style="margin-top:16px;">Total con IVA: <strong>Q ${fmt(totalRounded, 0)}</strong></p>
    </body></html>`;

    const win = window.open('', '_blank', 'width=820,height=1000');
    win.document.write(html);
    win.document.close();
    win.onload = function () { setTimeout(function () { win.focus(); win.print(); }, 300); };
  };

  const numInput = document.getElementById('kwhInput');
  const slider = document.getElementById('kwhSlider');
  numInput.addEventListener('input', function () {
    let v = parseInt(numInput.value, 10) || 50;
    v = Math.max(50, Math.min(5000, v));
    slider.value = Math.min(v, 6000);
    state.kwh = v;
    updateSliderFill();
    update();
  });
  slider.addEventListener('input', function () {
    const v = parseInt(slider.value, 10);
    numInput.value = v;
    state.kwh = v;
    updateSliderFill();
    update();
  });
  document.querySelectorAll('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const v = parseInt(btn.dataset.val, 10);
      numInput.value = v;
      slider.value = v;
      state.kwh = v;
      updateSliderFill();
      document.querySelectorAll('.preset-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
      update();
    });
  });
  document.getElementById('cableInput').addEventListener('input', function () {
    state.cableM = Math.max(10, parseInt(this.value, 10) || 30);
    update();
  });
  document.getElementById('facturaInput').addEventListener('input', function () {
    const factura = parseFloat(this.value) || 0;
    const sizing = getSystemSizing();
    const { bom } = computeBOM(sizing);
    const subtotalMats = bom.reduce((s, i) => s + i.subtotal, 0);
    const acabadoAmt = subtotalMats * ACABADO[state.acabado].pct;
    const labor = subtotalMats * LABOR_RATIO;
    const subtotalBase = subtotalMats + acabadoAmt + labor;
    const profitAmt = subtotalBase * CFG.PROFIT_PCT;
    const transportSurcharge = state.fueraMetro ? subtotalMats * 0.08 : 0;
    const totalRounded = Math.round(((subtotalBase + profitAmt + transportSurcharge) * (1 + IVA)) / 100) * 100;
    updateROI(factura, sizing.coverage, totalRounded);
  });

  window.addEventListener('storage', function (event) {
    if (event.key === 'sis_cfg') window.location.reload();
  });

  await SISCatalog.loadCatalog();
  refreshSelections();
  buildPanelGrid();
  suggestInversor(getSystemSizing().panels, true);
  buildInvGrid();
  updateHuaweiRow();
  document.getElementById('acabadoDesc').textContent = ACABADO[state.acabado].desc;
  updateSliderFill();
  update();
})();
