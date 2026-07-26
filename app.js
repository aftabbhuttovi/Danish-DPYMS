const { useState, useEffect, useMemo } = React;

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
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aGFrd2lneWd5anNwbGpyam9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTQ5NzYsImV4cCI6MjA5OTc5MDk3Nn0.5WUUUBgw78EawfBVgDbUd1idrkWT_imbsRBgr-MWdJg';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Image assets with embedded base64 fallbacks for guaranteed loading
const BRAND_LOGO = window.LOGO_B64 || 'assets/danish_logo.jpg';
const IMG_TAB = window.TAB_B64 || 'assets/tablet_product.jpg';
const IMG_CAP = window.CAP_B64 || 'assets/capsule_product.jpg';
const IMG_ORS = window.ORS_B64 || 'assets/ors_product.jpg';
const IMG_OINT = window.OINT_B64 || 'assets/ointment_product.jpg';

// ---------- Sample Realistic Plant Data ----------
const SAMPLE_MOTHER_BATCHES = [
  {
    id: "MB-TB-001", dept: "tablet", date: "2026-07-24", genericName: "LOPERAMIDE HCl TABLETS IP 2 MG", productGroup: "LOPRABLUE GROUP",
    avgUnitWt: "220", plannedLakhUnits: "10.00", plannedBatchWt: "220.0", rrGran: "0", granOutput: "218.2", compOutput: "216.5",
    coated: "Y", coreAvgWt: "220", coatWtGainPct: "3.0", actualCoatedWt: "226.6", coatOutput: "222.0", coatMatConsumed: "8.5",
    remarks: "Disintegration: 3.5 mins, Dissolution: 98.4%, Assay IP compliant.", loggedBy: "R. K. Sharma (Production Supervisor)", qaStatus: "QA Approved"
  },
  {
    id: "MB-CP-001", dept: "capsule", date: "2026-07-23", genericName: "OMEPRAZOLE CAPSULES BP 20 MG", productGroup: "OMEDAN GROUP",
    avgUnitWt: "326", fillWtMg: "250", shellWtMg: "76", plannedLakhUnits: "5.00", plannedBatchWt: "125.0", granOutput: "124.2", compOutput: "123.8",
    remarks: "Locking height and fill weight variation within BP specifications.", loggedBy: "A. K. Verma", qaStatus: "QA Approved"
  },
  {
    id: "MB-OR-001", dept: "ors", date: "2026-07-22", genericName: "ORS POWDER (WHO FORMULA)", productGroup: "DANISH ORS SACHETS",
    plannedQty: "250000", mixOutputKg: "5250", fillOutputQty: "248500",
    remarks: "Moisture content: 0.8%, Electrolyte concentration verified.", loggedBy: "P. S. Rathore", qaStatus: "QA Approved"
  }
];

const SAMPLE_COMMERCIAL_BATCHES = [
  {
    id: "CB-TB-001", dept: "tablet", mbId: "MB-TB-001", date: "2026-07-25", productName: "LOPRABLUE TABLETS 2 MG", batchNumber: "LEA26001",
    unitsReceived: "500000", packedQty: "496500", dispatchQty: "495000", rejectedUnits: "2500", damagedUnits: "1000", loggedBy: "V. Singh (Packaging Lead)"
  },
  {
    id: "CB-CP-001", dept: "capsule", mbId: "MB-CP-001", date: "2026-07-25", productName: "OMEDAN 20 CAPSULES", batchNumber: "CMA26001",
    unitsReceived: "500000", packedQty: "497000", dispatchQty: "496000", rejectedUnits: "2000", damagedUnits: "1000", loggedBy: "M. Patel"
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

async function loadShared(key, fallback) {
  if (key === "dpyms_selftest") return fallback;
  try {
    const table = key === "dpyms_mother_batches" ? "mother_batches" : (key === "dpyms_commercial_batches" ? "commercial_batches" : null);
    if (!table) return fallback;
    const { data, error } = await supabase.from(table).select('*');
    if (error || !data || data.length === 0) return fallback;
    return data.map(toCamelCase);
  } catch (e) {
    return fallback;
  }
}

async function saveShared(key, value) {
  if (key === "dpyms_selftest") return { ok: true };
  try {
    const table = key === "dpyms_mother_batches" ? "mother_batches" : (key === "dpyms_commercial_batches" ? "commercial_batches" : null);
    if (!table) return { ok: true };
    const snakeCaseRows = value.map(toSnakeCase);
    const { error } = await supabase.from(table).upsert(snakeCaseRows);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || "Error saving" };
  }
}

async function deleteSharedRow(table, id) {
  try {
    await supabase.from(table).delete().eq('id', id);
  } catch (e) {}
}

const round2 = (n) => (isFinite(n) && n !== "" && n !== null ? Math.round(n * 100) / 100 : "");
function lakhUnitsFromKg(kg, avgWtMg) {
  if (!kg || !avgWtMg) return "";
  return round2((kg * 1000000) / avgWtMg / 100000);
}
function kgFromLakhUnits(lakhs, avgWtMg) {
  if (!lakhs || !avgWtMg) return "";
  return round2((lakhs * 100000 * avgWtMg) / 1000000);
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
function totalKgFromUnitsAndGrams(qty, gramsPerUnit) {
  const q = parseFloat(qty), g = parseFloat(gramsPerUnit);
  if (!isFinite(q) || !isFinite(g)) return "";
  return round2((q * g) / 1000);
}

// ---------- Dual Calculation: Tablet Mother Batch ----------
function computeMB_Tablet(mbRaw, commercialBatches) {
  const wt = parseFloat(mbRaw.avgUnitWt);
  const plannedLakhInput = parseFloat(mbRaw.plannedLakhUnits);
  let batchWt = parseFloat(mbRaw.plannedBatchWt);
  
  if (isFinite(plannedLakhInput) && wt && !batchWt) {
    batchWt = (plannedLakhInput * 100000 * wt) / 1000000;
  }
  const rr = parseFloat(mbRaw.rrGran) || 0;
  const totalBatchKg = isFinite(batchWt) ? round2(batchWt + rr) : "";
  const plannedLakh = isFinite(plannedLakhInput) ? plannedLakhInput : (totalBatchKg !== "" ? lakhUnitsFromKg(totalBatchKg, wt) : "");

  const gran = parseFloat(mbRaw.granOutput);
  const granLakh = isFinite(gran) && wt ? lakhUnitsFromKg(gran, wt) : "";
  const granYield = isFinite(gran) && totalBatchKg !== "" ? pct(gran, totalBatchKg) : "";

  const comp = parseFloat(mbRaw.compOutput);
  const compLakh = isFinite(comp) && wt ? lakhUnitsFromKg(comp, wt) : "";
  const compYield = isFinite(comp) && isFinite(gran) ? pct(comp, gran) : "";

  const coated = mbRaw.coated === "Y";
  const coreWt = parseFloat(mbRaw.coreAvgWt) || wt;
  const coatGainPct = parseFloat(mbRaw.coatWtGainPct) || 0;
  const expectedCoatedWt = isFinite(coreWt) ? round2(coreWt * (1 + coatGainPct / 100)) : "";
  const actualCoatedWt = parseFloat(mbRaw.actualCoatedWt) || expectedCoatedWt;

  const coat = parseFloat(mbRaw.coatOutput);
  const effectiveCoatedUnitWt = actualCoatedWt || wt;
  const coatLakh = coated && isFinite(coat) && effectiveCoatedUnitWt ? lakhUnitsFromKg(coat, effectiveCoatedUnitWt) : "";
  const coatYield = !coated ? "NA" : isFinite(coat) && isFinite(comp) ? pct(coat, comp) : "";

  const linked = commercialBatches.filter((cb) => cb.mbId === mbRaw.id);
  const packedLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.packedQty)) ? parseFloat(cb.packedQty) / 100000 : 0), 0)
  );
  const packedKgTotal = packedLakhTotal !== "" && wt ? kgFromLakhUnits(packedLakhTotal, wt) : "";
  
  const dispatchLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.dispatchQty)) ? parseFloat(cb.dispatchQty) / 100000 : 0), 0)
  );
  const dispatchKgTotal = dispatchLakhTotal !== "" && wt ? kgFromLakhUnits(dispatchLakhTotal, wt) : "";

  return {
    totalBatchKg, plannedLakh,
    gran, granLakh, granYield,
    comp, compLakh, compYield,
    coated, coreWt, coatGainPct, expectedCoatedWt, actualCoatedWt,
    coat: coated ? coat : "NA", coatLakh: coated ? coatLakh : "NA", coatYield,
    packedLakhTotal, packedKgTotal, dispatchLakhTotal, dispatchKgTotal,
    linkedCount: linked.length,
    qaStatus: mbRaw.qaStatus || "Pending",
  };
}

