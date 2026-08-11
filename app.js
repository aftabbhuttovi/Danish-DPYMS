const { useState, useEffect, useMemo, useCallback } = React;

/* ============================================================================
   DANISH HEALTH CARE (P) LTD. — DPYMS v2
   Digital Production Yield Management System
   Departments: Tablets, Capsules, ORS (sachets), Ointment (tubes)
   Roles: Production, Quality Assurance (QA), Packaging, Manager
============================================================================ */

const C = {
  navy: "#0E2A5E", navy2: "#153E82", blue: "#2F6FE0", skyBlue: "#5FA8E0",
  paleBg: "#F4F7FC", panelBg: "#FFFFFF", ink: "#101826", sub: "#5B6B7F",
  line: "#DCE4F0", white: "#FFFFFF",
  ok: "#1E7B34", okBg: "#E3F5E6", warn: "#9C6500", warnBg: "#FFF3D6",
  bad: "#B00020", badBg: "#FDE3E3",
};
const FONT_DISPLAY = "'Segoe UI Semibold', 'Segoe UI', Arial, sans-serif";
const FONT_BODY = "'Segoe UI', Arial, sans-serif";
const FONT_MONO = "'Consolas', 'Courier New', monospace";

const supabaseUrl = 'https://fxhakwigygyjspljrjob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aGFrd2lneWd5anNwbGpyam9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTQ5NzYsImV4cCI6MjA5OTc5MDk3Nn0.5WUUUBgw78EawfBVgUd1idrkWT_imbsRBgr-MWdJg';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Dedicated Global Multi-Device Cloud Synchronization Endpoint
const CLOUD_SYNC_BASE = 'https://kvdb.io/DPYMS_v2_DanishPharm_2026_Prod';

// Image assets with embedded SVG Data URIs for guaranteed loading on all devices
const DEFAULT_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 120" width="460" height="120"><rect width="100%" height="100%" fill="none"/><circle cx="50" cy="60" r="36" fill="%230E2A5E" stroke="%232F6FE0" stroke-width="3"/><path d="M50 32 V88 M36 46 H64 M36 74 H64" stroke="%235FA8E0" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="60" r="10" fill="%23FFFFFF"/><text x="100" y="55" font-family="'Segoe UI', Arial, sans-serif" font-weight="800" font-size="28" fill="%230E2A5E" letter-spacing="1">DANISH</text><text x="100" y="82" font-family="'Segoe UI', Arial, sans-serif" font-weight="600" font-size="16" fill="%232F6FE0" letter-spacing="3">HEALTH CARE (P) LTD.</text></svg>`;
const DEFAULT_TAB = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300"><rect width="300" height="300" rx="20" fill="%230E2A5E"/><rect x="40" y="40" width="220" height="220" rx="16" fill="%23FFFFFF" stroke="%235FA8E0" stroke-width="3"/><circle cx="90" cy="90" r="28" fill="%232F6FE0"/><circle cx="150" cy="90" r="28" fill="%232F6FE0"/><circle cx="210" cy="90" r="28" fill="%232F6FE0"/><circle cx="90" cy="150" r="28" fill="%232F6FE0"/><circle cx="150" cy="150" r="28" fill="%232F6FE0"/><circle cx="210" cy="150" r="28" fill="%232F6FE0"/><circle cx="90" cy="210" r="28" fill="%232F6FE0"/><circle cx="150" cy="210" r="28" fill="%232F6FE0"/><circle cx="210" cy="210" r="28" fill="%232F6FE0"/><text x="150" y="275" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" font-size="14" fill="%23FFFFFF" text-anchor="middle">TABLETS</text></svg>`;
const DEFAULT_CAP = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300"><rect width="300" height="300" rx="20" fill="%23153E82"/><rect x="40" y="40" width="220" height="220" rx="16" fill="%23F4F7FC" stroke="%232F6FE0" stroke-width="3"/><g transform="translate(65,70)"><rect x="0" y="0" width="24" height="48" rx="12" fill="%232F6FE0"/><rect x="0" y="24" width="24" height="24" rx="12" fill="%23FFFFFF"/></g><g transform="translate(138,70)"><rect x="0" y="0" width="24" height="48" rx="12" fill="%232F6FE0"/><rect x="0" y="24" width="24" height="24" rx="12" fill="%23FFFFFF"/></g><g transform="translate(211,70)"><rect x="0" y="0" width="24" height="48" rx="12" fill="%232F6FE0"/><rect x="0" y="24" width="24" height="24" rx="12" fill="%23FFFFFF"/></g><g transform="translate(65,160)"><rect x="0" y="0" width="24" height="48" rx="12" fill="%232F6FE0"/><rect x="0" y="24" width="24" height="24" rx="12" fill="%23FFFFFF"/></g><g transform="translate(138,160)"><rect x="0" y="0" width="24" height="48" rx="12" fill="%232F6FE0"/><rect x="0" y="24" width="24" height="24" rx="12" fill="%23FFFFFF"/></g><g transform="translate(211,160)"><rect x="0" y="0" width="24" height="48" rx="12" fill="%232F6FE0"/><rect x="0" y="24" width="24" height="24" rx="12" fill="%23FFFFFF"/></g><text x="150" y="275" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" font-size="14" fill="%23FFFFFF" text-anchor="middle">CAPSULES</text></svg>`;
const DEFAULT_ORS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300"><rect width="300" height="300" rx="20" fill="%230E2A5E"/><rect x="50" y="45" width="200" height="200" rx="12" fill="%23FFFFFF" stroke="%231E7B34" stroke-width="4"/><rect x="65" y="60" width="170" height="40" rx="6" fill="%231E7B34"/><text x="150" y="86" font-family="'Segoe UI', Arial, sans-serif" font-weight="800" font-size="20" fill="%23FFFFFF" text-anchor="middle">DANISH ORS</text><text x="150" y="130" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" font-size="15" fill="%230E2A5E" text-anchor="middle">ORAL REHYDRATION</text><text x="150" y="150" font-family="'Segoe UI', Arial, sans-serif" font-weight="600" font-size="13" fill="%235B6B7F" text-anchor="middle">SALTS (WHO FORMULA)</text><circle cx="150" cy="190" r="22" fill="%235FA8E0" opacity="0.2"/><path d="M150 176 L150 204 M136 190 L164 190" stroke="%231E7B34" stroke-width="4" stroke-linecap="round"/><text x="150" y="275" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" font-size="14" fill="%23FFFFFF" text-anchor="middle">ORS SACHETS</text></svg>`;
const DEFAULT_OINT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300"><rect width="300" height="300" rx="20" fill="%23153E82"/><g transform="rotate(-25 150 150)"><rect x="70" y="110" width="160" height="60" rx="8" fill="%23FFFFFF" stroke="%239C6500" stroke-width="3"/><rect x="230" y="120" width="25" height="40" rx="4" fill="%230E2A5E"/><rect x="50" y="115" width="20" height="50" fill="%239C6500"/><text x="140" y="146" font-family="'Segoe UI', Arial, sans-serif" font-weight="800" font-size="16" fill="%230E2A5E" text-anchor="middle">OINTMENT TUBE</text></g><text x="150" y="275" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" font-size="14" fill="%23FFFFFF" text-anchor="middle">OINTMENT</text></svg>`;

const BRAND_LOGO = window.LOGO_B64 || 'danish_logo.jpg';
const IMG_TAB = window.TAB_B64 || 'tablet_product.jpg';
const IMG_CAP = window.CAP_B64 || 'capsule_product.jpg';
const IMG_ORS = window.ORS_B64 || 'ors_product.jpg';
const IMG_OINT = window.OINT_B64 || 'ointment_product.jpg';

// ---------- Pre-loaded Default Product Examples ----------
const SAMPLE_MOTHER_BATCHES = [
  {
    id: "MB-TB-002", dept: "tablet", date: "2026-07-24",
    genericName: "Aceclofenac (100 mg) and Paracetamol (325 mg) Tablets", productGroup: "ALDONIX / ACLONAC GROUP",
    avgUnitWt: "630", plannedLakhUnits: "10.00", plannedBatchWt: "630.0", rrGran: "0",
    granOutput: "627.0", compOutput: "626.4",
    coated: "Y", coreAvgWt: "630", coatWtGainPct: "1.5", actualCoatedWt: "639.45", coatOutput: "635.8",
    remarks: "Progressive yield verified across all stages.", loggedBy: "Production/QA Officer", qaStatus: "QA Approved"
  },
  {
    id: "MB-CP-001", dept: "capsule", date: "2026-07-23",
    genericName: "OMEPRAZOLE CAPSULES BP 20 MG", productGroup: "OMEDAN GROUP",
    avgUnitWt: "326", fillWtMg: "250", shellWtMg: "76", plannedLakhUnits: "5.00", plannedBatchWt: "125.0", granOutput: "124.2", compOutput: "123.8",
    remarks: "Locking height and fill weight variation within BP specifications.", loggedBy: "Production/QA Officer", qaStatus: "QA Approved"
  },
  {
    id: "MB-OR-001", dept: "ors", date: "2026-07-22",
    genericName: "ORS POWDER (WHO FORMULA)", productGroup: "DANISH ORS SACHETS",
    plannedQty: "250000", mixOutputKg: "5250", fillOutputQty: "248500",
    remarks: "Moisture content: 0.8%, Electrolyte concentration verified.", loggedBy: "Production/QA Officer", qaStatus: "QA Approved"
  }
];

const SAMPLE_COMMERCIAL_BATCHES = [
  {
    id: "CB-TB-001", dept: "tablet", mbId: "MB-TB-002", date: "2026-07-24",
    productName: "ALDONIX-P", batchNumber: "LPX26001",
    unitsReceived: "400000", packedQty: "397600", dispatchQty: "396000",
    rejectedUnits: "1600", rrGeneratedUnits: "800", loggedBy: "Packaging Officer"
  },
  {
    id: "CB-TB-002", dept: "tablet", mbId: "MB-TB-002", date: "2026-07-24",
    productName: "ACLONAC-P", batchNumber: "APC26003",
    unitsReceived: "600000", packedQty: "597600", dispatchQty: "595200",
    rejectedUnits: "1800", rrGeneratedUnits: "600", loggedBy: "Packaging Officer"
  },
  {
    id: "CB-CP-001", dept: "capsule", mbId: "MB-CP-001", date: "2026-07-25",
    productName: "OMEDAN 20 CAPSULES", batchNumber: "CMA26001",
    unitsReceived: "500000", packedQty: "497000", dispatchQty: "496000",
    rejectedUnits: "2000", rrGeneratedUnits: "1000", loggedBy: "Packaging Officer"
  }
];

function toSnakeCase(obj) {
  const newObj = {};
  for (let key in obj) {
    if (key === 'splitCount' || key === 'splitNames') continue;
    if (key === 'compRR') {
      newObj['comp_rr'] = obj[key];
      continue;
    }
    const snakeKey = key.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase());
    newObj[snakeKey] = obj[key];
  }
  return newObj;
}

function toCamelCase(obj) {
  const newObj = {};
  for (let key in obj) {
    if (key === 'comp_rr') {
      newObj['compRR'] = obj[key];
      continue;
    }
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
}

async function hashPassword(pwd) {
  const msgBuffer = new TextEncoder().encode(pwd);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const ROLE_PASSWORDS = {
  production: 'production123',
  qa: 'qa123',
  packaging: 'packaging123',
  manager: 'manager123'
};

const ROLE_HASHES = {
  production: '97f08b12c985e818cb86cd3d6f7c4dec65a586d95874ce54db426d20d383ab2a',
  qa: 'c1b474e2d4e78873f848037146522c069b14798b0451cfbf5894101e4a193631',
  packaging: 'e97af628deabddcc642d00c9b0fa3c488e54fe9bbe557975e5f45e5c9f04ea82',
  manager: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
};

const DEPARTMENTS = {
  tablet:   { key: "tablet",   label: "Tablets",   unit: "Lakh Tabs", icon: "💊", imgSrc: IMG_TAB, stages: ["gran", "comp", "coat"] },
  capsule:  { key: "capsule",  label: "Capsules",  unit: "Lakh Caps", icon: "⬤", imgSrc: IMG_CAP, stages: ["gran", "comp"] },
  ors:      { key: "ors",      label: "ORS",       unit: "Lakh Sachets", icon: "🥤", imgSrc: IMG_ORS, stages: ["mix", "fill"] },
  ointment: { key: "ointment", label: "Ointment",  unit: "Lakh Tubes", icon: "🧴", imgSrc: IMG_OINT, stages: ["mix", "fill"] },
};
const DEPT_LIST = Object.values(DEPARTMENTS);

// ---------- DUAL-ENGINE MOBILE-FRIENDLY CLOUD PERSISTENCE HUB ----------
async function loadShared(key, fallback) {
  const cloudKey = key === 'dpyms_mother_batches' ? 'mother_batches' : 'commercial_batches';
  
  // 1. Read existing local storage data first
  let localData = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) localData = parsed;
    }
  } catch (e) {}

  let cloudData = [];

  // 2. Query Supabase Direct REST API (100% Mobile Carrier & Safari/Chrome Compatible)
  try {
    const table = cloudKey;
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=5000&order=created_at.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cloudData = data.map(toCamelCase);
      }
    }
  } catch (e) {
    console.warn("Supabase Direct REST API fetch warning:", e);
  }

  // 3. Parallel fetch from KVDB Cloud Relay fallback
  try {
    const res = await fetch(`${CLOUD_SYNC_BASE}/${cloudKey}?nocache=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        const kvMap = new Map();
        cloudData.forEach(item => kvMap.set(item.id, item));
        json.forEach(item => kvMap.set(item.id, item));
        cloudData = Array.from(kvMap.values());
      }
    }
  } catch (e) {}

  // 4. SMART UNION MERGE (Merges Local + Supabase + KVDB + Fallback by ID so ALL devices get ALL batches!)
  const itemMap = new Map();

  // Initial sample fallback items
  if (Array.isArray(fallback)) {
    fallback.forEach(item => itemMap.set(item.id, item));
  }

  // Overlay local items from this device
  localData.forEach(item => itemMap.set(item.id, item));

  // Overlay cloud items from all other devices (laptop, phones, PCs)
  cloudData.forEach(item => itemMap.set(item.id, item));

  const merged = Array.from(itemMap.values());

  // Lock merged result into localStorage permanently!
  try {
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (e) {}

  // 5. AUTOMATIC CLOUD PUSH: Broadcast complete merged list back to Cloud DB so all phones/PCs get all 5 batches!
  if (merged.length > cloudData.length) {
    saveShared(key, merged);
  }

  return merged;
}

async function saveShared(key, value) {
  const cloudKey = key === 'dpyms_mother_batches' ? 'mother_batches' : 'commercial_batches';

  // 1. Immediately save to LocalStorage for zero-latency local lock
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("localStorage write error:", e);
  }

  // 2. Save via Supabase Direct REST API (Works on Mobile 4G/5G + WiFi)
  try {
    const table = cloudKey;
    const snakeCaseRows = value.map(toSnakeCase);
    await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(snakeCaseRows)
    });
  } catch (e) {
    console.warn("Supabase Direct REST save warning:", e);
  }

  // 3. Broadcast to KVDB Cloud Sync
  try {
    await fetch(`${CLOUD_SYNC_BASE}/${cloudKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
  } catch (e) {
    console.warn("KVDB Cloud save warning:", e);
  }

  return { ok: true };
}

async function deleteSharedRow(table, id) {
  const key = table === "mother_batches" ? "dpyms_mother_batches" : "dpyms_commercial_batches";
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      const updated = list.filter(item => item.id !== id);
      await saveShared(key, updated);
    }
  } catch (e) {}

  try {
    await supabase.from(table).delete().eq('id', id);
  } catch (e) {}
}

function toCSV(data, headers) {
  if (!data || !data.length) return '';
  const headerKeys = headers ? headers.map(h => h.key) : Object.keys(data[0]);
  const headerLabels = headers ? headers.map(h => h.label) : Object.keys(data[0]);

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [
    headerLabels.map(escapeCell).join(','),
    ...data.map(row => headerKeys.map(k => escapeCell(row[k])).join(','))
  ];

  return rows.join('\r\n');
}

function downloadCSV(filename, csvContent) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const round2 = (n) => (isFinite(n) && n !== "" && n !== null ? Math.round(n * 100) / 100 : "");
function lakhUnitsFromKg(kg, avgWtMg) {
  if (!kg || !avgWtMg) return "";
  return round2((kg * 1000000) / avgWtMg / 100000);
}
function pct(num, den) {
  if (!num && num !== 0) return "";
  if (!den) return "";
  return round2((num / den) * 100);
}
function lakhFromUnits(units) {
  if (!units && units !== 0) return "";
  return round2(units / 100000);
}

// ---------- Progressive Yield Calculations ----------
function computeMB_Tablet(mbRaw, commercialBatches) {
  const wt = parseFloat(mbRaw.avgUnitWt);
  const plannedLakhInput = parseFloat(mbRaw.plannedLakhUnits);
  let batchWt = parseFloat(mbRaw.plannedBatchWt);

  const rr = parseFloat(mbRaw.rrGran) || 0;
  
  if (isFinite(plannedLakhInput) && wt && !batchWt) {
    batchWt = Math.max(0, ((plannedLakhInput * 100000 * wt) / 1000000) - rr);
  }
  const totalBatchKg = isFinite(batchWt) ? round2(batchWt + rr) : "";
  const plannedLakh = isFinite(plannedLakhInput) ? plannedLakhInput : (totalBatchKg !== "" ? lakhUnitsFromKg(totalBatchKg, wt) : "");

  const gran = parseFloat(mbRaw.granOutput);
  const granLakh = isFinite(gran) && wt ? lakhUnitsFromKg(gran, wt) : "";
  const granYield = isFinite(gran) && totalBatchKg !== "" ? pct(gran, totalBatchKg) : "";

  const comp = parseFloat(mbRaw.compOutput);
  const compLakh = isFinite(comp) && wt ? lakhUnitsFromKg(comp, wt) : "";
  const compYield = isFinite(comp) && totalBatchKg !== "" ? pct(comp, totalBatchKg) : "";

  const coated = mbRaw.coated === "Y";
  const coreWt = parseFloat(mbRaw.coreAvgWt) || wt;
  const coatGainPct = parseFloat(mbRaw.coatWtGainPct) || 0;
  const expectedCoatedWt = isFinite(coreWt) ? round2(coreWt * (1 + coatGainPct / 100)) : "";
  const actualCoatedWt = parseFloat(mbRaw.actualCoatedWt) || expectedCoatedWt;

  let coat = parseFloat(mbRaw.coatOutput);
  if (!coat && coated && isFinite(comp) && coatGainPct) {
    coat = round2(comp * (1 + coatGainPct / 100));
  }

  const effectiveCoatedUnitWt = actualCoatedWt || wt;
  const coatLakh = coated && isFinite(coat) && effectiveCoatedUnitWt ? lakhUnitsFromKg(coat, effectiveCoatedUnitWt) : "";
  const coatYield = !coated ? "NA" : isFinite(coat) && isFinite(comp) ? pct(comp, totalBatchKg) : "";

  const linked = commercialBatches.filter((cb) => cb.mbId === mbRaw.id);
  const packedLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.packedQty)) ? parseFloat(cb.packedQty) / 100000 : 0), 0)
  );
  const packedUnitsTotal = linked.reduce((sum, cb) => sum + (parseFloat(cb.packedQty) || 0), 0);
  
  const dispatchLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.dispatchQty)) ? parseFloat(cb.dispatchQty) / 100000 : 0), 0)
  );
  const dispatchUnitsTotal = linked.reduce((sum, cb) => sum + (parseFloat(cb.dispatchQty) || 0), 0);

  const totalInputUnits = plannedLakh * 100000;
  const finalYield = totalInputUnits > 0 && dispatchUnitsTotal > 0 ? pct(dispatchUnitsTotal, totalInputUnits) : "";

  return {
    totalBatchKg, plannedLakh,
    gran, granLakh, granYield,
    comp, compLakh, compYield,
    coated, coreWt, coatGainPct, expectedCoatedWt, actualCoatedWt,
    coat: coated ? coat : "NA", coatLakh: coated ? coatLakh : "NA", coatYield,
    packedLakhTotal, packedUnitsTotal, dispatchLakhTotal, dispatchUnitsTotal,
    finalYield, linkedCount: linked.length, linked,
    qaStatus: mbRaw.qaStatus || "Pending",
  };
}

function computeMB_Capsule(mbRaw, commercialBatches) {
  const fillWt = parseFloat(mbRaw.fillWtMg);
  const shellWt = parseFloat(mbRaw.shellWtMg);
  const avgFilledCapWt = isFinite(fillWt) && isFinite(shellWt) ? round2(fillWt + shellWt) : parseFloat(mbRaw.avgUnitWt);
  const plannedLakhInput = parseFloat(mbRaw.plannedLakhUnits);
  let batchWt = parseFloat(mbRaw.plannedBatchWt);

  if (isFinite(plannedLakhInput) && fillWt && !batchWt) {
    batchWt = (plannedLakhInput * 100000 * fillWt) / 1000000;
  }
  const totalBatchKg = isFinite(batchWt) ? round2(batchWt) : "";
  const plannedLakh = isFinite(plannedLakhInput) ? plannedLakhInput : (totalBatchKg !== "" && fillWt ? lakhUnitsFromKg(totalBatchKg, fillWt) : "");

  const gran = parseFloat(mbRaw.granOutput);
  const granLakh = isFinite(gran) && fillWt ? lakhUnitsFromKg(gran, fillWt) : "";
  const granYield = isFinite(gran) && totalBatchKg !== "" ? pct(gran, totalBatchKg) : "";

  const comp = parseFloat(mbRaw.compOutput);
  const compLakh = isFinite(comp) && avgFilledCapWt ? lakhUnitsFromKg(comp, avgFilledCapWt) : "";
  const compYield = isFinite(comp) && totalBatchKg !== "" ? pct(comp, totalBatchKg) : "";

  const linked = commercialBatches.filter((cb) => cb.mbId === mbRaw.id);
  const packedLakhTotal = round2(linked.reduce((sum, cb) => sum + (parseFloat(cb.packedQty) || 0) / 100000, 0));
  const dispatchLakhTotal = round2(linked.reduce((sum, cb) => sum + (parseFloat(cb.dispatchQty) || 0) / 100000, 0));
  const dispatchUnitsTotal = linked.reduce((sum, cb) => sum + (parseFloat(cb.dispatchQty) || 0), 0);

  const totalInputUnits = plannedLakh * 100000;
  const finalYield = totalInputUnits > 0 && dispatchUnitsTotal > 0 ? pct(dispatchUnitsTotal, totalInputUnits) : "";

  return {
    fillWt, shellWt, avgFilledCapWt, totalBatchKg, plannedLakh,
    gran, granLakh, granYield,
    comp, compLakh, compYield,
    coat: "NA", coatYield: "NA",
    packedLakhTotal, dispatchLakhTotal, dispatchUnitsTotal,
    finalYield, linkedCount: linked.length, linked,
    qaStatus: mbRaw.qaStatus || "Pending",
  };
}

function computeMB_OrsOintment(mbRaw, commercialBatches) {
  const plannedQty = parseFloat(mbRaw.plannedQty);
  const plannedLakh = isFinite(plannedQty) ? lakhFromUnits(plannedQty) : "";
  const mixOutputKg = parseFloat(mbRaw.mixOutputKg);

  const fillQty = parseFloat(mbRaw.fillOutputQty);
  const fillLakh = isFinite(fillQty) ? lakhFromUnits(fillQty) : "";
  const fillYield = isFinite(fillQty) && plannedQty ? pct(fillQty, plannedQty) : "";

  const linked = commercialBatches.filter((cb) => cb.mbId === mbRaw.id);
  const packedLakhTotal = round2(linked.reduce((sum, cb) => sum + (parseFloat(cb.packedQty) || 0) / 100000, 0));
  const dispatchLakhTotal = round2(linked.reduce((sum, cb) => sum + (parseFloat(cb.dispatchQty) || 0) / 100000, 0));
  const dispatchUnitsTotal = linked.reduce((sum, cb) => sum + (parseFloat(cb.dispatchQty) || 0), 0);

  const finalYield = plannedQty > 0 && dispatchUnitsTotal > 0 ? pct(dispatchUnitsTotal, plannedQty) : "";

  return {
    plannedQty, plannedLakh, mixOutputKg, totalBatchKg: mixOutputKg,
    gran: mixOutputKg, granYield: 100, comp: fillQty, compYield: fillYield, coat: "NA", coatYield: "NA",
    fillQty, fillLakh, fillYield,
    packedLakhTotal, dispatchLakhTotal, dispatchUnitsTotal,
    finalYield, linkedCount: linked.length, linked,
    qaStatus: mbRaw.qaStatus || "Pending",
  };
}

function computeMB(mbRaw, commercialBatches) {
  if (mbRaw.dept === "capsule") return computeMB_Capsule(mbRaw, commercialBatches);
  if (mbRaw.dept === "ors" || mbRaw.dept === "ointment") return computeMB_OrsOintment(mbRaw, commercialBatches);
  return computeMB_Tablet(mbRaw, commercialBatches);
}

function computeCB(cbRaw, motherBatches) {
  const mb = motherBatches.find((m) => m.id === cbRaw.mbId);

  const unitsRecv = parseFloat(cbRaw.unitsReceived) || 0;
  const packed = parseFloat(cbRaw.packedQty) || 0;
  const dispatch = parseFloat(cbRaw.dispatchQty) || 0;
  const rejected = parseFloat(cbRaw.rejectedUnits) || 0;
  const rrGen = parseFloat(cbRaw.rrGeneratedUnits) || 0;

  const effectiveLossUnits = Math.max(0, unitsRecv - (packed + rrGen));
  
  const pkgYield = unitsRecv > 0 ? pct(packed + rrGen, unitsRecv) : "";
  const dispatchYield = packed > 0 ? pct(dispatch, packed) : "";
  const finalYield = unitsRecv > 0 ? pct(dispatch, unitsRecv) : "";

  const recvLakh = isFinite(unitsRecv) ? lakhFromUnits(unitsRecv) : "";
  const packedLakh = isFinite(packed) ? lakhFromUnits(packed) : "";
  const dispatchLakh = isFinite(dispatch) ? lakhFromUnits(dispatch) : "";
  const rrGenLakh = isFinite(rrGen) ? lakhFromUnits(rrGen) : "";

  return { mb, unitsRecv, recvLakh, packed, packedLakh, dispatch, dispatchLakh, rejected, rrGen, rrGenLakh, effectiveLossUnits, pkgYield, dispatchYield, finalYield };
}

const DEPT_PREFIX = { tablet: "TB", capsule: "CP", ors: "OR", ointment: "OT" };
const genMBId = (existing, dept) => {
  const prefix = "MB-" + DEPT_PREFIX[dept];
  const nums = existing
    .filter((m) => m.dept === dept)
    .map((m) => parseInt((m.id || "").split("-").pop(), 10))
    .filter((n) => !isNaN(n));
  return prefix + "-" + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
};
const genCBId = (existing, dept) => {
  const prefix = "CB-" + DEPT_PREFIX[dept];
  const nums = existing
    .filter((c) => c.dept === dept)
    .map((c) => parseInt((c.id || "").split("-").pop(), 10))
    .filter((n) => !isNaN(n));
  return prefix + "-" + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
};
const sortNewestFirst = (arr) =>
  [...arr].sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    if (db !== da) return db - da;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) { return d; }
}
function fmtNum(n) {
  if (n === "" || n === undefined || n === null) return "—";
  return Number(n).toLocaleString("en-IN");
}

function BrandHeader({ small }) {
  return (
    <div style={{ textAlign: "center", marginBottom: small ? 20 : 32 }}>
      <img
        src={BRAND_LOGO}
        onError={(e) => {
          const step = parseInt(e.target.dataset.step || "0", 10);
          if (step === 0) {
            e.target.dataset.step = "1";
            e.target.src = "danish_logo.png";
          } else if (step === 1) {
            e.target.dataset.step = "2";
            e.target.src = "assets/danish_logo.jpg";
          } else {
            e.target.onerror = null;
            e.target.src = DEFAULT_LOGO;
          }
        }}
        alt="Danish Healthcare Logo"
        className="brand-header-logo"
        style={{
          marginBottom: 14,
          maxHeight: small ? 48 : 72,
          maxWidth: "320px",
          width: "auto",
          objectFit: "contain",
          background: "#FFFFFF",
          padding: "8px 20px",
          borderRadius: 12,
          boxShadow: "0 4px 18px rgba(0,0,0,0.25)"
        }}
      />
      <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 12.5, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
        DANISH HEALTH CARE (P) LTD. · UJJAIN
      </div>
      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>
        Digital Production Yield Management System (DPYMS v2)
      </div>
    </div>
  );
}

function UniversalActionBar({ onSave, onEdit, onUpdate, onDelete, onBack, isEditing = false }) {
  return (
    <div className="nav-action-bar no-print">
      {onBack && <button type="button" className="btn-nav btn-back" onClick={onBack}>← Back</button>}
      {!isEditing && onSave && <button type="button" className="btn-nav btn-save" onClick={onSave}>💾 Save</button>}
      {!isEditing && onEdit && <button type="button" className="btn-nav btn-edit" onClick={onEdit}>✏️ Edit</button>}
      {isEditing && onUpdate && <button type="button" className="btn-nav btn-update" onClick={onUpdate}>🔄 Update Record</button>}
      {onDelete && <button type="button" className="btn-nav btn-delete" onClick={onDelete}>🗑️ Delete Batch</button>}
    </div>
  );
}

function RolePicker({ onPick }) {
  const roles = [
    { key: "production", label: "Production", desc: "Log & Edit Mother Batches — Granulation, Compression, Coating", icon: "⚗" },
    { key: "qa", label: "Quality Assurance (QA)", desc: "Inspection, Assay, QC Approvals & Status Updates", icon: "🔬" },
    { key: "packaging", label: "Packaging", desc: "Commercial Batches — Packing, Rejections, Dispatch & Yields", icon: "📦" },
    { key: "manager", label: "Manager Dashboard", desc: "Full plant view — unified stage tracking & GMP reports", icon: "◈" },
  ];
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handlePick = async (e) => {
    e.preventDefault();
    const inputPwd = password.trim().toLowerCase();
    const expectedPwd = ROLE_PASSWORDS[selectedRole];
    const hash = await hashPassword(password);

    if (inputPwd === expectedPwd || hash === ROLE_HASHES[selectedRole]) {
      onPick(selectedRole);
    } else {
      setErrorMsg("Incorrect password. Please try again.");
    }
  };

  if (selectedRole) {
    const roleObj = roles.find(r => r.key === selectedRole);
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 55%, ${C.blue} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: FONT_BODY }}>
        <BrandHeader />
        <Card style={{ padding: 24, width: "100%", maxWidth: 380, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: 18, color: C.navy, fontFamily: FONT_DISPLAY }}>Enter Password</h2>
          <p style={{ margin: "0 0 18px 0", fontSize: 13, color: C.sub }}>
            Role: <strong>{roleObj.label}</strong>
          </p>
          <form onSubmit={handlePick}>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter Password"
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.line}`, marginBottom: 14, fontSize: 15 }}
              autoFocus
            />
            {errorMsg && <div style={{ color: C.bad, fontSize: 12.5, marginBottom: 14, fontWeight: 600 }}>{errorMsg}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => { setSelectedRole(null); setErrorMsg(""); setPassword(""); }} style={{ flex: 1, padding: "12px", borderRadius: 8, background: C.white, border: `1px solid ${C.line}`, color: C.sub, cursor: "pointer", fontWeight: "bold" }}>Back</button>
              <button type="submit" style={{ flex: 1, padding: "12px", borderRadius: 8, background: C.navy, color: C.white, border: "none", cursor: "pointer", fontWeight: "bold" }}>Login →</button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 55%, ${C.blue} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: FONT_BODY }}>
      <BrandHeader />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 440 }}>
        {roles.map((r) => (
          <button key={r.key} onClick={() => setSelectedRole(r.key)} style={{ background: C.white, border: "none", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left", boxShadow: "0 4px 18px rgba(0,0,0,0.25)" }}>
            <div style={{ width: 46, height: 46, minWidth: 46, borderRadius: 10, background: C.paleBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{r.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>{r.label}</div>
              <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{r.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 36 }}>Pick your department role to log in</div>
    </div>
  );
}

function DepartmentPicker({ onPick, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: C.paleBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: FONT_BODY }}>
      <img
        src={BRAND_LOGO}
        onError={(e) => {
          const step = parseInt(e.target.dataset.step || "0", 10);
          if (step === 0) {
            e.target.dataset.step = "1";
            e.target.src = "danish_logo.png";
          } else if (step === 1) {
            e.target.dataset.step = "2";
            e.target.src = "assets/danish_logo.jpg";
          } else {
            e.target.onerror = null;
            e.target.src = DEFAULT_LOGO;
          }
        }}
        alt="Danish Healthcare"
        style={{
          maxHeight: 64,
          maxWidth: "300px",
          width: "auto",
          objectFit: "contain",
          marginBottom: 20,
          background: "#FFFFFF",
          padding: "6px 16px",
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(14,42,94,0.08)"
        }}
      />
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.navy }}>Select Product Line</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>Choose manufacturing section for yield logging</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, width: "100%", maxWidth: 480 }}>
        {DEPT_LIST.map((d) => (
          <button key={d.key} onClick={() => onPick(d.key)} style={{ background: C.white, border: `1.5px solid ${C.line}`, borderRadius: 16, padding: "20px 16px", cursor: "pointer", textAlign: "center", boxShadow: "0 4px 14px rgba(14,42,94,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <img
              src={d.imgSrc}
              onError={(e) => {
                const step = parseInt(e.target.dataset.step || "0", 10);
                if (step === 0) {
                  e.target.dataset.step = "1";
                  e.target.src = `${d.key}.jpg`;
                } else if (step === 1) {
                  e.target.dataset.step = "2";
                  e.target.src = `${d.key}_product.png`;
                } else if (step === 2) {
                  e.target.dataset.step = "3";
                  e.target.src = `assets/${d.key}_product.jpg`;
                } else {
                  e.target.onerror = null;
                  if (d.key === "tablet") e.target.src = DEFAULT_TAB;
                  else if (d.key === "capsule") e.target.src = DEFAULT_CAP;
                  else if (d.key === "ors") e.target.src = DEFAULT_ORS;
                  else if (d.key === "ointment") e.target.src = DEFAULT_OINT;
                }
              }}
              alt={d.label}
              className="product-card-img"
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{d.label}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{d.unit}</div>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.sub, fontSize: 12.5, marginTop: 28, cursor: "pointer", fontWeight: 600 }}>← Back to Roles</button>
    </div>
  );
}

function TopBar({ roleLabel, deptLabel, userName, onSwitchRole, onChangeDept, showDeptChange, onManualSync, onForcePush, isSyncing }) {
  return (
    <div style={{ background: C.navy, color: C.white, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexWrap: "wrap", gap: 8 }} className="no-print">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={BRAND_LOGO} onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_LOGO; }} alt="Logo" style={{ height: 32, borderRadius: 4 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, fontFamily: FONT_DISPLAY, display: "flex", alignItems: "center", gap: 8 }}>
            DPYMS v2 · Danish Healthcare
            <span style={{ fontSize: 10, background: isSyncing ? C.warnBg : C.okBg, color: isSyncing ? C.warn : C.ok, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>
              {isSyncing ? "🔄 Syncing..." : "● Multi-Device Live"}
            </span>
          </div>
          <div style={{ fontSize: 10, color: C.skyBlue, letterSpacing: 0.5 }}>
            {roleLabel}{deptLabel ? ` · ${deptLabel}` : ""}{userName ? ` · ${userName}` : ""}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={onForcePush} title="Push all batches on this device to Cloud for other devices" style={{ background: C.okBg, border: `1px solid ${C.ok}`, color: C.ok, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
          ☁️ Push Data to Cloud
        </button>
        <button onClick={onManualSync} title="Fetch latest batches saved on other devices" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", color: C.white, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
          🔄 Sync Cloud Data
        </button>
        {showDeptChange && (
          <button onClick={onChangeDept} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", color: C.white, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
            ← Change Department
          </button>
        )}
        <button onClick={onSwitchRole} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", color: C.white, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
          ← Switch Role
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  let bg = C.line, fg = C.sub;
  if (status === "QA Approved" || status === "Approved") { bg = C.okBg; fg = C.ok; }
  else if (status === "Pending" || status === "On Hold") { bg = C.warnBg; fg = C.warn; }
  else if (status === "QA Rejected" || status === "Rejected") { bg = C.badBg; fg = C.bad; }
  if (!status) return <span style={{ color: C.sub, fontSize: 12 }}>—</span>;
  return <span style={{ background: bg, color: fg, fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{status}</span>;
}

function YieldBadge({ value }) {
  if (value === "" || value === undefined || value === null) return <span style={{ color: C.sub }}>—</span>;
  if (value === "NA") return <span style={{ color: C.sub }}>NA</span>;
  let color = C.ok;
  if (value < 90) color = C.bad; else if (value < 97) color = C.warn;
  return <span style={{ color, fontWeight: 700, fontFamily: FONT_MONO }}>{value}%</span>;
}

function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{hint}</div>}
    </label>
  );
}

const inputStyle = { width: "100%", padding: "11px 12px", fontSize: 15, border: `1.5px solid ${C.line}`, borderRadius: 9, outline: "none", fontFamily: FONT_BODY, color: C.ink, background: C.white, boxSizing: "border-box" };
function TextInput(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function SelectInput({ children, ...props }) { return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{children}</select>; }
function Card({ children, style }) { return <div style={{ background: C.panelBg, borderRadius: 16, border: `1px solid ${C.line}`, boxShadow: "0 1px 3px rgba(14,42,94,0.06)", ...style }}>{children}</div>; }
function PrimaryButton({ children, ...props }) {
  return <button {...props} style={{ background: C.navy, color: C.white, border: "none", borderRadius: 10, padding: "13px 18px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", width: "100%", ...(props.style || {}) }}>{children}</button>;
}
function SecondaryButton({ children, ...props }) {
  return <button {...props} style={{ background: C.white, color: C.navy, border: `1.5px solid ${C.navy}`, borderRadius: 10, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", ...(props.style || {}) }}>{children}</button>;
}
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.navy, color: C.white, padding: "12px 22px", borderRadius: 999, fontSize: 13.5, boxShadow: "0 6px 20px rgba(0,0,0,0.25)", zIndex: 100, display: "flex", alignItems: "center", gap: 8, maxWidth: "90vw", textAlign: "center" }}>
      <span style={{ color: C.skyBlue }}>✓</span> {message}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ color: C.sub, fontSize: 10.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, sub, small, right }) {
  return (
    <div style={{ marginBottom: small ? 12 : 18, marginTop: small ? 26 : 0, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{eyebrow}</div>}
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: small ? 18 : 22, fontWeight: 700, color: C.navy }}>{title}</div>
        {sub && <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.navy : C.white, color: active ? C.white : C.ink,
        border: `1.5px solid ${active ? C.navy : C.line}`, borderRadius: 999,
        padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ============================================================================
// PRODUCTION SCREEN
// ============================================================================
function ProductionScreen({ dept, userName, motherBatches, setMotherBatches, commercialBatches, setCommercialBatches }) {
  const d = (dept && DEPARTMENTS[dept]) || { label: "Plant-Wide", unit: "Units", imgSrc: DEFAULT_LOGO };
  const isTablet = dept === "tablet";
  const isCapsule = dept === "capsule";
  const isOrsOintment = dept === "ors" || dept === "ointment";

  const [viewAllDepts, setViewAllDepts] = useState(false);
  const deptBatches = viewAllDepts ? motherBatches : motherBatches.filter((m) => m.dept === dept);

  const blank = {
    id: "", dept, date: new Date().toISOString().slice(0, 10), genericName: "", productGroup: "",
    avgUnitWt: "", plannedLakhUnits: "", plannedBatchWt: "", rrGran: "0", granOutput: "", compOutput: "", compRR: "0",
    coated: "N", coreAvgWt: "", coatWtGainPct: "", actualCoatedWt: "", coatOutput: "",
    fillWtMg: "", shellWtMg: "",
    plannedQty: "", mixOutputKg: "", fillOutputQty: "",
    remarks: "", loggedBy: userName || "", qaStatus: "Pending",
  };

  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => { setForm(blank); setEditingId(null); }, [dept]); // eslint-disable-line

  const set = (k) => (e) => setForm((f) => {
    const next = { ...f, [k]: e.target.value };
    if (k === "coatWtGainPct" || k === "compOutput" || k === "actualCoatedWt") {
      const comp = parseFloat(next.compOutput);
      const gain = parseFloat(next.coatWtGainPct);
      if (isFinite(comp) && isFinite(gain)) {
        next.coatOutput = round2(comp * (1 + gain / 100));
      }
    }
    return next;
  });

  const previewLakhs = form.plannedLakhUnits ? parseFloat(form.plannedLakhUnits) : "";
  const previewAvgWt = isCapsule ? (parseFloat(form.fillWtMg) || parseFloat(form.avgUnitWt)) : parseFloat(form.avgUnitWt);
  const rrVal = parseFloat(form.rrGran) || 0;
  const rawReqKg = previewLakhs && previewAvgWt ? round2((previewLakhs * 100000 * previewAvgWt) / 1000000) : "";
  const calculatedReqKg = rawReqKg !== "" ? Math.max(0, round2(rawReqKg - rrVal)) : "";

  const saveRecord = async (isUpdate = false) => {
    if (!form.genericName) { setToast("Please enter Generic Product Name"); return; }
    let recordId = form.id;
    if (!recordId) recordId = genMBId(motherBatches, dept);

    const updatedForm = { ...form, id: recordId, createdAt: form.createdAt || Date.now() };

    let updatedList;
    if (isUpdate && editingId) {
      updatedList = motherBatches.map((m) => (m.id === editingId ? updatedForm : m));
    } else {
      updatedList = [updatedForm, ...motherBatches.filter((m) => m.id !== recordId)];
    }

    const sorted = sortNewestFirst(updatedList);
    setMotherBatches(sorted);
    await saveShared("dpyms_mother_batches", sorted);

    setToast(`Mother Batch ${recordId} ${isUpdate ? "updated" : "saved"} & synced to all devices!`);
    if (isUpdate) setEditingId(null);
    setForm({ ...blank, date: new Date().toISOString().slice(0, 10) });
  };

  const deleteBatch = async (mbId) => {
    if (!window.confirm(`Are you sure you want to delete Mother Batch ${mbId}?`)) return;
    const updatedMBs = motherBatches.filter((m) => m.id !== mbId);
    const updatedCBs = commercialBatches.filter((c) => c.mbId !== mbId);
    setMotherBatches(updatedMBs);
    setCommercialBatches(updatedCBs);
    deleteSharedRow("mother_batches", mbId);
    await saveShared("dpyms_mother_batches", updatedMBs);
    await saveShared("dpyms_commercial_batches", updatedCBs);
    if (form.id === mbId || editingId === mbId) { setForm(blank); setEditingId(null); }
    setToast(`Mother Batch ${mbId} deleted`);
  };

  const editBatch = (mb) => { setForm(mb); setEditingId(mb.id); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deptBatches = motherBatches.filter((m) => m.dept === dept);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading eyebrow={`Production · ${d.label}`} title={`${editingId ? "Edit" : "Log"} ${d.label} Mother Batch`} sub="Progressive multi-stage record (Syncs live across all devices)." />

      <UniversalActionBar onSave={() => saveRecord(false)} onEdit={editingId ? null : () => deptBatches[0] && editBatch(deptBatches[0])} onUpdate={() => saveRecord(true)} onDelete={editingId ? () => deleteBatch(editingId) : null} onBack={() => { setForm(blank); setEditingId(null); }} isEditing={!!editingId} />

      <Card style={{ padding: 22, marginBottom: 24 }}>
        {editingId && (
          <div style={{ background: C.warnBg, color: C.warn, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>✏️ Editing Active Batch: {editingId}</span>
            <button type="button" className="btn-nav btn-delete" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => deleteBatch(editingId)}>🗑️ Delete Batch</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Date"><TextInput type="date" value={form.date} onChange={set("date")} /></Field>
          <Field label="Production/QA Officer Name"><TextInput placeholder="Officer Name" value={form.loggedBy} onChange={set("loggedBy")} /></Field>
        </div>

        <Field label="Generic Name of Product">
          <TextInput placeholder={isTablet ? "e.g. Aceclofenac (100 mg) and Paracetamol (325 mg) Tablets" : "e.g. OMEPRAZOLE CAPSULES BP 20 MG"} value={form.genericName} onChange={set("genericName")} />
        </Field>
        <Field label="Product Group / Brand Family">
          <TextInput placeholder="e.g. ALDONIX / ACLONAC GROUP" value={form.productGroup} onChange={set("productGroup")} />
        </Field>

        {isTablet && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Planned Tablets (in Lakhs)"><TextInput type="number" step="0.01" placeholder="e.g. 10.00" value={form.plannedLakhUnits} onChange={set("plannedLakhUnits")} /></Field>
              <Field label="Avg Tablet Wt (mg)"><TextInput type="number" placeholder="e.g. 630" value={form.avgUnitWt} onChange={set("avgUnitWt")} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="RR Added — Granulation (kg)" hint="Reusable RR from previous runs"><TextInput type="number" value={form.rrGran} onChange={set("rrGran")} /></Field>
              <Field label="Planned Batch Wt (kg)" hint={calculatedReqKg !== "" ? `Auto Req (reduced by RR): ${calculatedReqKg} kg` : "Batch size in kg"}>
                <TextInput type="number" placeholder={calculatedReqKg || "e.g. 630.0"} value={form.plannedBatchWt || calculatedReqKg} onChange={set("plannedBatchWt")} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Granulation Output (kg)"><TextInput type="number" value={form.granOutput} onChange={set("granOutput")} /></Field>
              <Field label="Compression Output (kg)"><TextInput type="number" value={form.compOutput} onChange={set("compOutput")} /></Field>
            </div>
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16, marginTop: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Coating Section Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Coated Tablet?">
                  <SelectInput value={form.coated} onChange={set("coated")}>
                    <option value="N">No — Uncoated</option>
                    <option value="Y">Yes — Coated</option>
                  </SelectInput>
                </Field>
                {form.coated === "Y" && (
                  <Field label="Percent Weight Gain (%)" hint="Triggers auto coating output">
                    <TextInput type="number" placeholder="e.g. 1.5" value={form.coatWtGainPct} onChange={set("coatWtGainPct")} />
                  </Field>
                )}
              </div>
              {form.coated === "Y" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Actual Coated Tablet Wt (mg)"><TextInput type="number" placeholder="e.g. 639.45" value={form.actualCoatedWt} onChange={set("actualCoatedWt")} /></Field>
                  <Field label="Coating Output (kg)" hint="Calculated automatically"><TextInput type="number" value={form.coatOutput} onChange={set("coatOutput")} /></Field>
                </div>
              )}
            </div>
          </>
        )}

        {isCapsule && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Planned Capsules (in Lakhs)"><TextInput type="number" placeholder="e.g. 5.00" value={form.plannedLakhUnits} onChange={set("plannedLakhUnits")} /></Field>
              <Field label="Avg Fill Weight (mg)"><TextInput type="number" placeholder="e.g. 250" value={form.fillWtMg} onChange={set("fillWtMg")} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Avg Shell Weight (mg)"><TextInput type="number" placeholder="e.g. 76" value={form.shellWtMg} onChange={set("shellWtMg")} /></Field>
              <Field label="Granulation Output (kg)"><TextInput type="number" value={form.granOutput} onChange={set("granOutput")} /></Field>
            </div>
            <Field label="Filling Output (kg)"><TextInput type="number" value={form.compOutput} onChange={set("compOutput")} /></Field>
          </>
        )}

        {isOrsOintment && (
          <>
            <Field label={`Planned Quantity (${dept === "ors" ? "sachets" : "tubes"})`}><TextInput type="number" placeholder="e.g. 250000" value={form.plannedQty} onChange={set("plannedQty")} /></Field>
            <Field label="Mix Output (kg)"><TextInput type="number" value={form.mixOutputKg} onChange={set("mixOutputKg")} /></Field>
            <Field label={`Fill Output (${dept === "ors" ? "sachets" : "tubes"} filled)`}><TextInput type="number" value={form.fillOutputQty} onChange={set("fillOutputQty")} /></Field>
          </>
        )}

        <Field label="Remarks / Observations"><TextInput value={form.remarks} onChange={set("remarks")} /></Field>
      </Card>

      <SectionHeading title={viewAllDepts ? `All Plant Mother Batches (${motherBatches.length})` : `Recent ${d.label} Mother Batches (${deptBatches.length})`} small />
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <FilterChip active={!viewAllDepts} onClick={() => setViewAllDepts(false)} label={`Current Section (${d.label})`} />
        <FilterChip active={viewAllDepts} onClick={() => setViewAllDepts(true)} label={`🌐 View All Plant Lines (${motherBatches.length} Batches)`} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {deptBatches.map((mb) => {
          const calc = computeMB(mb, commercialBatches);
          return (
            <Card key={mb.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{mb.id} · {mb.genericName || "Untitled"}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    {fmtDate(mb.date)}{mb.loggedBy ? ` · Officer: ${mb.loggedBy}` : ""} · Planned: <b>{calc.plannedLakh ? `${calc.plannedLakh} Lacs` : "—"}</b> ({calc.totalBatchKg ? `${calc.totalBatchKg} kg` : "—"})
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusPill status={mb.qaStatus || "Pending"} />
                  <button type="button" className="btn-nav btn-edit" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => editBatch(mb)}>✏️ Edit</button>
                  <button type="button" className="btn-nav btn-delete" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => deleteBatch(mb.id)}>🗑️ Delete</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}

// ============================================================================
// QA SCREEN
// ============================================================================
function QaScreen({ dept, userName, motherBatches, setMotherBatches, commercialBatches }) {
  const d = (dept && DEPARTMENTS[dept]) || { label: "Plant-Wide", unit: "Units", imgSrc: DEFAULT_LOGO };
  const [viewAllDepts, setViewAllDepts] = useState(false);
  const deptMBs = viewAllDepts ? motherBatches : motherBatches.filter((m) => m.dept === dept);

  const [selectedMbId, setSelectedMbId] = useState(deptMBs[0]?.id || "");
  const [qaStatus, setQaStatus] = useState("QA Approved");
  const [qaAssay, setQaAssay] = useState("99.8");
  const [qaRemarks, setQaRemarks] = useState("");
  const [toast, setToast] = useState("");

  const selectedMB = motherBatches.find((m) => m.id === selectedMbId);
  const calc = selectedMB ? computeMB(selectedMB, commercialBatches) : null;

  const saveQaApproval = async () => {
    if (!selectedMB) return;
    const updatedMBs = motherBatches.map((m) => m.id === selectedMbId ? { ...m, qaStatus, qaAssay, qaRemarks, qaInspector: userName || "Production/QA Officer" } : m);
    setMotherBatches(updatedMBs);
    await saveShared("dpyms_mother_batches", updatedMBs);
    setToast(`QA decision for ${selectedMbId} saved as ${qaStatus} & synced to all devices!`);
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading eyebrow={`Quality Assurance · ${d.label}`} title="QA Inspection & Quality Clearance" sub="Review yield statistics and sign off on batch quality." />

      <UniversalActionBar onSave={saveQaApproval} onUpdate={saveQaApproval} />

      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <FilterChip active={!viewAllDepts} onClick={() => setViewAllDepts(false)} label={`Current Section (${d.label})`} />
          <FilterChip active={viewAllDepts} onClick={() => setViewAllDepts(true)} label={`🌐 View All Plant Batches (${motherBatches.length})`} />
        </div>
        <Field label="Select Mother Batch for QA Clearance">
          <SelectInput value={selectedMbId} onChange={(e) => setSelectedMbId(e.target.value)}>
            {deptMBs.map((m) => <option key={m.id} value={m.id}>{m.id} — {m.genericName} (Status: {m.qaStatus || "Pending"})</option>)}
          </SelectInput>
        </Field>

        {selectedMB && calc && (
          <div style={{ background: C.paleBg, borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.navy, marginBottom: 10 }}>Batch Yield Summary — {selectedMB.id}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, fontSize: 13 }}>
              <div><b>Planned:</b> {calc.plannedLakh} Lacs ({calc.totalBatchKg} kg)</div>
              <div><b>Gran Yield:</b> <YieldBadge value={calc.granYield} /></div>
              <div><b>Comp Yield:</b> <YieldBadge value={calc.compYield} /></div>
              <div><b>Coat Yield:</b> <YieldBadge value={calc.coatYield} /></div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="QA Decision Status">
            <SelectInput value={qaStatus} onChange={(e) => setQaStatus(e.target.value)}>
              <option value="QA Approved">QA Approved</option>
              <option value="Pending">Pending Inspection</option>
              <option value="QA Rejected">QA Rejected</option>
              <option value="On Hold">On Hold</option>
            </SelectInput>
          </Field>
          <Field label="Assay / Potency (%)"><TextInput value={qaAssay} onChange={(e) => setQaAssay(e.target.value)} /></Field>
        </div>
        <Field label="QA Inspection Remarks"><TextInput value={qaRemarks} onChange={(e) => setQaRemarks(e.target.value)} /></Field>

        <PrimaryButton onClick={saveQaApproval}>Save QA Clearance</PrimaryButton>
      </Card>
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}

// ============================================================================
// PACKAGING SCREEN
// ============================================================================
function PackagingScreen({ dept, userName, setUserName, motherBatches, commercialBatches, setCommercialBatches }) {
  const d = (dept && DEPARTMENTS[dept]) || { label: "Plant-Wide", unit: "Units", imgSrc: DEFAULT_LOGO };
  const deptMBs = dept ? motherBatches.filter((m) => m.dept === dept) : motherBatches;

  const [mbId, setMbId] = useState(deptMBs[0]?.id || "");
  useEffect(() => { if (!mbId && deptMBs[0]) setMbId(deptMBs[0].id); }, [deptMBs]); // eslint-disable-line

  const selectedMB = motherBatches.find((m) => m.id === mbId);
  const selectedMBCalc = selectedMB ? computeMB(selectedMB, commercialBatches) : null;
  const totalMotherUnits = selectedMBCalc ? (parseFloat(selectedMBCalc.plannedLakh) * 100000 || 0) : 0;

  const [splitCount, setSplitCount] = useState(1);
  const [splitRows, setSplitRows] = useState([{ productName: "", batchNumber: "" }]);
  const [showSplitSetup, setShowSplitSetup] = useState(true);
  const [editingCbId, setEditingCbId] = useState(null);

  const detailBlank = { unitsReceived: "", packedQty: "", dispatchQty: "", rejectedUnits: "0", rrGeneratedUnits: "0", remarks: "" };
  const [details, setDetails] = useState({});
  const [toast, setToast] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const applySplitCount = (n) => {
    const count = Math.max(1, Math.min(20, parseInt(n, 10) || 1));
    setSplitCount(count);
    setSplitRows((prev) => {
      const next = [...prev];
      while (next.length < count) next.push({ productName: "", batchNumber: "" });
      return next.slice(0, count);
    });
  };

  const startDetailEntry = () => {
    if (splitRows.some((r) => !r.productName || !r.batchNumber)) {
      setToast("Please name every commercial batch before continuing");
      return;
    }
    const init = {};
    splitRows.forEach((r, i) => { init[i] = { ...detailBlank }; });
    setDetails(init);
    setShowSplitSetup(false);
  };

  const setDetail = (i, k) => (e) => setDetails((prev) => ({ ...prev, [i]: { ...prev[i], [k]: e.target.value } }));

  const saveAll = async () => {
    if (!mbId) { setToast("Select a Mother Batch first"); return; }

    const requestedTotal = splitRows.reduce((sum, _, i) => sum + (parseFloat(details[i]?.unitsReceived) || 0), 0);
    const existingOtherAllocated = commercialBatches
      .filter((c) => c.mbId === mbId && c.id !== editingCbId)
      .reduce((sum, c) => sum + (parseFloat(c.unitsReceived) || 0), 0);

    if (totalMotherUnits > 0 && (existingOtherAllocated + requestedTotal > totalMotherUnits)) {
      const available = Math.max(0, totalMotherUnits - existingOtherAllocated);
      setToast(`Over-allocation blocked! Remaining available balance: ${lakhFromUnits(available)} Lacs (${available} units)`);
      return;
    }

    let running = [...commercialBatches];
    const finalRecords = [];

    splitRows.forEach((r, i) => {
      const id = editingCbId || genCBId(running, dept);
      const rec = {
        id, dept, mbId, date, loggedBy: userName || "Packaging Officer",
        productName: r.productName, batchNumber: r.batchNumber,
        ...details[i],
        createdAt: Date.now(),
      };
      finalRecords.push(rec);
      running = [rec, ...running.filter((c) => c.id !== id)];
    });

    const updated = sortNewestFirst([...finalRecords, ...commercialBatches.filter((c) => !finalRecords.some((f) => f.id === c.id))]);
    setCommercialBatches(updated);
    await saveShared("dpyms_commercial_batches", updated);

    setToast(`Commercial batch saved & synced to all devices!`);
    setSplitCount(1);
    setSplitRows([{ productName: "", batchNumber: "" }]);
    setDetails({});
    setEditingCbId(null);
    setShowSplitSetup(true);
  };

  const editCB = (cb) => {
    setEditingCbId(cb.id);
    setMbId(cb.mbId);
    setDate(cb.date);
    setSplitCount(1);
    setSplitRows([{ productName: cb.productName, batchNumber: cb.batchNumber }]);
    setDetails({ 0: { unitsReceived: cb.unitsReceived, packedQty: cb.packedQty, dispatchQty: cb.dispatchQty, rejectedUnits: cb.rejectedUnits, rrGeneratedUnits: cb.rrGeneratedUnits || "0" } });
    setShowSplitSetup(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteCB = async (cbId) => {
    if (!window.confirm(`Delete Commercial Batch ${cbId}?`)) return;
    const updatedCBs = commercialBatches.filter((c) => c.id !== cbId);
    setCommercialBatches(updatedCBs);
    deleteSharedRow("commercial_batches", cbId);
    await saveShared("dpyms_commercial_batches", updatedCBs);
    setToast(`Commercial Batch ${cbId} deleted`);
  };

  const deptCBs = commercialBatches.filter((c) => c.dept === dept);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading eyebrow={`Packaging · ${d.label}`} title="Log Commercial Batches & Packaging Yields" sub="Track Units Received, Packed, Dispatched & Yields (Syncs live across devices)." />

      <UniversalActionBar onSave={saveAll} onBack={() => { setShowSplitSetup(true); setEditingCbId(null); }} />

      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Packaging Officer Name"><TextInput placeholder="Officer Name" value={userName} onChange={(e) => setUserName(e.target.value)} /></Field>
        </div>

        <Field label="Mother Batch ID (Parent Batch)" hint={selectedMB ? `Generic: ${selectedMB.genericName} (${selectedMBCalc?.plannedLakh || "?"} Lacs)` : ""}>
          <SelectInput value={mbId} onChange={(e) => setMbId(e.target.value)}>
            {deptMBs.map((mb) => <option key={mb.id} value={mb.id}>{mb.id} — {mb.genericName || "Untitled"}</option>)}
          </SelectInput>
        </Field>

        {showSplitSetup ? (
          <>
            <Field label="Number of Brand Splits"><TextInput type="number" min="1" max="20" value={splitCount} onChange={(e) => applySplitCount(e.target.value)} /></Field>
            {splitRows.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: C.paleBg, padding: 12, borderRadius: 10, marginBottom: 12 }}>
                <Field label={`Split ${i + 1} — Brand Name`}><TextInput placeholder="e.g. ALDONIX-P" value={row.productName} onChange={(e) => setSplitRows((prev) => prev.map((r, j) => j === i ? { ...r, productName: e.target.value } : r))} /></Field>
                <Field label={`Split ${i + 1} — Batch Number`}><TextInput placeholder="e.g. LPX26001" value={row.batchNumber} onChange={(e) => setSplitRows((prev) => prev.map((r, j) => j === i ? { ...r, batchNumber: e.target.value } : r))} /></Field>
              </div>
            ))}
            <PrimaryButton onClick={startDetailEntry}>Continue to Yield Entry →</PrimaryButton>
          </>
        ) : (
          <>
            {splitRows.map((row, i) => {
              const det = details[i] || {};

              return (
                <Card key={i} style={{ padding: 16, background: C.paleBg, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", marginBottom: 6 }}>
                    Belongs to Mother Batch: {mbId}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 12 }}>
                    Brand Name: {row.productName} <span style={{ color: C.sub, fontWeight: 400 }}>· Batch #{row.batchNumber}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Units Received (Batch Size)"><TextInput type="number" placeholder="e.g. 400000 (4.00 Lacs)" value={det.unitsReceived || ""} onChange={setDetail(i, "unitsReceived")} /></Field>
                    <Field label="Units Packed"><TextInput type="number" placeholder="e.g. 397600 (3.976 Lacs)" value={det.packedQty || ""} onChange={setDetail(i, "packedQty")} /></Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Units Dispatched"><TextInput type="number" placeholder="e.g. 396000 (3.96 Lacs)" value={det.dispatchQty || ""} onChange={setDetail(i, "dispatchQty")} /></Field>
                    <Field label="Rejected Units"><TextInput type="number" value={det.rejectedUnits || "0"} onChange={setDetail(i, "rejectedUnits")} /></Field>
                  </div>

                  <Field label="RR Generated / Retained for Future Batches (Units)" hint="Extra good loose tablets saved for reuse — NOT counted as loss!">
                    <TextInput type="number" placeholder="e.g. 800 (Saved for next batch)" value={det.rrGeneratedUnits || "0"} onChange={setDetail(i, "rrGeneratedUnits")} />
                  </Field>
                </Card>
              );
            })}
            <div style={{ display: "flex", gap: 10 }}>
              <SecondaryButton onClick={() => setShowSplitSetup(true)} style={{ flex: 1 }}>← Back</SecondaryButton>
              <PrimaryButton onClick={saveAll} style={{ flex: 2 }}>{editingCbId ? "Update Commercial Record" : "Save Packaging Records"}</PrimaryButton>
            </div>
          </>
        )}
      </Card>

      <SectionHeading title="Commercial Batch Register" small />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {deptCBs.map((cb) => {
          const calc = computeCB(cb, motherBatches);
          return (
            <Card key={cb.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{cb.id} · {cb.productName} <span style={{ color: C.sub }}>(MB: {cb.mbId})</span></div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    Batch #{cb.batchNumber} · Recv: {cb.unitsReceived} ({calc.recvLakh} Lacs) · Packed: {cb.packedQty} ({calc.packedLakh} Lacs) · RR Retained: <b>{calc.rrGen} units</b>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <YieldBadge value={calc.pkgYield} />
                  <button type="button" className="btn-nav btn-edit" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => editCB(cb)}>✏️ Edit</button>
                  <button type="button" className="btn-nav btn-delete" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => deleteCB(cb.id)}>🗑️ Delete</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}

// ============================================================================
// MANAGER DASHBOARD
// ============================================================================
function ManagerScreen({ motherBatches, setMotherBatches, commercialBatches, setCommercialBatches }) {
  const [activeTab, setActiveTab] = useState("mother");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadSamplePlantData = async () => {
    setMotherBatches(SAMPLE_MOTHER_BATCHES);
    setCommercialBatches(SAMPLE_COMMERCIAL_BATCHES);
    await saveShared("dpyms_mother_batches", SAMPLE_MOTHER_BATCHES);
    await saveShared("dpyms_commercial_batches", SAMPLE_COMMERCIAL_BATCHES);
  };

  const deleteMB = async (mbId) => {
    if (!window.confirm(`Delete Mother Batch ${mbId}?`)) return;
    const updatedMBs = motherBatches.filter((m) => m.id !== mbId);
    const updatedCBs = commercialBatches.filter((c) => c.mbId !== mbId);
    setMotherBatches(updatedMBs);
    setCommercialBatches(updatedCBs);
    deleteSharedRow("mother_batches", mbId);
    await saveShared("dpyms_mother_batches", updatedMBs);
    await saveShared("dpyms_commercial_batches", updatedCBs);
  };

  const deleteCB = async (cbId) => {
    if (!window.confirm(`Delete Commercial Batch ${cbId}?`)) return;
    const updatedCBs = commercialBatches.filter((c) => c.id !== cbId);
    setCommercialBatches(updatedCBs);
    deleteSharedRow("commercial_batches", cbId);
    await saveShared("dpyms_commercial_batches", updatedCBs);
  };

  const filteredMBs = deptFilter === "all" ? motherBatches : motherBatches.filter((m) => m.dept === deptFilter);
  const filteredCBs = deptFilter === "all" ? commercialBatches : commercialBatches.filter((c) => c.dept === deptFilter);

  const mbRows = filteredMBs.map((mb) => ({ mb, calc: computeMB(mb, commercialBatches), linkedCBs: commercialBatches.filter((c) => c.mbId === mb.id) }))
    .filter(({ mb }) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return mb.id.toLowerCase().includes(s) || (mb.genericName || "").toLowerCase().includes(s);
    });

  const cbRows = filteredCBs.map((cb) => ({ cb, calc: computeCB(cb, motherBatches) }));

  const totals = useMemo(() => {
    const cbInScope = deptFilter === "all" ? commercialBatches : commercialBatches.filter((c) => c.dept === deptFilter);
    const pendingQA = mbRows.filter((r) => r.mb.qaStatus === "Pending" || !r.mb.qaStatus).length;
    const approvedQA = mbRows.filter((r) => r.mb.qaStatus === "QA Approved").length;
    
    const totalPlannedLakhs = round2(mbRows.reduce((sum, r) => sum + (parseFloat(r.calc.plannedLakh) || 0), 0));
    const totalPlannedKg = round2(mbRows.reduce((sum, r) => sum + (parseFloat(r.calc.totalBatchKg) || 0), 0));

    const totalDispatchedUnits = cbInScope.reduce((sum, c) => sum + (parseFloat(c.dispatchQty) || 0), 0);
    const totalDispatchedLakhs = round2(totalDispatchedUnits / 100000);

    return { pendingQA, approvedQA, totalPlannedLakhs, totalPlannedKg, totalDispatchedUnits, totalDispatchedLakhs, batches: filteredMBs.length, splits: cbInScope.length };
  }, [mbRows, commercialBatches, filteredMBs, deptFilter]);

  const byDept = DEPT_LIST.map((d) => {
    const mbs = motherBatches.filter((m) => m.dept === d.key);
    const cbs = commercialBatches.filter((c) => c.dept === d.key);
    const deptLakhs = round2(mbs.reduce((sum, m) => sum + (parseFloat(computeMB(m, commercialBatches).plannedLakh) || 0), 0));
    const deptKg = round2(mbs.reduce((sum, m) => sum + (parseFloat(computeMB(m, commercialBatches).totalBatchKg) || 0), 0));
    return { ...d, count: mbs.length, splits: cbs.length, deptLakhs, deptKg };
  });

  const exportCSVReport = () => {
    let headers, exportData, filename;
    if (activeTab === "mother") {
      filename = `DPYMS_Mother_Batches_Register_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        { key: "date", label: "Date" },
        { key: "id", label: "MB ID" },
        { key: "dept", label: "Department" },
        { key: "genericName", label: "Generic Name of Product" },
        { key: "productGroup", label: "Product Group" },
        { key: "plannedKg", label: "Planned Batch (Kg)" },
        { key: "plannedLakh", label: "Planned Batch (Lacs)" },
        { key: "granYield", label: "Granulation Yield %" },
        { key: "compYield", label: "Compression Yield %" },
        { key: "coatYield", label: "Coating Yield %" },
        { key: "finalYield", label: "Final Production Yield %" },
        { key: "qaStatus", label: "QA Status" },
        { key: "remarks", label: "Remarks" }
      ];
      exportData = mbRows.map(({ mb, calc }) => ({
        date: mb.date || "",
        id: mb.id || "",
        dept: (mb.dept || "").toUpperCase(),
        genericName: mb.genericName || "",
        productGroup: mb.productGroup || "",
        plannedKg: calc.totalBatchKg || "",
        plannedLakh: calc.plannedLakh || "",
        granYield: calc.granYield ? `${calc.granYield}%` : "N/A",
        compYield: calc.compYield ? `${calc.compYield}%` : "N/A",
        coatYield: calc.coatYield ? `${calc.coatYield}%` : "N/A",
        finalYield: calc.finalYield ? `${calc.finalYield}%` : "N/A",
        qaStatus: mb.qaStatus || "Pending",
        remarks: mb.remarks || ""
      }));
    } else {
      filename = `DPYMS_Commercial_Batches_Register_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        { key: "date", label: "Date" },
        { key: "id", label: "CB ID" },
        { key: "mbId", label: "Linked MB ID" },
        { key: "productName", label: "Brand Name" },
        { key: "batchNumber", label: "Commercial Batch #" },
        { key: "unitsReceived", label: "Units Received" },
        { key: "packedQty", label: "Packed Units" },
        { key: "rrGen", label: "RR Retained Units (Saved)" },
        { key: "dispatchQty", label: "Dispatch Units" },
        { key: "rejectedUnits", label: "Rejected Units" },
        { key: "pkgYield", label: "Packaging Yield %" },
        { key: "dispatchYield", label: "Dispatch Yield %" }
      ];
      exportData = cbRows.map(({ cb, calc }) => ({
        date: cb.date || "",
        id: cb.id || "",
        mbId: cb.mbId || "",
        productName: cb.productName || "",
        batchNumber: cb.batchNumber || "",
        unitsReceived: cb.unitsReceived || "0",
        packedQty: cb.packedQty || "0",
        rrGen: calc.rrGen || "0",
        dispatchQty: cb.dispatchQty || "0",
        rejectedUnits: cb.rejectedUnits || "0",
        pkgYield: calc.pkgYield ? `${calc.pkgYield}%` : "N/A",
        dispatchYield: calc.dispatchYield ? `${calc.dispatchYield}%` : "N/A"
      }));
    }
    downloadCSV(filename, toCSV(exportData, headers));
  };

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading
        eyebrow="MANAGER DASHBOARD"
        title="Plant-Wide Manufacturing & Yield Overview"
        sub="Mother Batch Multi-stage Analytics & Full Commercial Batch Yield Calculations."
        right={
          <div style={{ display: "flex", gap: 10 }}>
            {motherBatches.length === 0 && <SecondaryButton onClick={loadSamplePlantData}>🧪 Load Sample Plant Data</SecondaryButton>}
            <SecondaryButton onClick={exportCSVReport}>⬇ Export CSV Report</SecondaryButton>
            <PrimaryButton onClick={() => window.print()} style={{ width: "auto" }}>🖨️ Print GMP Report</PrimaryButton>
          </div>
        }
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }} className="no-print">
        <button
          onClick={() => setActiveTab("mother")}
          style={{
            flex: 1, padding: "14px 20px", borderRadius: 12, border: `1.5px solid ${C.navy}`,
            background: activeTab === "mother" ? C.navy : C.white,
            color: activeTab === "mother" ? C.white : C.navy,
            fontWeight: 700, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: activeTab === "mother" ? "0 4px 12px rgba(14,42,94,0.15)" : "none"
          }}
        >
          📊 Mother Batches Overview ({filteredMBs.length})
        </button>
        <button
          onClick={() => setActiveTab("commercial")}
          style={{
            flex: 1, padding: "14px 20px", borderRadius: 12, border: `1.5px solid ${C.navy}`,
            background: activeTab === "commercial" ? C.navy : C.white,
            color: activeTab === "commercial" ? C.white : C.navy,
            fontWeight: 700, fontSize: 14.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: activeTab === "commercial" ? "0 4px 12px rgba(14,42,94,0.15)" : "none"
          }}
        >
          📦 Commercial Batches & Yields ({filteredCBs.length})
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }} className="no-print">
        <FilterChip active={deptFilter === "all"} onClick={() => setDeptFilter("all")} label="All Product Lines" />
        {DEPT_LIST.map((d) => (
          <FilterChip key={d.key} active={deptFilter === d.key} onClick={() => setDeptFilter(d.key)} label={`${d.label}`} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 22 }} className="no-print">
        <Card style={{ padding: "16px" }}>
          <Stat label="MOTHER BATCHES" value={totals.batches} />
        </Card>
        <Card style={{ padding: "16px" }}>
          <Stat label="TOTAL PLANNED PRODUCTION" value={`${totals.totalPlannedLakhs} Lakhs (${totals.totalPlannedKg} kg)`} />
        </Card>
        <Card style={{ padding: "16px" }}>
          <Stat label="TOTAL DISPATCHED UNITS" value={`${totals.totalDispatchedLakhs} Lakhs (${fmtNum(totals.totalDispatchedUnits)})`} />
        </Card>
        <Card style={{ padding: "16px" }}>
          <Stat label="QA APPROVED BATCHES" value={totals.approvedQA} />
        </Card>
        <Card style={{ padding: "16px" }}>
          <Stat label="PENDING QA CLEARANCE" value={totals.pendingQA} />
        </Card>
      </div>

      {deptFilter === "all" && (
        <div style={{ marginBottom: 26 }} className="no-print">
          <SectionHeading title="Department Production Summaries (Kg & Lakhs)" small />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {byDept.map((d) => (
              <Card key={d.key} style={{ padding: "18px 16px", cursor: "pointer" }} onClick={() => setDeptFilter(d.key)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <img src={d.imgSrc} alt={d.label} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>{d.label}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{d.count} mother · {d.splits} commercial</div>
                  </div>
                </div>
                <div style={{ background: C.paleBg, padding: "8px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: C.navy }}>
                  Planned: {d.deptLakhs ? `${d.deptLakhs} Lakhs` : "0 Lakhs"} {d.deptKg ? `(${d.deptKg} kg)` : "(0 kg)"}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card style={{ padding: 16, marginBottom: 20 }} className="no-print">
        <Field label="Search Register / Batches"><TextInput placeholder="Search MB ID, Generic Name, Brand..." value={search} onChange={(e) => setSearch(e.target.value)} /></Field>
      </Card>

      {/* Unified Platform Overview Table */}
      {activeTab === "mother" ? (
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.line}`, padding: 24, overflowX: "auto" }}>
          <div className="print-header print-only">
            <img src={BRAND_LOGO} alt="Danish Healthcare" />
            <div className="print-header-title">
              <h1>DANISH HEALTH CARE (P) LTD.</h1>
              <p>INDUSTRIAL AREA, UJJAIN (M.P.) · GMP CERTIFIED MANUFACTURING FACILITY</p>
              <p>OFFICIAL MOTHER BATCHES PROGRESSIVE YIELD REGISTER — Printed: {new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${C.navy}`, paddingBottom: 14, marginBottom: 16 }} className="no-print">
            <img src={BRAND_LOGO} alt="Danish Healthcare" style={{ height: 44 }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: FONT_DISPLAY }}>DANISH HEALTH CARE (P) LTD.</div>
              <div style={{ fontSize: 11, color: C.blue, fontWeight: 700 }}>UNIFIED PLANT REGISTER & PROGRESSIVE YIELD REPORT</div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "center" }}>
            <thead>
              <tr style={{ background: C.navy, color: C.white, fontSize: 11.5 }}>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>Date</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>MB ID</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}`, minWidth: 160 }}>Generic Name of Product</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>Planned</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>Gran. Output (%)</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>Comp. Output (%)</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>Coating Output (%)</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}`, minWidth: 150 }}>Mother batches splits into Brand Name</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>Batch Size</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>Pack. yield</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>Dispatch Yield</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }}>Final yield</th>
                <th style={{ padding: 10, border: `1px solid ${C.navy2}` }} className="no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {mbRows.length === 0 && (
                <tr>
                  <td colSpan="13" style={{ padding: 30 }}><EmptyNote text="No batch records found." /></td>
                </tr>
              )}
              {mbRows.map(({ mb, calc, linkedCBs }) => {
                const splitRowsCount = Math.max(1, linkedCBs.length);

                return (
                  <React.Fragment key={mb.id}>
                    {splitRowsCount === 1 ? (
                      <tr style={{ borderBottom: `1px solid ${C.line}`, background: C.white }}>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }}>{fmtDate(mb.date)}</td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}`, fontWeight: 700, color: C.navy }}>{mb.id}</td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}`, textAlign: "left" }}><b>{mb.genericName}</b></td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }}>
                          <div><b>{mb.plannedBatchWt ? `${mb.plannedBatchWt} kg` : "—"}</b></div>
                          <div>{calc.plannedLakh} lacs</div>
                        </td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }}>
                          <div>{mb.granOutput ? `${mb.granOutput} kg` : "—"}</div>
                          <div>{calc.granLakh} lacs</div>
                          <div style={{ color: C.ok, fontWeight: 700 }}>({calc.granYield}%)</div>
                        </td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }}>
                          <div>{mb.compOutput ? `${mb.compOutput} kg` : "—"}</div>
                          <div>{calc.compLakh} lacs</div>
                          <div style={{ color: C.ok, fontWeight: 700 }}>({calc.compYield}%)</div>
                        </td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }}>
                          {calc.coat === "NA" ? "NA" : (
                            <>
                              <div>{mb.coatOutput ? `${mb.coatOutput} kg` : "—"}</div>
                              <div>{calc.coatLakh} lacs</div>
                              <div style={{ color: C.ok, fontWeight: 700 }}>({calc.coatYield}%)</div>
                            </>
                          )}
                        </td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }}>
                          {linkedCBs[0] ? `${linkedCBs[0].productName} (${linkedCBs[0].batchNumber})` : "—"}
                        </td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }}>
                          {linkedCBs[0] ? `${lakhFromUnits(linkedCBs[0].unitsReceived)} LACS` : "—"}
                        </td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }}>
                          {linkedCBs[0] ? `${computeCB(linkedCBs[0], [mb]).pkgYield}% (${lakhFromUnits(linkedCBs[0].packedQty)})` : "—"}
                        </td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }}>
                          {linkedCBs[0] ? `${computeCB(linkedCBs[0], [mb]).dispatchYield}% (${lakhFromUnits(linkedCBs[0].dispatchQty)})` : "—"}
                        </td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}`, fontWeight: 700, color: C.ok, fontSize: 13 }}>
                          {calc.finalYield ? `${calc.finalYield}%` : "—"}
                        </td>
                        <td style={{ padding: 10, border: `1px solid ${C.line}` }} className="no-print">
                          <button type="button" className="btn-nav btn-delete" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => deleteMB(mb.id)}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ) : (
                      linkedCBs.map((cb, idx) => {
                        const cbCalc = computeCB(cb, [mb]);
                        const isLastSplit = idx === linkedCBs.length - 1;
                        const splitCellBorder = `1px solid ${C.line}`;

                        return (
                          <tr key={cb.id} style={{ borderBottom: isLastSplit ? `2px solid ${C.navy}` : `1.5px solid ${C.navy}`, background: idx % 2 === 0 ? C.white : C.paleBg }}>
                            {idx === 0 && (
                              <>
                                <td rowSpan={linkedCBs.length} style={{ padding: 10, border: splitCellBorder }}>{fmtDate(mb.date)}</td>
                                <td rowSpan={linkedCBs.length} style={{ padding: 10, border: splitCellBorder, fontWeight: 700, color: C.navy }}>{mb.id}</td>
                                <td rowSpan={linkedCBs.length} style={{ padding: 10, border: splitCellBorder, textAlign: "left" }}><b>{mb.genericName}</b></td>
                                <td rowSpan={linkedCBs.length} style={{ padding: 10, border: splitCellBorder }}>
                                  <div><b>{mb.plannedBatchWt ? `${mb.plannedBatchWt} kg` : "—"}</b></div>
                                  <div>{calc.plannedLakh} lacs</div>
                                </td>
                                <td rowSpan={linkedCBs.length} style={{ padding: 10, border: splitCellBorder }}>
                                  <div>{mb.granOutput ? `${mb.granOutput} kg` : "—"}</div>
                                  <div>{calc.granLakh} lacs</div>
                                  <div style={{ color: C.ok, fontWeight: 700 }}>({calc.granYield}%)</div>
                                </td>
                                <td rowSpan={linkedCBs.length} style={{ padding: 10, border: splitCellBorder }}>
                                  <div>{mb.compOutput ? `${mb.compOutput} kg` : "—"}</div>
                                  <div>{calc.compLakh} lacs</div>
                                  <div style={{ color: C.ok, fontWeight: 700 }}>({calc.compYield}%)</div>
                                </td>
                                <td rowSpan={linkedCBs.length} style={{ padding: 10, border: splitCellBorder }}>
                                  {calc.coat === "NA" ? "NA" : (
                                    <>
                                      <div>{mb.coatOutput ? `${mb.coatOutput} kg` : "—"}</div>
                                      <div>{calc.coatLakh} lacs</div>
                                      <div style={{ color: C.ok, fontWeight: 700 }}>({calc.coatYield}%)</div>
                                    </>
                                  )}
                                </td>
                              </>
                            )}
                            <td style={{ padding: 10, border: splitCellBorder, borderBottom: isLastSplit ? splitCellBorder : `1.5px solid ${C.navy}`, fontWeight: 700 }}>
                              {cb.productName} ({cb.batchNumber})
                            </td>
                            <td style={{ padding: 10, border: splitCellBorder, borderBottom: isLastSplit ? splitCellBorder : `1.5px solid ${C.navy}` }}>
                              {lakhFromUnits(cb.unitsReceived)} LACS
                            </td>
                            <td style={{ padding: 10, border: splitCellBorder, borderBottom: isLastSplit ? splitCellBorder : `1.5px solid ${C.navy}` }}>
                              {cbCalc.pkgYield}% ({lakhFromUnits(cb.packedQty)})
                            </td>
                            <td style={{ padding: 10, border: splitCellBorder, borderBottom: isLastSplit ? splitCellBorder : `1.5px solid ${C.navy}` }}>
                              {cbCalc.dispatchYield}% ({lakhFromUnits(cb.dispatchQty)})
                            </td>
                            {idx === 0 && (
                              <>
                                <td rowSpan={linkedCBs.length} style={{ padding: 10, border: splitCellBorder, fontWeight: 700, color: C.ok, fontSize: 13 }}>
                                  {calc.finalYield ? `${calc.finalYield}%` : "—"}
                                </td>
                                <td rowSpan={linkedCBs.length} style={{ padding: 10, border: splitCellBorder }} className="no-print">
                                  <button type="button" className="btn-nav btn-delete" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => deleteMB(mb.id)}>🗑️ Delete</button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}

                    {/* Progressive Yield Summary Row */}
                    <tr style={{ background: C.paleBg, fontWeight: 700, fontSize: 11.5, borderBottom: `2px solid ${C.navy}` }}>
                      <td colSpan="3" style={{ padding: 8, border: `1px solid ${C.line}`, textAlign: "right" }}>Progressive Yield</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}`, color: C.navy }}>100%</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}`, color: C.ok }}>{calc.granYield}%</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}`, color: C.ok }}>{calc.compYield}%</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}`, color: C.ok }}>{calc.coatYield}%</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}` }}>NA</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}` }}>Total {calc.plannedLakh}</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}` }}>Total {calc.packedLakhTotal}</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}` }}>Total {calc.dispatchLakhTotal}</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}`, color: C.ok }}>{calc.finalYield}%</td>
                      <td style={{ padding: 8, border: `1px solid ${C.line}` }} className="no-print"></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Official Signatures for GMP Compliance Printout */}
          <div className="print-footer print-only">
            <div className="signature-box">
              <div className="signature-line" />
              <div>Production Officer Sign & Date</div>
            </div>
            <div className="signature-box">
              <div className="signature-line" />
              <div>QA Manager Sign & Date</div>
            </div>
            <div className="signature-box">
              <div className="signature-line" />
              <div>Plant Head Sign & Date</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="no-print">
          {cbRows.length === 0 && <EmptyNote text="No commercial batches logged yet in this section." />}
          {cbRows.map(({ cb, calc }) => (
            <Card key={cb.id} style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: C.navy, display: "flex", alignItems: "center", gap: 10 }}>
                    {cb.id} · {cb.productName} <span style={{ background: C.paleBg, border: `1px solid ${C.line}`, color: C.sub, fontSize: 12, padding: "2px 8px", borderRadius: 6 }}>#{cb.batchNumber}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>
                    Linked Mother Batch: <b>{cb.mbId}</b> · Date: {fmtDate(cb.date)}{cb.loggedBy ? ` · Officer: ${cb.loggedBy}` : ""}
                  </div>
                </div>
                <button type="button" className="btn-nav btn-delete" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => deleteCB(cb.id)}>🗑️ Delete</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginTop: 16, fontSize: 13 }}>
                <Stat label="Units Received" value={`${calc.recvLakh ? `${calc.recvLakh} Lakhs` : "—"} (${fmtNum(cb.unitsReceived)})`} />
                <Stat label="Units Packed" value={`${calc.packedLakh ? `${calc.packedLakh} Lakhs` : "—"} (${fmtNum(cb.packedQty)})`} />
                <Stat label="Units Dispatched" value={`${calc.dispatchLakh ? `${calc.dispatchLakh} Lakhs` : "—"} (${fmtNum(cb.dispatchQty)})`} />
                <Stat label="Rejected Units" value={fmtNum(cb.rejectedUnits || 0)} />
                <Stat label="RR Retained for Future" value={`${fmtNum(cb.rrGeneratedUnits || 0)} units`} />
                <Stat label="Packaging Yield" value={<YieldBadge value={calc.pkgYield} />} />
                <Stat label="Dispatch Yield" value={<YieldBadge value={calc.dispatchYield} />} />
                <Stat label="Final Overall Yield" value={<YieldBadge value={calc.finalYield} />} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ROOT APP (WITH MULTI-DEVICE LIVE AUTO-SYNC)