// ---------- Dual Calculation: Capsule Mother Batch ----------
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

  const requiredFillKg = plannedLakh !== "" && fillWt ? round2((plannedLakh * 100000 * fillWt) / 1000000) : "";
  const requiredShellQty = plannedLakh !== "" ? plannedLakh * 100000 : "";

  const gran = parseFloat(mbRaw.granOutput);
  const granLakh = isFinite(gran) && fillWt ? lakhUnitsFromKg(gran, fillWt) : "";
  const granYield = isFinite(gran) && totalBatchKg !== "" ? pct(gran, totalBatchKg) : "";

  const comp = parseFloat(mbRaw.compOutput);
  const compLakh = isFinite(comp) && avgFilledCapWt ? lakhUnitsFromKg(comp, avgFilledCapWt) : "";
  const compYield = isFinite(comp) && isFinite(gran) ? pct(comp, gran) : "";

  const linked = commercialBatches.filter((cb) => cb.mbId === mbRaw.id);
  const packedLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.packedQty)) ? parseFloat(cb.packedQty) / 100000 : 0), 0)
  );
  const packedKgTotal = packedLakhTotal !== "" && fillWt ? kgFromLakhUnits(packedLakhTotal, fillWt) : "";

  const dispatchLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.dispatchQty)) ? parseFloat(cb.dispatchQty) / 100000 : 0), 0)
  );
  const dispatchKgTotal = dispatchLakhTotal !== "" && fillWt ? kgFromLakhUnits(dispatchLakhTotal, fillWt) : "";

  return {
    fillWt, shellWt, avgFilledCapWt, requiredFillKg, requiredShellQty,
    totalBatchKg, plannedLakh,
    gran, granLakh, granYield,
    comp, compLakh, compYield,
    packedLakhTotal, packedKgTotal, dispatchLakhTotal, dispatchKgTotal,
    linkedCount: linked.length,
    qaStatus: mbRaw.qaStatus || "Pending",
  };
}

// ---------- Dual Calculation: ORS & Ointment Mother Batch ----------
function computeMB_OrsOintment(mbRaw, commercialBatches) {
  const plannedQty = parseFloat(mbRaw.plannedQty);
  const plannedLakh = isFinite(plannedQty) ? lakhFromUnits(plannedQty) : "";
  const mixOutputKg = parseFloat(mbRaw.mixOutputKg);

  const fillQty = parseFloat(mbRaw.fillOutputQty);
  const fillLakh = isFinite(fillQty) ? lakhFromUnits(fillQty) : "";
  const fillYield = isFinite(fillQty) && plannedQty ? pct(fillQty, plannedQty) : "";

  const linked = commercialBatches.filter((cb) => cb.mbId === mbRaw.id);
  const packedLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.packedQty)) ? parseFloat(cb.packedQty) / 100000 : 0), 0)
  );
  const dispatchLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.dispatchQty)) ? parseFloat(cb.dispatchQty) / 100000 : 0), 0)
  );

  return {
    plannedQty, plannedLakh, mixOutputKg, totalBatchKg: mixOutputKg,
    fillQty, fillLakh, fillYield,
    packedLakhTotal, dispatchLakhTotal,
    linkedCount: linked.length,
    qaStatus: mbRaw.qaStatus || "Pending",
  };
}

function computeMB(mbRaw, commercialBatches) {
  if (mbRaw.dept === "capsule") return computeMB_Capsule(mbRaw, commercialBatches);
  if (mbRaw.dept === "ors" || mbRaw.dept === "ointment") return computeMB_OrsOintment(mbRaw, commercialBatches);
  return computeMB_Tablet(mbRaw, commercialBatches);
}

// ---------- Complete Commercial Batch Calculations ----------
function computeCB(cbRaw, motherBatches) {
  const mb = motherBatches.find((m) => m.id === cbRaw.mbId);
  const dept = mb ? mb.dept : cbRaw.dept;

  const unitsRecv = parseFloat(cbRaw.unitsReceived) || 0;
  const packed = parseFloat(cbRaw.packedQty) || 0;
  const dispatch = parseFloat(cbRaw.dispatchQty) || 0;
  const rejected = parseFloat(cbRaw.rejectedUnits) || 0;
  const damaged = parseFloat(cbRaw.damagedUnits) || 0;
  const totalLossUnits = rejected + damaged;
  const balanceUnits = Math.max(0, unitsRecv - (packed + totalLossUnits));

  const pkgYield = unitsRecv > 0 ? pct(packed, unitsRecv) : "";
  const dispatchYield = packed > 0 ? pct(dispatch, packed) : "";
  const finalYield = unitsRecv > 0 ? pct(dispatch, unitsRecv) : "";

  const recvLakh = isFinite(unitsRecv) ? lakhFromUnits(unitsRecv) : "";
  const packedLakh = isFinite(packed) ? lakhFromUnits(packed) : "";
  const dispatchLakh = isFinite(dispatch) ? lakhFromUnits(dispatch) : "";

  const avgWt = mb ? parseFloat(mb.avgUnitWt || mb.fillWtMg) : NaN;
  const packedKg = packedLakh !== "" && avgWt ? kgFromLakhUnits(packedLakh, avgWt) : "";
  const dispatchKg = dispatchLakh !== "" && avgWt ? kgFromLakhUnits(dispatchLakh, avgWt) : "";

  return { mb, avgWt, unitsRecv, recvLakh, packed, packedLakh, packedKg, dispatch, dispatchLakh, dispatchKg, rejected, damaged, totalLossUnits, balanceUnits, pkgYield, dispatchYield, finalYield };
}

// ---------- ID & Sort Helpers ----------
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

function toCSV(rows, headers) {
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.map((h) => esc(h.label)).join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((h) => esc(row[h.key])).join(","));
  });
  return lines.join("\r\n");
}
function downloadCSV(filename, csvContent) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function BrandHeader({ small }) {
  return (
    <div style={{ textAlign: "center", marginBottom: small ? 20 : 32 }}>
      <img src={BRAND_LOGO} alt="Danish Healthcare Logo" className="brand-header-logo" style={{ marginBottom: 12, height: small ? 42 : 54 }} />
      <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 12.5, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
        DANISH HEALTH CARE (P) LTD. · UJJAIN
      </div>
      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>
        Digital Production Yield Management System (DPYMS v2)
      </div>
    </div>
  );
}

function UniversalActionBar({ onSave, onEdit, onUpdate, onDelete, onBack, onNext, isEditing = false }) {
  return (
    <div className="nav-action-bar no-print">
      {onBack && <button type="button" className="btn-nav btn-back" onClick={onBack}>← Back</button>}
      {!isEditing && onSave && <button type="button" className="btn-nav btn-save" onClick={onSave}>💾 Save</button>}
      {!isEditing && onEdit && <button type="button" className="btn-nav btn-edit" onClick={onEdit}>✏️ Edit</button>}
      {isEditing && onUpdate && <button type="button" className="btn-nav btn-update" onClick={onUpdate}>🔄 Update Record</button>}
      {onDelete && <button type="button" className="btn-nav btn-delete" onClick={onDelete}>🗑️ Delete Batch</button>}
      {onNext && <button type="button" className="btn-nav btn-next" onClick={onNext}>Next →</button>}
    </div>
  );
}

function RolePicker({ onPick }) {
  const roles = [
    { key: "production", label: "Production", desc: "Log & Edit Mother Batches — Granulation, Compression, Coating", icon: "⚗" },
    { key: "qa", label: "Quality Assurance (QA)", desc: "Inspection, Assay, QC Approvals & Status Updates", icon: "🔬" },
    { key: "packaging", label: "Packaging", desc: "Commercial Batches — Packing, Rejections, Dispatch & Yields", icon: "📦" },
    { key: "manager", label: "Manager Dashboard", desc: "Full plant view — stage tracking, plant register & GMP reports", icon: "◈" },
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
      <img src={BRAND_LOGO} alt="Danish Healthcare" style={{ height: 52, marginBottom: 20 }} />
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.navy }}>Select Product Line</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>Choose manufacturing section for yield logging</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, width: "100%", maxWidth: 480 }}>
        {DEPT_LIST.map((d) => (
          <button key={d.key} onClick={() => onPick(d.key)} style={{ background: C.white, border: `1.5px solid ${C.line}`, borderRadius: 16, padding: "20px 16px", cursor: "pointer", textAlign: "center", boxShadow: "0 4px 14px rgba(14,42,94,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <img src={d.imgSrc} alt={d.label} className="product-card-img" />
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

function TopBar({ roleLabel, deptLabel, userName, onSwitchRole, onChangeDept, showDeptChange, onOpenRegister, showRegisterLink }) {
  return (
    <div style={{ background: C.navy, color: C.white, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexWrap: "wrap", gap: 8 }} className="no-print">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={BRAND_LOGO} alt="Logo" style={{ height: 32, borderRadius: 4 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, fontFamily: FONT_DISPLAY }}>DPYMS v2 · Danish Healthcare</div>
          <div style={{ fontSize: 10, color: C.skyBlue, letterSpacing: 0.5 }}>
            {roleLabel}{deptLabel ? ` · ${deptLabel}` : ""}{userName ? ` · ${userName}` : ""}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {showRegisterLink && (
          <button onClick={onOpenRegister} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", color: C.white, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
            Plant Register & Reports
          </button>
        )}
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

function DeptTag({ dept }) {
  const d = DEPARTMENTS[dept];
  if (!d) return null;
  return (
    <span style={{ background: C.paleBg, border: `1px solid ${C.line}`, color: C.navy, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
      <img src={d.imgSrc} alt="" style={{ width: 16, height: 16, borderRadius: 4, objectFit: "cover" }} /> {d.label}
    </span>
  );
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
function EmptyNote({ text }) {
  return <div style={{ textAlign: "center", color: C.sub, fontSize: 13, padding: "30px 10px", border: `1.5px dashed ${C.line}`, borderRadius: 12 }}>{text}</div>;
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

// ============================================================================
// PRODUCTION SCREEN — Multi-stage Mother Batch Entry & Editing
// ============================================================================
function ProductionScreen({ dept, userName, motherBatches, setMotherBatches, commercialBatches, setCommercialBatches }) {
  const d = DEPARTMENTS[dept];
  const isTablet = dept === "tablet";
  const isCapsule = dept === "capsule";
  const isOrsOintment = dept === "ors" || dept === "ointment";

  const blank = {
    id: "", dept, date: new Date().toISOString().slice(0, 10), genericName: "", productGroup: "",
    avgUnitWt: "", plannedLakhUnits: "", plannedBatchWt: "", rrGran: "0", granOutput: "", compOutput: "", compRR: "0",
    coated: "N", coreAvgWt: "", coatWtGainPct: "", actualCoatedWt: "", coatOutput: "", coatMatConsumed: "",
    fillWtMg: "", shellWtMg: "",
    plannedQty: "", mixOutputKg: "", fillOutputQty: "",
    remarks: "", loggedBy: userName || "", qaStatus: "Pending",
  };

  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { setForm(blank); setEditingId(null); }, [dept]); // eslint-disable-line

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const previewLakhs = form.plannedLakhUnits ? parseFloat(form.plannedLakhUnits) : "";
  const previewAvgWt = isCapsule ? (parseFloat(form.fillWtMg) || parseFloat(form.avgUnitWt)) : parseFloat(form.avgUnitWt);
  const calculatedReqKg = previewLakhs && previewAvgWt ? round2((previewLakhs * 100000 * previewAvgWt) / 1000000) : "";

  const saveRecord = async (isUpdate = false) => {
    if (!form.genericName) {
      setToast("Please enter Generic Product Name");
      return;
    }

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

    setToast(`Mother Batch ${recordId} ${isUpdate ? "updated" : "saved"}`);
    if (isUpdate) setEditingId(null);
    setForm({ ...blank, date: new Date().toISOString().slice(0, 10) });
  };

  const deleteBatch = async (mbId) => {
    if (!window.confirm(`Are you sure you want to delete Mother Batch ${mbId}? This action cannot be undone.`)) return;

    const updatedMBs = motherBatches.filter((m) => m.id !== mbId);
    const updatedCBs = commercialBatches.filter((c) => c.mbId !== mbId);

    setMotherBatches(updatedMBs);
    setCommercialBatches(updatedCBs);

    deleteSharedRow("mother_batches", mbId);
    await saveShared("dpyms_mother_batches", updatedMBs);
    await saveShared("dpyms_commercial_batches", updatedCBs);

    if (form.id === mbId || editingId === mbId) {
      setForm(blank);
      setEditingId(null);
    }
    setToast(`Mother Batch ${mbId} deleted`);
  };

  const editBatch = (mb) => {
    setForm(mb);
    setEditingId(mb.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deptBatches = motherBatches.filter((m) => m.dept === dept);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading eyebrow={`Production · ${d.label}`} title={`${editingId ? "Edit" : "Log"} ${d.label} Mother Batch`} sub="Progressive multi-stage record." />

      <UniversalActionBar
        onSave={() => saveRecord(false)}
        onEdit={editingId ? null : () => deptBatches[0] && editBatch(deptBatches[0])}
        onUpdate={() => saveRecord(true)}
        onDelete={editingId ? () => deleteBatch(editingId) : null}
        onBack={() => { setForm(blank); setEditingId(null); }}
        isEditing={!!editingId}
      />

      <Card style={{ padding: 22, marginBottom: 24 }}>
        {editingId && (
          <div style={{ background: C.warnBg, color: C.warn, padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>✏️ Editing Active Batch: {editingId}</span>
            <button type="button" className="btn-nav btn-delete" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => deleteBatch(editingId)}>🗑️ Delete Batch</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Date"><TextInput type="date" value={form.date} onChange={set("date")} /></Field>
          <Field label="Logged by"><TextInput placeholder="Operator / Supervisor Name" value={form.loggedBy} onChange={set("loggedBy")} /></Field>
        </div>

        <Field label="Generic Name">
          <TextInput placeholder={isTablet ? "e.g. LOPERAMIDE HCl TABLETS IP 2 MG" : isCapsule ? "e.g. OMEPRAZOLE CAPSULES BP 20 MG" : "e.g. ORS POWDER (WHO FORMULA)"} value={form.genericName} onChange={set("genericName")} />
        </Field>
        <Field label="Product Group / Brand Family">
          <TextInput placeholder="e.g. LOPRABLUE / LOPAGONE GROUP" value={form.productGroup} onChange={set("productGroup")} />
        </Field>

        {isTablet && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Planned Tablets (in Lakhs)" hint="e.g. 5.00, 10.50">
                <TextInput type="number" step="0.01" placeholder="e.g. 10.00" value={form.plannedLakhUnits} onChange={set("plannedLakhUnits")} />
              </Field>
              <Field label="Avg Tablet Wt (mg)"><TextInput type="number" placeholder="e.g. 220" value={form.avgUnitWt} onChange={set("avgUnitWt")} /></Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Planned Batch Wt (kg)" hint={calculatedReqKg ? `Auto Req: ${calculatedReqKg} kg` : "Batch size in kg"}>
                <TextInput type="number" placeholder={calculatedReqKg || "e.g. 220"} value={form.plannedBatchWt || calculatedReqKg} onChange={set("plannedBatchWt")} />
              </Field>
              <Field label="RR Added — Granulation (kg)"><TextInput type="number" value={form.rrGran} onChange={set("rrGran")} /></Field>
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
                  <Field label="Target Weight Gain (%)"><TextInput type="number" placeholder="e.g. 3.0" value={form.coatWtGainPct} onChange={set("coatWtGainPct")} /></Field>
                )}
              </div>

              {form.coated === "Y" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="Actual Coated Tablet Wt (mg)"><TextInput type="number" placeholder="e.g. 226.6" value={form.actualCoatedWt} onChange={set("actualCoatedWt")} /></Field>
                    <Field label="Coating Output (kg)"><TextInput type="number" value={form.coatOutput} onChange={set("coatOutput")} /></Field>
                  </div>
                  <Field label="Coating Material Consumed (kg)"><TextInput type="number" placeholder="e.g. 8.5" value={form.coatMatConsumed} onChange={set("coatMatConsumed")} /></Field>
                </>
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
              <Field label="Avg Filled Capsule Wt (mg)" hint="Auto calculated">
                <TextInput type="number" value={(parseFloat(form.fillWtMg) || 0) + (parseFloat(form.shellWtMg) || 0) || form.avgUnitWt} readOnly style={{ background: C.paleBg }} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Granulation Output (kg)"><TextInput type="number" value={form.granOutput} onChange={set("granOutput")} /></Field>
              <Field label="Filling Output (kg)"><TextInput type="number" value={form.compOutput} onChange={set("compOutput")} /></Field>
            </div>
          </>
        )}

        {isOrsOintment && (
          <>
            <Field label={`Planned Quantity (${dept === "ors" ? "sachets" : "tubes"})`}>
              <TextInput type="number" placeholder="e.g. 500000" value={form.plannedQty} onChange={set("plannedQty")} />
            </Field>
            <Field label="Mix Output (kg)"><TextInput type="number" value={form.mixOutputKg} onChange={set("mixOutputKg")} /></Field>
            <Field label={`Fill Output (${dept === "ors" ? "sachets" : "tubes"} filled)`}>
              <TextInput type="number" value={form.fillOutputQty} onChange={set("fillOutputQty")} />
            </Field>
          </>
        )}

        <Field label="Remarks / Observations"><TextInput value={form.remarks} onChange={set("remarks")} /></Field>
      </Card>

      <SectionHeading title={`Recent ${d.label} Mother Batches`} small />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {deptBatches.length === 0 && <EmptyNote text="No mother batches logged yet in this department." />}
        {deptBatches.map((mb) => {
          const calc = computeMB(mb, commercialBatches);
          const open = expandedId === mb.id;
          return (
            <Card key={mb.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ cursor: "pointer", flex: 1 }} onClick={() => setExpandedId(open ? null : mb.id)}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{mb.id} · {mb.genericName || "Untitled"}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    {fmtDate(mb.date)}{mb.loggedBy ? ` · by ${mb.loggedBy}` : ""} · Planned: <b>{calc.plannedLakh ? `${calc.plannedLakh} Lakhs` : "—"}</b> ({calc.totalBatchKg ? `${calc.totalBatchKg} kg` : "—"})
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusPill status={mb.qaStatus || "Pending"} />
                  <button type="button" className="btn-nav btn-edit" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => editBatch(mb)}>✏️ Edit</button>
                  <button type="button" className="btn-nav btn-delete" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => deleteBatch(mb.id)}>🗑️ Delete</button>
                </div>
              </div>
              {open && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 12.5 }}>
                  {isTablet && (
                    <>
                      <Stat label="Gran Output" value={`${mb.granOutput || "—"} kg (${calc.granLakh || "—"} L)`} />
                      <Stat label="Gran Yield" value={<YieldBadge value={calc.granYield} />} />
                      <Stat label="Comp Output" value={`${mb.compOutput || "—"} kg (${calc.compLakh || "—"} L)`} />
                      <Stat label="Comp Yield" value={<YieldBadge value={calc.compYield} />} />
                      <Stat label="Coat Output" value={calc.coat === "NA" ? "NA" : `${mb.coatOutput || "—"} kg (${calc.coatLakh || "—"} L)`} />
                      <Stat label="Coat Yield" value={<YieldBadge value={calc.coatYield} />} />
                    </>
                  )}
                  {isCapsule && (
                    <>
                      <Stat label="Gran Output" value={`${mb.granOutput || "—"} kg (${calc.granLakh || "—"} L)`} />
                      <Stat label="Gran Yield" value={<YieldBadge value={calc.granYield} />} />
                      <Stat label="Filling Output" value={`${mb.compOutput || "—"} kg (${calc.compLakh || "—"} L)`} />
                      <Stat label="Fill Yield" value={<YieldBadge value={calc.compYield} />} />
                    </>
                  )}
                  <Stat label="Total Packed" value={`${calc.packedLakhTotal} Lakhs ${calc.packedKgTotal ? `(${calc.packedKgTotal} kg)` : ""}`} />
                  <Stat label="Total Dispatched" value={`${calc.dispatchLakhTotal} Lakhs ${calc.dispatchKgTotal ? `(${calc.dispatchKgTotal} kg)` : ""}`} />
                  <Stat label="Commercial Splits" value={calc.linkedCount} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}

// ============================================================================
// QA SCREEN — Quality Assurance Inspection Module
// ============================================================================
function QaScreen({ dept, userName, motherBatches, setMotherBatches, commercialBatches }) {
  const d = DEPARTMENTS[dept];
  const deptMBs = motherBatches.filter((m) => m.dept === dept);

  const [selectedMbId, setSelectedMbId] = useState(deptMBs[0]?.id || "");
  const [qaStatus, setQaStatus] = useState("QA Approved");
  const [qaAssay, setQaAssay] = useState("99.8");
  const [qaRemarks, setQaRemarks] = useState("");
  const [toast, setToast] = useState("");

  const selectedMB = motherBatches.find((m) => m.id === selectedMbId);
  const calc = selectedMB ? computeMB(selectedMB, commercialBatches) : null;

  const saveQaApproval = async () => {
    if (!selectedMB) return;
    const updatedMBs = motherBatches.map((m) => m.id === selectedMbId ? { ...m, qaStatus, qaAssay, qaRemarks, qaInspector: userName || "QA Officer" } : m);
    setMotherBatches(updatedMBs);
    await saveShared("dpyms_mother_batches", updatedMBs);
    setToast(`QA decision for ${selectedMbId} saved as ${qaStatus}`);
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading eyebrow={`Quality Assurance · ${d.label}`} title="QA Inspection & Quality Clearance" sub="Review yield statistics and sign off on batch quality." />

      <UniversalActionBar
        onSave={saveQaApproval}
        onUpdate={saveQaApproval}
        onBack={() => {}}
      />

      <Card style={{ padding: 20, marginBottom: 24 }}>
        <Field label="Select Mother Batch for QA Clearance">
          <SelectInput value={selectedMbId} onChange={(e) => setSelectedMbId(e.target.value)}>
            {deptMBs.length === 0 && <option value="">No batches available</option>}
            {deptMBs.map((m) => <option key={m.id} value={m.id}>{m.id} — {m.genericName} (Status: {m.qaStatus || "Pending"})</option>)}
          </SelectInput>
        </Field>

        {selectedMB && calc && (
          <div style={{ background: C.paleBg, borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.navy, marginBottom: 10 }}>Batch Yield Summary — {selectedMB.id}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, fontSize: 13 }}>
              <Stat label="Planned Batch" value={`${calc.plannedLakh || "—"} Lakhs (${calc.totalBatchKg || "—"} kg)`} />
              <Stat label="Granulation Yield" value={<YieldBadge value={calc.granYield} />} />
              <Stat label="Compression Yield" value={<YieldBadge value={calc.compYield} />} />
              <Stat label="Coating Yield" value={<YieldBadge value={calc.coatYield} />} />
              <Stat label="Current QA Status" value={<StatusPill status={selectedMB.qaStatus || "Pending"} />} />
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
          <Field label="Assay / Potency (%)"><TextInput placeholder="e.g. 99.8%" value={qaAssay} onChange={(e) => setQaAssay(e.target.value)} /></Field>
        </div>
        <Field label="QA Inspection Remarks"><TextInput placeholder="e.g. Physical parameters, disintegration & dissolution meet IP specifications." value={qaRemarks} onChange={(e) => setQaRemarks(e.target.value)} /></Field>

        <PrimaryButton onClick={saveQaApproval}>Save QA Clearance</PrimaryButton>
      </Card>
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}

// ============================================================================
// PACKAGING SCREEN — Commercial Batch Entry
// ============================================================================
function PackagingScreen({ dept, userName, setUserName, motherBatches, commercialBatches, setCommercialBatches }) {
  const d = DEPARTMENTS[dept];
  const deptMBs = motherBatches.filter((m) => m.dept === dept);

  const [mbId, setMbId] = useState(deptMBs[0]?.id || "");
  useEffect(() => {
    if (!mbId && deptMBs[0]) setMbId(deptMBs[0].id);
  }, [deptMBs]); // eslint-disable-line

  const [splitCount, setSplitCount] = useState(1);
  const [splitRows, setSplitRows] = useState([{ productName: "", batchNumber: "" }]);
  const [showSplitSetup, setShowSplitSetup] = useState(true);

  const applySplitCount = (n) => {
    const count = Math.max(1, Math.min(20, parseInt(n, 10) || 1));
    setSplitCount(count);
    setSplitRows((prev) => {
      const next = [...prev];
      while (next.length < count) next.push({ productName: "", batchNumber: "" });
      return next.slice(0, count);
    });
  };

  const detailBlank = { unitsReceived: "", packedQty: "", dispatchQty: "", rejectedUnits: "0", damagedUnits: "0", remarks: "" };
  const [details, setDetails] = useState({});
  const [toast, setToast] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

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
    const newRecords = splitRows.map((r, i) => ({ r, det: details[i] || {} }));

    let running = [...commercialBatches];
    const finalRecords = [];
    newRecords.forEach(({ r, det }) => {
      const id = genCBId(running, dept);
      const rec = {
        id, dept, mbId, date, loggedBy: userName || "",
        productName: r.productName, batchNumber: r.batchNumber,
        ...det,
        createdAt: Date.now(),
      };
      finalRecords.push(rec);
      running = [rec, ...running];
    });

    const updated = sortNewestFirst([...finalRecords, ...commercialBatches]);
    setCommercialBatches(updated);
    await saveShared("dpyms_commercial_batches", updated);
    setToast(`${finalRecords.length} commercial batch(es) saved`);

    setSplitCount(1);
    setSplitRows([{ productName: "", batchNumber: "" }]);
    setDetails({});
    setShowSplitSetup(true);
  };

  const deleteCB = async (cbId) => {
    if (!window.confirm(`Are you sure you want to delete Commercial Batch ${cbId}?`)) return;

    const updatedCBs = commercialBatches.filter((c) => c.id !== cbId);
    setCommercialBatches(updatedCBs);

    deleteSharedRow("commercial_batches", cbId);
    await saveShared("dpyms_commercial_batches", updatedCBs);
    setToast(`Commercial Batch ${cbId} deleted`);
  };

  const deptCBs = commercialBatches.filter((c) => c.dept === dept);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading eyebrow={`Packaging · ${d.label}`} title="Log Commercial Batches & Packaging Yields" sub="Track Units Received, Packed, Dispatched, Rejections & Damaged units." />

      <UniversalActionBar
        onSave={saveAll}
        onBack={() => setShowSplitSetup(true)}
      />

      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Packaging Supervisor"><TextInput placeholder="Your name" value={userName} onChange={(e) => setUserName(e.target.value)} /></Field>
        </div>
        <Field label="Mother Batch">
          <SelectInput value={mbId} onChange={(e) => setMbId(e.target.value)}>
            {deptMBs.length === 0 && <option value="">No mother batches available</option>}
            {deptMBs.map((mb) => <option key={mb.id} value={mb.id}>{mb.id} — {mb.genericName || "Untitled"}</option>)}
          </SelectInput>
        </Field>

        {showSplitSetup ? (
          <>
            <Field label="Number of Commercial Batches" hint="How many brand lines is this Mother Batch split into?">
              <TextInput type="number" min="1" max="20" value={splitCount} onChange={(e) => applySplitCount(e.target.value)} />
            </Field>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {splitRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: C.paleBg, padding: 12, borderRadius: 10 }}>
                  <Field label={`Batch ${i + 1} — Product Name`}>
                    <TextInput placeholder="e.g. LOPRABLUE TABLETS 2 MG" value={row.productName} onChange={(e) => setSplitRows((prev) => prev.map((r, j) => j === i ? { ...r, productName: e.target.value } : r))} />
                  </Field>
                  <Field label={`Batch ${i + 1} — Batch Number`}>
                    <TextInput placeholder="e.g. LEA26001" value={row.batchNumber} onChange={(e) => setSplitRows((prev) => prev.map((r, j) => j === i ? { ...r, batchNumber: e.target.value } : r))} />
                  </Field>
                </div>
              ))}
            </div>
            <PrimaryButton onClick={startDetailEntry}>Continue to Packaging Details →</PrimaryButton>
          </>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
              {splitRows.map((row, i) => {
                const det = details[i] || {};
                const recv = parseFloat(det.unitsReceived) || 0;
                const packed = parseFloat(det.packedQty) || 0;
                const rej = parseFloat(det.rejectedUnits) || 0;
                const dam = parseFloat(det.damagedUnits) || 0;
                const bal = Math.max(0, recv - (packed + rej + dam));
                const yieldPct = recv > 0 ? pct(packed, recv) : "";

                return (
                  <Card key={i} style={{ padding: 16, background: C.paleBg }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 12 }}>
                      {row.productName} <span style={{ color: C.sub, fontWeight: 400 }}>· Batch #{row.batchNumber}</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="Units Received (Counts)"><TextInput type="number" placeholder="e.g. 500000" value={det.unitsReceived || ""} onChange={setDetail(i, "unitsReceived")} /></Field>
                      <Field label="Units Packed"><TextInput type="number" placeholder="e.g. 496500" value={det.packedQty || ""} onChange={setDetail(i, "packedQty")} /></Field>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="Units Dispatched"><TextInput type="number" placeholder="e.g. 495000" value={det.dispatchQty || ""} onChange={setDetail(i, "dispatchQty")} /></Field>
                      <Field label="Rejected Units"><TextInput type="number" value={det.rejectedUnits || "0"} onChange={setDetail(i, "rejectedUnits")} /></Field>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="Damaged Units"><TextInput type="number" value={det.damagedUnits || "0"} onChange={setDetail(i, "damagedUnits")} /></Field>
                      <Field label="Balance Units (Auto)"><TextInput type="number" value={bal} readOnly style={{ background: C.white }} /></Field>
                    </div>

                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: C.navy }}>
                      Packaging Yield: <YieldBadge value={yieldPct} />
                    </div>
                  </Card>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <SecondaryButton onClick={() => setShowSplitSetup(true)} style={{ flex: 1 }}>← Back</SecondaryButton>
              <PrimaryButton onClick={saveAll} style={{ flex: 2 }}>Save Packaging Records</PrimaryButton>
            </div>
          </>
        )}
      </Card>

      <SectionHeading title={`Recent Packaging Records`} small />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {deptCBs.map((cb) => {
          const calc = computeCB(cb, motherBatches);
          return (
            <Card key={cb.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{cb.id} · {cb.productName}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    Batch #{cb.batchNumber} · Packed: {fmtNum(cb.packedQty)} ({calc.packedLakh ? `${calc.packedLakh} Lakhs` : "—"})
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <YieldBadge value={calc.pkgYield} />
                    <div style={{ fontSize: 10, color: C.sub }}>Pkg Yield</div>
                  </div>
                  <button type="button" className="btn-nav btn-delete" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => deleteCB(cb.id)}>🗑️ Delete</button>
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

function BatchSplitVisual({ mb, commercialBatches }) {
  const linked = commercialBatches.filter((c) => c.mbId === mb.id);
  if (linked.length === 0) return null;
  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.line}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Commercial Batches Created</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {linked.map((cb) => {
          const cbCalc = computeCB(cb, [mb]);
          return (
            <div key={cb.id} style={{ fontSize: 12, background: C.paleBg, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.line}` }}>
              <b style={{ color: C.navy }}>{cb.productName}</b> <span style={{ color: C.sub }}>#{cb.batchNumber}</span> · Packed: <b>{fmtNum(cb.packedQty)}</b> ({cbCalc.packedLakh ? `${cbCalc.packedLakh} Lakhs` : "—"})
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// EXECUTIVE MANAGER DASHBOARD — FULL COMMERCIAL BATCH YIELD & DUAL UNITS
// ============================================================================
function ManagerScreen({ motherBatches, setMotherBatches, commercialBatches, setCommercialBatches, onOpenRegister }) {
  const [activeTab, setActiveTab] = useState("mother"); // "mother" or "commercial"
  const [deptFilter, setDeptFilter] = useState("all");

  const filteredMBs = deptFilter === "all" ? motherBatches : motherBatches.filter((m) => m.dept === deptFilter);
  const filteredCBs = deptFilter === "all" ? commercialBatches : commercialBatches.filter((c) => c.dept === deptFilter);

  const mbRows = filteredMBs.map((mb) => ({ mb, calc: computeMB(mb, commercialBatches) }));
  const cbRows = filteredCBs.map((cb) => ({ cb, calc: computeCB(cb, motherBatches) }));

  const deleteMB = async (mbId) => {
    if (!window.confirm(`Are you sure you want to delete Mother Batch ${mbId}?`)) return;

    const updatedMBs = motherBatches.filter((m) => m.id !== mbId);
    const updatedCBs = commercialBatches.filter((c) => c.mbId !== mbId);

    setMotherBatches(updatedMBs);
    setCommercialBatches(updatedCBs);

    deleteSharedRow("mother_batches", mbId);
    await saveShared("dpyms_mother_batches", updatedMBs);
    await saveShared("dpyms_commercial_batches", updatedCBs);
  };

  const deleteCB = async (cbId) => {
    if (!window.confirm(`Are you sure you want to delete Commercial Batch ${cbId}?`)) return;

    const updatedCBs = commercialBatches.filter((c) => c.id !== cbId);
    setCommercialBatches(updatedCBs);

    deleteSharedRow("commercial_batches", cbId);
    await saveShared("dpyms_commercial_batches", updatedCBs);
  };

  const loadSamplePlantData = async () => {
    setMotherBatches(SAMPLE_MOTHER_BATCHES);
    setCommercialBatches(SAMPLE_COMMERCIAL_BATCHES);
    await saveShared("dpyms_mother_batches", SAMPLE_MOTHER_BATCHES);
    await saveShared("dpyms_commercial_batches", SAMPLE_COMMERCIAL_BATCHES);
  };

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

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading
        eyebrow="Manager Dashboard"
        title="Plant-Wide Manufacturing & Yield Overview"
        sub="Mother Batch Multi-stage Analytics & Full Commercial Batch Yield Calculations."
        right={
          <div style={{ display: "flex", gap: 10 }}>
            {motherBatches.length === 0 && (
              <SecondaryButton onClick={loadSamplePlantData}>🧪 Load Sample Plant Data</SecondaryButton>
            )}
            <SecondaryButton onClick={onOpenRegister}>Open Plant Register & Reports →</SecondaryButton>
          </div>
        }
      />

      {/* Main Mode Toggle: Mother Batches vs Commercial Batches */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("mother")}
          style={{
            flex: 1, padding: "12px 18px", borderRadius: 12, border: `1.5px solid ${C.navy}`,
            background: activeTab === "mother" ? C.navy : C.white,
            color: activeTab === "mother" ? C.white : C.navy,
            fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          📊 Mother Batches Overview ({filteredMBs.length})
        </button>
        <button
          onClick={() => setActiveTab("commercial")}
          style={{
            flex: 1, padding: "12px 18px", borderRadius: 12, border: `1.5px solid ${C.navy}`,
            background: activeTab === "commercial" ? C.navy : C.white,
            color: activeTab === "commercial" ? C.white : C.navy,
            fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          📦 Commercial Batches & Yields ({filteredCBs.length})
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <FilterChip active={deptFilter === "all"} onClick={() => setDeptFilter("all")} label="All Product Lines" />
        {DEPT_LIST.map((d) => (
          <FilterChip key={d.key} active={deptFilter === d.key} onClick={() => setDeptFilter(d.key)} label={`${d.label}`} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 22 }}>
        <Card style={{ padding: "16px" }}>
          <Stat label="Mother Batches" value={totals.batches} />
        </Card>
        <Card style={{ padding: "16px" }}>
          <Stat label="Total Planned Production" value={`${totals.totalPlannedLakhs} Lakhs (${totals.totalPlannedKg} kg)`} />
        </Card>
        <Card style={{ padding: "16px" }}>
          <Stat label="Total Dispatched Units" value={`${totals.totalDispatchedLakhs} Lakhs (${fmtNum(totals.totalDispatchedUnits)})`} />
        </Card>
        <Card style={{ padding: "16px" }}>
          <Stat label="QA Approved Batches" value={totals.approvedQA} />
        </Card>
        <Card style={{ padding: "16px" }}>
          <Stat label="Pending QA Clearance" value={totals.pendingQA} />
        </Card>
      </div>

      {deptFilter === "all" && activeTab === "mother" && (
        <>
          <SectionHeading title="Department Production Summaries (Kg & Lakhs)" small />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 26 }}>
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
        </>
      )}

      {activeTab === "mother" ? (
        <>
          <SectionHeading title="Mother Batches — Stage Yield Breakdown" small sub="Granulation, Compression, Coating & Packaging Totals" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mbRows.length === 0 && (
              <Card style={{ padding: 30, textAlign: "center" }}>
                <EmptyNote text="No active mother batches in this section yet." />
                <div style={{ marginTop: 14 }}>
                  <SecondaryButton onClick={loadSamplePlantData}>🧪 Click here to load sample data for testing</SecondaryButton>
                </div>
              </Card>
            )}
            {mbRows.map(({ mb, calc }) => {
              const isTablet = mb.dept === "tablet";
              const isCapsule = mb.dept === "capsule";

              return (
                <Card key={mb.id} style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
                        {mb.id} · {mb.genericName || "Untitled"} <DeptTag dept={mb.dept} />
                      </div>
                      <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>
                        Group: <b>{mb.productGroup || "N/A"}</b> · {fmtDate(mb.date)}{mb.loggedBy ? ` · Logged by ${mb.loggedBy}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <StatusPill status={mb.qaStatus || "Pending"} />
                      <button type="button" className="btn-nav btn-delete" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => deleteMB(mb.id)}>🗑️ Delete</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginTop: 16, fontSize: 13 }}>
                    <Stat label="Planned Batch" value={`${calc.plannedLakh || "—"} Lakhs (${calc.totalBatchKg || "—"} kg)`} />
                    {isTablet && (
                      <>
                        <Stat label="Granulation Output" value={`${mb.granOutput || "—"} kg (${calc.granLakh || "—"} Lakhs)`} />
                        <Stat label="Gran Yield" value={<YieldBadge value={calc.granYield} />} />
                        <Stat label="Compression Output" value={`${mb.compOutput || "—"} kg (${calc.compLakh || "—"} Lakhs)`} />
                        <Stat label="Comp Yield" value={<YieldBadge value={calc.compYield} />} />
                        <Stat label="Coating Output" value={calc.coat === "NA" ? "NA" : `${mb.coatOutput || "—"} kg (${calc.coatLakh || "—"} Lakhs)`} />
                        <Stat label="Coat Yield" value={<YieldBadge value={calc.coatYield} />} />
                      </>
                    )}
                    {isCapsule && (
                      <>
                        <Stat label="Granulation Output" value={`${mb.granOutput || "—"} kg (${calc.granLakh || "—"} Lakhs)`} />
                        <Stat label="Gran Yield" value={<YieldBadge value={calc.granYield} />} />
                        <Stat label="Filling Output" value={`${mb.compOutput || "—"} kg (${calc.compLakh || "—"} Lakhs)`} />
                        <Stat label="Fill Yield" value={<YieldBadge value={calc.compYield} />} />
                      </>
                    )}
                    <Stat label="Total Packed" value={`${calc.packedLakhTotal} Lakhs ${calc.packedKgTotal ? `(${calc.packedKgTotal} kg)` : ""}`} />
                    <Stat label="Total Dispatched" value={`${calc.dispatchLakhTotal} Lakhs ${calc.dispatchKgTotal ? `(${calc.dispatchKgTotal} kg)` : ""}`} />
                  </div>

                  <BatchSplitVisual mb={mb} commercialBatches={commercialBatches} />
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <SectionHeading title="Commercial Batches — Complete Yield & Packaging Analytics" small sub="Full breakdown of Units Received, Packed, Dispatched, Losses, Packaging Yield & Dispatch Yield" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {cbRows.length === 0 && <EmptyNote text="No commercial batches logged yet in this section." />}
            {cbRows.map(({ cb, calc }) => (
              <Card key={cb.id} style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: C.navy, display: "flex", alignItems: "center", gap: 10 }}>
                      {cb.id} · {cb.productName} <span style={{ background: C.paleBg, border: `1px solid ${C.line}`, color: C.sub, fontSize: 12, padding: "2px 8px", borderRadius: 6 }}>#{cb.batchNumber}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>
                      Linked Mother Batch: <b>{cb.mbId}</b> · Date: {fmtDate(cb.date)}{cb.loggedBy ? ` · Supervisor: ${cb.loggedBy}` : ""}
                    </div>
                  </div>
                  <button type="button" className="btn-nav btn-delete" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => deleteCB(cb.id)}>🗑️ Delete</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginTop: 16, fontSize: 13 }}>
                  <Stat label="Units Received" value={`${calc.recvLakh ? `${calc.recvLakh} Lakhs` : "—"} (${fmtNum(cb.unitsReceived)})`} />
                  <Stat label="Units Packed" value={`${calc.packedLakh ? `${calc.packedLakh} Lakhs` : "—"} (${fmtNum(cb.packedQty)})`} />
                  <Stat label="Units Dispatched" value={`${calc.dispatchLakh ? `${calc.dispatchLakh} Lakhs` : "—"} (${fmtNum(cb.dispatchQty)})`} />
                  <Stat label="Rejections / Damaged" value={`${fmtNum(cb.rejectedUnits || 0)} / ${fmtNum(cb.damagedUnits || 0)}`} />
                  <Stat label="Balance Units" value={fmtNum(calc.balanceUnits)} />
                  <Stat label="Packaging Yield" value={<YieldBadge value={calc.pkgYield} />} />
                  <Stat label="Dispatch Yield" value={<YieldBadge value={calc.dispatchYield} />} />
                  <Stat label="Final Overall Yield" value={<YieldBadge value={calc.finalYield} />} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
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
// PLANT REGISTER & PRINTABLE GMP REPORTS
// ============================================================================
function PlantRegister({ motherBatches, setMotherBatches, commercialBatches, setCommercialBatches, onBack }) {
  const [tab, setTab] = useState("mother");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filterList = (list, textFields) =>
    list.filter((r) => {
      if (deptFilter !== "all" && r.dept !== deptFilter) return false;
      if (search) {
        const hay = textFields.map((f) => (r[f] || "").toString().toLowerCase()).join(" ");
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });

  const mbFiltered = sortNewestFirst(filterList(motherBatches, ["id", "genericName", "productGroup", "loggedBy"]));
  const cbFiltered = sortNewestFirst(filterList(commercialBatches, ["id", "productName", "batchNumber", "mbId", "loggedBy"]));

  const deleteMB = async (mbId) => {
    if (!window.confirm(`Delete Mother Batch ${mbId}?`)) return;
    const updatedMBs = motherBatches.filter(m => m.id !== mbId);
    const updatedCBs = commercialBatches.filter(c => c.mbId !== mbId);
    setMotherBatches(updatedMBs);
    setCommercialBatches(updatedCBs);
    deleteSharedRow("mother_batches", mbId);
    await saveShared("dpyms_mother_batches", updatedMBs);
    await saveShared("dpyms_commercial_batches", updatedCBs);
  };

  const deleteCB = async (cbId) => {
    if (!window.confirm(`Delete Commercial Batch ${cbId}?`)) return;
    const updatedCBs = commercialBatches.filter(c => c.id !== cbId);
    setCommercialBatches(updatedCBs);
    deleteSharedRow("commercial_batches", cbId);
    await saveShared("dpyms_commercial_batches", updatedCBs);
  };

  const exportMother = () => {
    const headers = [
      { key: "id", label: "MB ID" }, { key: "dept", label: "Department" }, { key: "date", label: "Date" },
      { key: "genericName", label: "Generic Name" }, { key: "plannedLakh", label: "Planned (Lakh)" },
      { key: "totalBatchKg", label: "Planned (Kg)" }, { key: "granYield", label: "Gran Yield %" },
      { key: "compYield", label: "Comp Yield %" }, { key: "coatYield", label: "Coat Yield %" },
      { key: "qaStatus", label: "QA Status" }
    ];
    const rows = mbFiltered.map((mb) => ({ ...mb, ...computeMB(mb, commercialBatches) }));
    downloadCSV(`DPYMS_Mother_Batches_${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows, headers));
  };

  const exportCommercial = () => {
    const headers = [
      { key: "id", label: "CB ID" }, { key: "productName", label: "Product Name" }, { key: "batchNumber", label: "Batch Number" },
      { key: "packedQty", label: "Packed Qty" }, { key: "packedLakh", label: "Packed (Lakh)" }, { key: "dispatchQty", label: "Dispatch Qty" }, { key: "dispatchLakh", label: "Dispatch (Lakh)" }, { key: "pkgYield", label: "Pkg Yield %" }
    ];
    const rows = cbFiltered.map((cb) => ({ ...cb, ...computeCB(cb, motherBatches) }));
    downloadCSV(`DPYMS_Commercial_Batches_${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows, headers));
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 16px 60px" }}>
      <div className="no-print">
        <SectionHeading
          eyebrow="Plant Register"
          title="Complete Plant Records & GMP Reports"
          sub="Filter, search, export CSV, edit or delete records."
          right={
            <div style={{ display: "flex", gap: 10 }}>
              <SecondaryButton onClick={onBack}>← Back to Dashboard</SecondaryButton>
              <PrimaryButton onClick={() => window.print()} style={{ width: "auto" }}>🖨️ Print Report</PrimaryButton>
            </div>
          }
        />

        <Card style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={() => setTab("mother")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${C.navy}`, background: tab === "mother" ? C.navy : C.white, color: tab === "mother" ? C.white : C.navy, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Mother Batches ({mbFiltered.length})
            </button>
            <button onClick={() => setTab("commercial")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${C.navy}`, background: tab === "commercial" ? C.navy : C.white, color: tab === "commercial" ? C.white : C.navy, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Commercial Batches ({cbFiltered.length})
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Filter by Section">
              <SelectInput value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="all">All Sections</option>
                {DEPT_LIST.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
              </SelectInput>
            </Field>
            <Field label="Search Register"><TextInput placeholder="Search ID, Generic Name, Batch No..." value={search} onChange={(e) => setSearch(e.target.value)} /></Field>
          </div>

          <SecondaryButton onClick={tab === "mother" ? exportMother : exportCommercial}>
            ⬇ Export {tab === "mother" ? "Mother Batches" : "Commercial Batches"} to Excel (CSV)
          </SecondaryButton>
        </Card>
      </div>

      <div style={{ background: C.white, padding: 30, borderRadius: 16, border: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${C.navy}`, paddingBottom: 16, marginBottom: 20 }}>
          <img src={BRAND_LOGO} alt="Danish Healthcare" style={{ height: 50 }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: FONT_DISPLAY }}>DANISH HEALTH CARE (P) LTD.</div>
            <div style={{ fontSize: 11, color: C.sub }}>76/27-29, Industrial Estate, Maxi Road, Ujjain 456010</div>
            <div style={{ fontSize: 11, color: C.blue, fontWeight: 700 }}>GMP PRODUCTION YIELD REGISTER</div>
          </div>
        </div>

        {tab === "mother" ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.navy, color: C.white }}>
                <th style={{ padding: 8, textAlign: "left" }}>Date</th>
                <th style={{ padding: 8, textAlign: "left" }}>MB ID</th>
                <th style={{ padding: 8, textAlign: "left" }}>Product</th>
                <th style={{ padding: 8, textAlign: "left" }}>Planned (Lakhs & Kg)</th>
                <th style={{ padding: 8, textAlign: "left" }}>Gran Output</th>
                <th style={{ padding: 8, textAlign: "left" }}>Comp Output</th>
                <th style={{ padding: 8, textAlign: "left" }}>Coat Output</th>
                <th style={{ padding: 8, textAlign: "left" }}>QA Status</th>
                <th style={{ padding: 8, textAlign: "center" }} className="no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {mbFiltered.map((mb, i) => {
                const calc = computeMB(mb, commercialBatches);
                return (
                  <tr key={mb.id} style={{ borderBottom: `1px solid ${C.line}`, background: i % 2 === 0 ? C.white : C.paleBg }}>
                    <td style={{ padding: 8 }}>{fmtDate(mb.date)}</td>
                    <td style={{ padding: 8, fontWeight: 700 }}>{mb.id}</td>
                    <td style={{ padding: 8 }}>{mb.genericName}</td>
                    <td style={{ padding: 8, fontWeight: 700 }}>{calc.plannedLakh ? `${calc.plannedLakh} L` : "—"} ({calc.totalBatchKg ? `${calc.totalBatchKg} kg` : "—"})</td>
                    <td style={{ padding: 8 }}>{mb.granOutput ? `${mb.granOutput} kg (${calc.granLakh} L)` : "—"}</td>
                    <td style={{ padding: 8 }}>{mb.compOutput ? `${mb.compOutput} kg (${calc.compLakh} L)` : "—"}</td>
                    <td style={{ padding: 8 }}>{mb.coatOutput ? `${mb.coatOutput} kg (${calc.coatLakh} L)` : "—"}</td>
                    <td style={{ padding: 8 }}><StatusPill status={mb.qaStatus || "Pending"} /></td>
                    <td style={{ padding: 8, textAlign: "center" }} className="no-print">
                      <button type="button" className="btn-nav btn-delete" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => deleteMB(mb.id)}>🗑️ Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.navy, color: C.white }}>
                <th style={{ padding: 8, textAlign: "left" }}>Date</th>
                <th style={{ padding: 8, textAlign: "left" }}>CB ID</th>
                <th style={{ padding: 8, textAlign: "left" }}>Product</th>
                <th style={{ padding: 8, textAlign: "left" }}>Batch No.</th>
                <th style={{ padding: 8, textAlign: "left" }}>Packed (Lakhs & Counts)</th>
                <th style={{ padding: 8, textAlign: "left" }}>Dispatched (Lakhs & Counts)</th>
                <th style={{ padding: 8, textAlign: "left" }}>Pkg Yield</th>
                <th style={{ padding: 8, textAlign: "center" }} className="no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {cbFiltered.map((cb, i) => {
                const calc = computeCB(cb, motherBatches);
                return (
                  <tr key={cb.id} style={{ borderBottom: `1px solid ${C.line}`, background: i % 2 === 0 ? C.white : C.paleBg }}>
                    <td style={{ padding: 8 }}>{fmtDate(cb.date)}</td>
                    <td style={{ padding: 8, fontWeight: 700 }}>{cb.id}</td>
                    <td style={{ padding: 8 }}>{cb.productName}</td>
                    <td style={{ padding: 8 }}>{cb.batchNumber}</td>
                    <td style={{ padding: 8 }}>{calc.packedLakh ? `${calc.packedLakh} L` : "—"} ({fmtNum(cb.packedQty)})</td>
                    <td style={{ padding: 8 }}>{calc.dispatchLakh ? `${calc.dispatchLakh} L` : "—"} ({fmtNum(cb.dispatchQty)})</td>
                    <td style={{ padding: 8 }}><YieldBadge value={calc.pkgYield} /></td>
                    <td style={{ padding: 8, textAlign: "center" }} className="no-print">
                      <button type="button" className="btn-nav btn-delete" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => deleteCB(cb.id)}>🗑️ Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ROOT APP
// ============================================================================
function App() {
  const [step, setStep] = useState("role");
  const [role, setRole] = useState(null);
  const [dept, setDept] = useState(null);
  const [userName, setUserName] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const [motherBatches, setMotherBatches] = useState([]);
  const [commercialBatches, setCommercialBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const mb = await loadShared("dpyms_mother_batches", SAMPLE_MOTHER_BATCHES);
      const cb = await loadShared("dpyms_commercial_batches", SAMPLE_COMMERCIAL_BATCHES);
      setMotherBatches(sortNewestFirst(mb));
      setCommercialBatches(sortNewestFirst(cb));
      setLoading(false);
    })();
  }, []);

  const pickRole = (r) => {
    setRole(r);
    if (r === "manager") setStep("screen");
    else setStep("department");
  };
  const pickDept = (d) => { setDept(d); setStep("screen"); };
  const changeDept = () => { setStep("department"); };
  const goHome = () => { setRole(null); setDept(null); setUserName(""); setShowRegister(false); setStep("role"); };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.paleBg, fontFamily: FONT_BODY, color: C.sub }}>
        Loading DPYMS v2…
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

  const deptLabel = dept ? DEPARTMENTS[dept].label : null;

  return (
    <div style={{ minHeight: "100vh", background: C.paleBg, fontFamily: FONT_BODY }}>
      <TopBar
        roleLabel={roleLabel}
        deptLabel={deptLabel}
        userName={userName}
        onSwitchRole={goHome}
        onChangeDept={changeDept}
        showDeptChange={role !== "manager"}
        onOpenRegister={() => setShowRegister(true)}
        showRegisterLink={role === "manager"}
      />
      {role === "manager" && showRegister && (
        <PlantRegister motherBatches={motherBatches} setMotherBatches={setMotherBatches} commercialBatches={commercialBatches} setCommercialBatches={setCommercialBatches} onBack={() => setShowRegister(false)} />
      )}
      {role === "manager" && !showRegister && (
        <ManagerScreen motherBatches={motherBatches} setMotherBatches={setMotherBatches} commercialBatches={commercialBatches} setCommercialBatches={setCommercialBatches} onOpenRegister={() => setShowRegister(true)} />
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

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