// ============================================================================
function App() {
  const [step, setStep] = useState("role");
  const [role, setRole] = useState(null);
  const [dept, setDept] = useState(null);
  const [userName, setUserName] = useState("");

  const [motherBatches, setMotherBatches] = useState([]);
  const [commercialBatches, setCommercialBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchLatestCloudData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsSyncing(true);
    try {
      const mb = await loadShared("dpyms_mother_batches", SAMPLE_MOTHER_BATCHES);
      const cb = await loadShared("dpyms_commercial_batches", SAMPLE_COMMERCIAL_BATCHES);
      setMotherBatches(sortNewestFirst(mb));
      setCommercialBatches(sortNewestFirst(cb));
    } catch (e) {
      console.warn("Auto-sync fetch warning:", e);
    } finally {
      setLoading(false);
      if (showIndicator) setTimeout(() => setIsSyncing(false), 600);
    }
  }, []);

  const forcePushAllData = async () => {
    setIsSyncing(true);
    try {
      const currentMBs = JSON.parse(localStorage.getItem("dpyms_mother_batches") || "[]");
      const currentCBs = JSON.parse(localStorage.getItem("dpyms_commercial_batches") || "[]");
      const targetMBs = currentMBs.length ? currentMBs : motherBatches;
      const targetCBs = currentCBs.length ? currentCBs : commercialBatches;
      
      if (targetMBs.length) await saveShared("dpyms_mother_batches", targetMBs);
      if (targetCBs.length) await saveShared("dpyms_commercial_batches", targetCBs);
      
      alert(`Success! Pushed ${targetMBs.length} Mother Batches & ${targetCBs.length} Commercial Batches to Cloud. Now open your Phone and click "Sync Cloud Data"!`);
    } catch (e) {
      alert("Push Warning: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchLatestCloudData(false);
  }, [fetchLatestCloudData]);

  // Instant Automatic Hands-Free Multi-Device Cloud Sync (Every 2.5 seconds & on tab focus)
  useEffect(() => {
    fetchLatestCloudData(false);
    const interval = setInterval(() => {
      fetchLatestCloudData(false);
    }, 2500);

    const onFocus = () => fetchLatestCloudData(false);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchLatestCloudData]);

  const pickRole = (r) => {
    setRole(r);
    if (r === "manager") setStep("screen");
    else setStep("department");
  };
  const pickDept = (d) => { setDept(d); setStep("screen"); };
  const changeDept = () => { setStep("department"); };
  const goHome = () => { setRole(null); setDept(null); setUserName(""); setStep("role"); };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 55%, ${C.blue} 100%)`,
        fontFamily: FONT_BODY,
        padding: "24px",
        color: C.white,
        textAlign: "center"
      }}>
        <div style={{
          position: "relative",
          width: 90,
          height: 90,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div className="loader-pulse-ring" />
          <img
            src={BRAND_LOGO}
            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_LOGO; }}
            alt="Danish Healthcare"
            style={{
              maxHeight: 50,
              maxWidth: 70,
              objectFit: "contain",
              background: "#FFFFFF",
              padding: "6px 10px",
              borderRadius: 10,
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)"
            }}
          />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: FONT_DISPLAY, letterSpacing: 1 }}>
          DANISH HEALTHCARE (P) LTD.
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>
          Digital Production Yield Management System (DPYMS v2)
        </div>
        <div style={{
          marginTop: 24,
          padding: "8px 20px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          fontSize: 12.5,
          fontWeight: 600,
          color: C.skyBlue,
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <span className="spinner-dot" /> Initializing Multi-Device Cloud Persistence Engine…
        </div>
      </div>
    );
  }

  if (step === "role") return <RolePicker onPick={pickRole} />;

  const roleLabels = {
    production: "Production",
    qa: "Quality Assurance (QA)",
    packaging: "Packaging",
    manager: "Manager Dashboard",
  };
  const roleLabel = roleLabels[role] || role;

  if (step === "department") {
    return <DepartmentPicker onPick={pickDept} onBack={goHome} />;
  }

  const deptLabel = dept && DEPARTMENTS[dept] ? DEPARTMENTS[dept].label : null;

  return (
    <div style={{ minHeight: "100vh", background: C.paleBg, fontFamily: FONT_BODY }}>
      <TopBar
        roleLabel={roleLabel}
        deptLabel={deptLabel}
        userName={userName}
        onSwitchRole={goHome}
        onChangeDept={changeDept}
        showDeptChange={role !== "manager"}
        onManualSync={() => fetchLatestCloudData(true)}
        onForcePush={forcePushAllData}
        isSyncing={isSyncing}
      />
      {role === "manager" && (
        <ManagerScreen motherBatches={motherBatches} setMotherBatches={setMotherBatches} commercialBatches={commercialBatches} setCommercialBatches={setCommercialBatches} />
      )}
      {role === "production" && (
        <ProductionScreen
          dept={dept} userName={userName} setUserName={setUserName}
          motherBatches={motherBatches} setMotherBatches={setMotherBatches}
          commercialBatches={commercialBatches} setCommercialBatches={setCommercialBatches}
        />
      )}
      {role === "qa" && (
        <QaScreen
          dept={dept} userName={userName}
          motherBatches={motherBatches} setMotherBatches={setMotherBatches}
          commercialBatches={commercialBatches}
        />
      )}
      {role === "packaging" && (
        <PackagingScreen
          dept={dept} userName={userName} setUserName={setUserName}
          motherBatches={motherBatches} commercialBatches={commercialBatches}
          setCommercialBatches={setCommercialBatches}
        />
      )}
      <div style={{ textAlign: "center", padding: "18px 16px 30px", fontSize: 11, color: C.sub }} className="no-print">
        Danish Health Care (P) Ltd. · 76/27-29, Industrial Estate, Maxi Road, Ujjain 456010 · ISO 9001:2015 &amp; WHO GMP Certified
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("DPYMS Error Boundary Caught Exception:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A192F",
          color: "#FFFFFF",
          fontFamily: "Inter, sans-serif",
          padding: 24,
          textAlign: "center"
        }}>
          <h2 style={{ color: "#F87171" }}>DPYMS Application Recovery</h2>
          <p style={{ maxWidth: 500, margin: "12px 0 24px", color: "#94A3B8" }}>
            An unexpected state occurred. Click below to reload session data.
          </p>
          <button
            onClick={() => { window.location.reload(); }}
            style={{
              background: "#0E2A5E",
              color: "#FFF",
              border: "1px solid #38BDF8",
              borderRadius: 8,
              padding: "12px 24px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🔄 Reload Web App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
