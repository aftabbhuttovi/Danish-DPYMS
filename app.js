const { useState, useEffect, useMemo } = React;

/* ============================================================================
   DANISH HEALTH CARE (P) LTD. — DPYMS v2
   Digital Production Yield Management System
   Departments: Tablets, Capsules, ORS (sachets), Ointment (tubes)
   Roles: Production, Packaging/QA, Manager — each department-gated by password
============================================================================ */

// ---------- palette (from plant signage) ----------
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

const ROLE_HASHES = {
  production: '97f08b12c985e818cb86cd3d6f7c4dec65a586d95874ce54db426d20d383ab2a',
  packaging: 'e97af628deabddcc642d00c9b0fa3c488e54fe9bbe557975e5f45e5c9f04ea82',
  manager: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
};

// ---------- department config ----------
// Tablets & Capsules use the kg -> Lakh Tabs model (Gran/Comp/Coat).
// ORS uses sachets with manually typed gram weight per sachet.
// Ointment uses tubes with manually typed gram weight per tube.
const DEPARTMENTS = {
  tablet:   { key: "tablet",   label: "Tablets",   unit: "Lakh Tabs", icon: "💊", stages: ["gran", "comp", "coat"] },
  capsule:  { key: "capsule",  label: "Capsules",  unit: "Lakh Caps", icon: "⬤", stages: ["gran", "comp", "coat"] },
  ors:      { key: "ors",      label: "ORS",       unit: "Lakh Sachets", icon: "🥤", stages: ["mix", "fill"] },
  ointment: { key: "ointment", label: "Ointment",  unit: "Lakh Tubes", icon: "🧴", stages: ["mix", "fill"] },
};
const DEPT_LIST = Object.values(DEPARTMENTS);

// ---------- storage helpers (shared across all users of this artifact) ----------
async function loadShared(key, fallback) {
  if (typeof window === "undefined" || !window.storage || typeof window.storage.get !== "function") {
    console.error("window.storage.get is not available in this environment");
    return fallback;
  }
  try {
    const res = await window.storage.get(key, true);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    console.error("load failed", key, e);
  }
  return fallback;
}
async function saveShared(key, value, attempt = 1) {
  if (typeof window === "undefined" || !window.storage || typeof window.storage.set !== "function") {
    return { ok: false, error: "window.storage is not available in this environment (are you viewing this outside the Claude artifact panel?)" };
  }
  try {
    const res = await window.storage.set(key, JSON.stringify(value), true);
    if (!res) throw new Error("storage.set returned an empty result — the write may have been rejected");
    return { ok: true };
  } catch (e) {
    console.error("save failed", key, "attempt", attempt, e);
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
      return saveShared(key, value, attempt + 1);
    }
    const msg = (e && e.message) ? e.message : (typeof e === "string" ? e : "Unknown error (see browser console for details)");
    return { ok: false, error: msg };
  }
}

// ---------- number helpers ----------
const round2 = (n) => (isFinite(n) ? Math.round(n * 100) / 100 : "");
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
// ORS/Ointment: quantity is manually counted (sachets/tubes), weight per unit is
// manually typed in grams. Lakh units = qty / 100000. Total kg = qty * gramWt / 1000.
function totalKgFromUnitsAndGrams(qty, gramsPerUnit) {
  const q = parseFloat(qty), g = parseFloat(gramsPerUnit);
  if (!isFinite(q) || !isFinite(g)) return "";
  return round2((q * g) / 1000);
}

// ---------- calculations: Tablet/Capsule Mother Batch (kg-based) ----------
function computeMB_TabletCapsule(mbRaw, commercialBatches) {
  const wt = parseFloat(mbRaw.avgUnitWt);
  const batchWt = parseFloat(mbRaw.plannedBatchWt);
  const rr = parseFloat(mbRaw.rrGran) || 0;
  const totalBatch = isFinite(batchWt) ? batchWt + rr : "";
  const plannedLakh = totalBatch !== "" ? lakhUnitsFromKg(totalBatch, wt) : "";

  const gran = parseFloat(mbRaw.granOutput);
  const granLakh = isFinite(gran) ? lakhUnitsFromKg(gran, wt) : "";
  const granYield = isFinite(gran) && totalBatch !== "" ? pct(gran, totalBatch) : "";

  const comp = parseFloat(mbRaw.compOutput);
  const compLakh = isFinite(comp) ? lakhUnitsFromKg(comp, wt) : "";
  const compYield = isFinite(comp) && isFinite(gran) ? pct(comp, gran) : "";

  const coated = mbRaw.coated === "Y";
  const coat = parseFloat(mbRaw.coatOutput);
  const coatLakh = coated && isFinite(coat) ? lakhUnitsFromKg(coat, wt) : "";
  const coatYield = !coated ? "NA" : isFinite(coat) && isFinite(comp) ? pct(coat, comp) : "";

  const linked = commercialBatches.filter((cb) => cb.mbId === mbRaw.id);
  const allocatedLakh = round2(
    linked.reduce((sum, cb) => {
      const kg = parseFloat(cb.allocatedKg);
      const g = isFinite(kg) ? lakhUnitsFromKg(kg, wt) : "";
      return sum + (typeof g === "number" ? g : 0);
    }, 0)
  );
  const packedLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.packedQty)) ? parseFloat(cb.packedQty) / 100000 : 0), 0)
  );
  const dispatchLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.dispatchQty)) ? parseFloat(cb.dispatchQty) / 100000 : 0), 0)
  );

  const unallocated = plannedLakh !== "" ? round2(plannedLakh - allocatedLakh) : "";
  let status = "";
  if (plannedLakh !== "") {
    if (unallocated === 0) status = "Fully Allocated";
    else if (unallocated > 0) status = "Under-allocated";
    else status = "OVER-ALLOCATED!";
  }

  return {
    totalBatch, plannedLakh,
    gran, granLakh, granYield,
    comp, compLakh, compYield,
    coat: coated ? coat : "NA", coatLakh: coated ? coatLakh : "NA", coatYield,
    allocatedLakh, packedLakhTotal, dispatchLakhTotal, unallocated, status,
    linkedCount: linked.length,
  };
}

// ---------- calculations: ORS/Ointment Mother Batch (manual unit-count based) ----------
// Planned quantity + weight-per-unit typed manually; Mix/Fill are the two stages.
function computeMB_OrsOintment(mbRaw, commercialBatches) {
  const plannedQty = parseFloat(mbRaw.plannedQty); // sachets or tubes
  const plannedLakh = isFinite(plannedQty) ? lakhFromUnits(plannedQty) : "";

  const mixOutputKg = parseFloat(mbRaw.mixOutputKg);
  const fillQty = parseFloat(mbRaw.fillOutputQty); // sachets/tubes actually filled
  const fillLakh = isFinite(fillQty) ? lakhFromUnits(fillQty) : "";
  const fillYield = isFinite(fillQty) && plannedQty ? pct(fillQty, plannedQty) : "";

  const linked = commercialBatches.filter((cb) => cb.mbId === mbRaw.id);
  const allocatedLakh = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.allocatedQty)) ? parseFloat(cb.allocatedQty) / 100000 : 0), 0)
  );
  const packedLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.packedQty)) ? parseFloat(cb.packedQty) / 100000 : 0), 0)
  );
  const dispatchLakhTotal = round2(
    linked.reduce((sum, cb) => sum + (isFinite(parseFloat(cb.dispatchQty)) ? parseFloat(cb.dispatchQty) / 100000 : 0), 0)
  );

  const unallocated = plannedLakh !== "" ? round2(plannedLakh - allocatedLakh) : "";
  let status = "";
  if (plannedLakh !== "") {
    if (unallocated === 0) status = "Fully Allocated";
    else if (unallocated > 0) status = "Under-allocated";
    else status = "OVER-ALLOCATED!";
  }

  return {
    plannedQty, plannedLakh, mixOutputKg,
    fillQty, fillLakh, fillYield,
    allocatedLakh, packedLakhTotal, dispatchLakhTotal, unallocated, status,
    linkedCount: linked.length,
  };
}

function computeMB(mbRaw, commercialBatches) {
  if (mbRaw.dept === "ors" || mbRaw.dept === "ointment") {
    return computeMB_OrsOintment(mbRaw, commercialBatches);
  }
  return computeMB_TabletCapsule(mbRaw, commercialBatches);
}

// ---------- calculations: Commercial Batch ----------
function computeCB(cbRaw, motherBatches) {
  const mb = motherBatches.find((m) => m.id === cbRaw.mbId);
  const dept = mb ? mb.dept : cbRaw.dept;

  if (dept === "ors" || dept === "ointment") {
    const allocQty = parseFloat(cbRaw.allocatedQty);
    const allocLakh = isFinite(allocQty) ? lakhFromUnits(allocQty) : "";
    const packed = parseFloat(cbRaw.packedQty);
    const packedLakh = isFinite(packed) ? lakhFromUnits(packed) : "";
    const dispatch = parseFloat(cbRaw.dispatchQty);
    const dispatchLakh = isFinite(dispatch) ? lakhFromUnits(dispatch) : "";
    const finalYield = typeof allocLakh === "number" && isFinite(dispatch) ? pct(dispatchLakh, allocLakh) : "";
    const gramWt = parseFloat(cbRaw.gramWtPerUnit);
    const totalKg = isFinite(packed) && isFinite(gramWt) ? totalKgFromUnitsAndGrams(packed, gramWt) : "";
    return { mb, allocLakh, packed, packedLakh, dispatch, dispatchLakh, finalYield, totalKg };
  }

  const avgWt = mb ? parseFloat(mb.avgUnitWt) : NaN;
  const kg = parseFloat(cbRaw.allocatedKg);
  const allocLakh = isFinite(kg) && isFinite(avgWt) ? lakhUnitsFromKg(kg, avgWt) : "";
  const packed = parseFloat(cbRaw.packedQty);
  const packedLakh = isFinite(packed) ? lakhFromUnits(packed) : "";
  const dispatch = parseFloat(cbRaw.dispatchQty);
  const dispatchLakh = isFinite(dispatch) ? lakhFromUnits(dispatch) : "";
  const finalYield = typeof allocLakh === "number" && isFinite(dispatch) ? pct(dispatchLakh, allocLakh) : "";
  return { mb, avgWt, allocLakh, packed, packedLakh, dispatch, dispatchLakh, finalYield };
}

// ---------- id + sort helpers ----------
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

// ---------- CSV export (Excel-compatible) ----------
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

function LogoMark({ size = 40, light = false }) {
  const nodeColor = light ? "#DCEBFF" : C.skyBlue;
  const nodeDark = light ? "#FFFFFF" : C.navy2;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <line x1="14" y1="10" x2="24" y2="20" stroke={nodeColor} strokeWidth="2.5" />
      <line x1="24" y1="20" x2="18" y2="32" stroke={nodeColor} strokeWidth="2.5" />
      <line x1="18" y1="32" x2="28" y2="42" stroke={nodeColor} strokeWidth="2.5" />
      <line x1="28" y1="42" x2="24" y2="54" stroke={nodeColor} strokeWidth="2.5" />
      <line x1="18" y1="32" x2="8" y2="38" stroke={nodeColor} strokeWidth="2.5" />
      <circle cx="14" cy="10" r="6" fill={nodeColor} />
      <circle cx="24" cy="20" r="4.5" fill={nodeDark} />
      <circle cx="18" cy="32" r="5.5" fill={nodeColor} />
      <circle cx="28" cy="42" r="4" fill={nodeDark} />
      <circle cx="24" cy="54" r="5" fill={nodeColor} />
      <circle cx="8" cy="38" r="4" fill={nodeDark} />
    </svg>
  );
}

function BrandHeader({ small }) {
  return (
    <div style={{ textAlign: "center", marginBottom: small ? 24 : 40 }}>
      <div
        style={{
          width: small ? 54 : 72, height: small ? 54 : 72, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.25)",
          margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <LogoMark size={small ? 30 : 40} light />
      </div>
      <h1 style={{ color: C.white, fontFamily: FONT_DISPLAY, fontSize: small ? 21 : 26, fontWeight: 700, margin: 0, letterSpacing: 0.3 }}>
        danish<span style={{ fontWeight: 400 }}>healthcare</span>
      </h1>
      <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4, fontStyle: "italic" }}>
        hope. health. life...
      </div>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, letterSpacing: 1.5, marginTop: 14, textTransform: "uppercase" }}>
        DANISH HEALTH CARE (P) LTD. · UJJAIN
      </div>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 8 }}>
        Digital Production Yield Management System
      </div>
    </div>
  );
}

// ---------- ROLE PICKER (step 1) ----------
function RolePicker({ onPick, storageWarning }) {
  const roles = [
    { key: "production", label: "Production", desc: "Log Mother Batches — all departments", icon: "⚗" },
    { key: "packaging", label: "Packaging / QA", desc: "Log Commercial Batches — Packing, Dispatch, Yield", icon: "📦" },
    { key: "manager", label: "Manager Dashboard", desc: "Full plant view — every stage, every batch, live", icon: "◈" },
  ];
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handlePick = async (e) => {
    e.preventDefault();
    const hash = await hashPassword(password);
    if (hash === ROLE_HASHES[selectedRole]) {
      onPick(selectedRole);
    } else {
      setErrorMsg("Incorrect password. Please try again.");
    }
  };

  if (selectedRole) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 55%, ${C.blue} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: FONT_BODY }}>
        <BrandHeader />
        <Card style={{ padding: 24, width: "100%", maxWidth: 360, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: 18, color: C.navy, fontFamily: FONT_DISPLAY }}>Enter Password</h2>
          <p style={{ margin: "0 0 16px 0", fontSize: 13, color: C.sub }}>
            Role: <strong>{roles.find(r => r.key === selectedRole).label}</strong>
          </p>
          <form onSubmit={handlePick}>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.line}`, marginBottom: 12, fontSize: 16 }}
              autoFocus
            />
            {errorMsg && <div style={{ color: C.bad, fontSize: 12, marginBottom: 12 }}>{errorMsg}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => { setSelectedRole(null); setErrorMsg(""); setPassword(""); }} style={{ flex: 1, padding: "12px", borderRadius: 8, background: C.white, border: `1px solid ${C.line}`, color: C.sub, cursor: "pointer", fontWeight: "bold" }}>Back</button>
              <button type="submit" style={{ flex: 1, padding: "12px", borderRadius: 8, background: C.navy, color: C.white, border: "none", cursor: "pointer", fontWeight: "bold" }}>Login</button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 55%, ${C.blue} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: FONT_BODY }}>
      <BrandHeader />
      {storageWarning && (
        <div style={{ background: "rgba(176,0,32,0.15)", border: "1px solid rgba(176,0,32,0.4)", color: "#FFD6D6", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, maxWidth: 420, marginBottom: 22, textAlign: "center" }}>
          ⚠ Shared storage isn't responding this session. Data you enter will stay visible on your own screen but may not sync to other devices or survive a refresh. Use the Manager's <b>Export</b> button often to keep a backup.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 420 }}>
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
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 36 }}>Pick your department role to continue</div>
    </div>
  );
}

// ---------- DEPARTMENT PICKER (for Production & Packaging) ----------
function DepartmentPicker({ onPick, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: C.paleBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: FONT_BODY }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.navy }}>Select Product Type</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>Choose which formulation you're logging today</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 420 }}>
        {DEPT_LIST.map((d) => (
          <button key={d.key} onClick={() => onPick(d.key)} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 14, padding: "22px 16px", cursor: "pointer", textAlign: "center", boxShadow: "0 1px 3px rgba(14,42,94,0.06)" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>{d.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>{d.label}</div>
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.sub, fontSize: 12.5, marginTop: 28, cursor: "pointer" }}>← Back</button>
    </div>
  );
}

function TopBar({ roleLabel, deptLabel, userName, onSwitchRole, onChangeDept, showDeptChange, onOpenRegister, showRegisterLink }) {
  return (
    <div style={{ background: C.navy, color: C.white, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LogoMark size={20} light />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, fontFamily: FONT_DISPLAY }}>danishhealthcare · DPYMS</div>
          <div style={{ fontSize: 10, color: C.skyBlue, letterSpacing: 0.5 }}>
            {roleLabel}{deptLabel ? ` · ${deptLabel}` : ""}{userName ? ` · ${userName}` : ""}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {showRegisterLink && (
          <button onClick={onOpenRegister} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", color: C.white, borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>
            Plant Register
          </button>
        )}
        {showDeptChange && (
          <button onClick={onChangeDept} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", color: C.white, borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>
            ← Change Department
          </button>
        )}
        <button onClick={onSwitchRole} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", color: C.white, borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>
          ← Home
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  let bg = C.line, fg = C.sub;
  if (status === "Fully Allocated" || status === "Approved") { bg = C.okBg; fg = C.ok; }
  else if (status === "Under-allocated" || status === "Pending" || status === "On Hold") { bg = C.warnBg; fg = C.warn; }
  else if (status === "OVER-ALLOCATED!" || status === "Rejected") { bg = C.badBg; fg = C.bad; }
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
    <span style={{ background: C.paleBg, border: `1px solid ${C.line}`, color: C.navy, fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
      {d.icon} {d.label}
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
function StorageIndicator({ status }) {
  const map = {
    connected: { color: C.ok, label: "Storage connected" },
    saving: { color: C.warn, label: "Saving…" },
    error: { color: C.bad, label: "Storage error — check connection" },
  };
  const s = map[status] || map.connected;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: s.color, marginBottom: 14 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
      {s.label}
    </div>
  );
}

// ============================================================================
// PRODUCTION SCREEN — Mother Batch entry, branches by department
// ============================================================================
function ProductionScreen({ dept, userName, motherBatches, setMotherBatches, commercialBatches, storageStatus, setStorageStatus }) {
  const isTabletCapsule = dept === "tablet" || dept === "capsule";
  const d = DEPARTMENTS[dept];

  const blank = isTabletCapsule
    ? {
        id: "", dept, date: new Date().toISOString().slice(0, 10), genericName: "", productGroup: "",
        avgUnitWt: "", plannedBatchWt: "", rrGran: "0", granOutput: "", compOutput: "", compRR: "0",
        coated: "N", coatOutput: "", remarks: "", loggedBy: userName || "",
        splitCount: "1", splitNames: "",
      }
    : {
        id: "", dept, date: new Date().toISOString().slice(0, 10), genericName: "", productGroup: "",
        plannedQty: "", mixOutputKg: "", fillOutputQty: "", remarks: "", loggedBy: userName || "",
        splitCount: "1", splitNames: "",
      };

  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { setForm(blank); }, [dept]); // eslint-disable-line

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (isTabletCapsule) {
      if (!form.genericName || !form.avgUnitWt || !form.plannedBatchWt) {
        setToast("Please fill Generic Name, Avg Unit Wt, and Batch Wt");
        return;
      }
    } else {
      if (!form.genericName || !form.plannedQty) {
        setToast("Please fill Generic Name and Planned Quantity");
        return;
      }
    }
    const id = genMBId(motherBatches, dept);
    const record = { ...form, id, createdAt: Date.now() };
    const updated = sortNewestFirst([record, ...motherBatches]);
    setMotherBatches(updated);
    setStorageStatus("saving");
    const result = await saveShared("dpyms_mother_batches", updated);
    setStorageStatus(result.ok ? "connected" : "error");
    setForm({ ...blank, date: new Date().toISOString().slice(0, 10) });
    setToast(result.ok ? `Mother Batch ${id} saved` : `Save failed: ${result.error || "unknown error"} — data kept on screen, try Save again`);
  };

  const deptBatches = motherBatches.filter((m) => m.dept === dept);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading eyebrow={`Production · ${d.label}`} title={`Log a ${d.label} Mother Batch`} sub="One entry per mother batch." />
      <StorageIndicator status={storageStatus} />

      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Date"><TextInput type="date" value={form.date} onChange={set("date")} /></Field>
          <Field label="Logged by"><TextInput placeholder="Your name" value={form.loggedBy} onChange={set("loggedBy")} /></Field>
        </div>

        <Field label="Generic Name">
          <TextInput placeholder={isTabletCapsule ? "e.g. LOPERAMIDE HCl TABLETS IP 2 MG" : dept === "ors" ? "e.g. ORS POWDER (WHO FORMULA)" : "e.g. CLOBETASOL PROPIONATE OINTMENT"} value={form.genericName} onChange={set("genericName")} />
        </Field>
        <Field label="Product Group" hint="The brand family this batch will be split across">
          <TextInput placeholder="e.g. LOPRABLUE / LOPAGONE GROUP" value={form.productGroup} onChange={set("productGroup")} />
        </Field>

        {isTabletCapsule ? (
          <>
            <Field label="Avg Unit Wt (mg)"><TextInput type="number" placeholder="e.g. 220" value={form.avgUnitWt} onChange={set("avgUnitWt")} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Planned Batch Wt (kg)"><TextInput type="number" placeholder="e.g. 418" value={form.plannedBatchWt} onChange={set("plannedBatchWt")} /></Field>
              <Field label="RR Added — Granulation (kg)"><TextInput type="number" value={form.rrGran} onChange={set("rrGran")} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Gran Output (kg)"><TextInput type="number" value={form.granOutput} onChange={set("granOutput")} /></Field>
              <Field label="Comp Output (kg)"><TextInput type="number" value={form.compOutput} onChange={set("compOutput")} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Comp RR (kg)"><TextInput type="number" value={form.compRR} onChange={set("compRR")} /></Field>
              <Field label="Coated?">
                <SelectInput value={form.coated} onChange={set("coated")}>
                  <option value="N">No — uncoated</option>
                  <option value="Y">Yes — coated</option>
                </SelectInput>
              </Field>
            </div>
            {form.coated === "Y" && (
              <Field label="Coat Output (kg)"><TextInput type="number" value={form.coatOutput} onChange={set("coatOutput")} /></Field>
            )}
          </>
        ) : (
          <>
            <Field label={`Planned Quantity (${dept === "ors" ? "sachets" : "tubes"})`}>
              <TextInput type="number" placeholder="e.g. 500000" value={form.plannedQty} onChange={set("plannedQty")} />
            </Field>
            <Field label="Mix Output (kg)" hint="Total bulk mix/paste weight produced">
              <TextInput type="number" value={form.mixOutputKg} onChange={set("mixOutputKg")} />
            </Field>
            <Field label={`Fill Output (${dept === "ors" ? "sachets" : "tubes"} actually filled)`}>
              <TextInput type="number" value={form.fillOutputQty} onChange={set("fillOutputQty")} />
            </Field>
          </>
        )}

        <Field label="Remarks (optional)"><TextInput value={form.remarks} onChange={set("remarks")} /></Field>

        <PrimaryButton onClick={submit} style={{ marginTop: 6 }}>Save Mother Batch</PrimaryButton>
      </Card>

      <SectionHeading title={`Recent ${d.label} Mother Batches`} small sub="Newest first" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {deptBatches.length === 0 && <EmptyNote text="No mother batches logged yet in this department." />}
        {deptBatches.map((mb) => {
          const calc = computeMB(mb, commercialBatches);
          const open = expandedId === mb.id;
          return (
            <Card key={mb.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }} onClick={() => setExpandedId(open ? null : mb.id)}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{mb.id} · {mb.genericName || "Untitled"}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    {fmtDate(mb.date)}{mb.loggedBy ? ` · by ${mb.loggedBy}` : ""} · Planned {calc.plannedLakh || "—"} {d.unit}
                  </div>
                </div>
                <StatusPill status={calc.status} />
              </div>
              {open && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 12.5 }}>
                  {isTabletCapsule ? (
                    <>
                      <Stat label="Gran Output" value={`${mb.granOutput || "—"} kg`} />
                      <Stat label="Gran Yield" value={<YieldBadge value={calc.granYield} />} />
                      <Stat label="Comp Output" value={`${mb.compOutput || "—"} kg`} />
                      <Stat label="Comp Yield" value={<YieldBadge value={calc.compYield} />} />
                      <Stat label="Coat Output" value={calc.coat === "NA" ? "NA" : `${mb.coatOutput || "—"} kg`} />
                      <Stat label="Coat Yield" value={<YieldBadge value={calc.coatYield} />} />
                    </>
                  ) : (
                    <>
                      <Stat label="Mix Output" value={`${mb.mixOutputKg || "—"} kg`} />
                      <Stat label="Fill Output" value={fmtNum(mb.fillOutputQty)} />
                      <Stat label="Fill Yield" value={<YieldBadge value={calc.fillYield} />} />
                    </>
                  )}
                  <Stat label="Allocated" value={`${calc.allocatedLakh} L`} />
                  <Stat label="Unallocated" value={`${calc.unallocated} L`} />
                  <Stat label="Splits" value={calc.linkedCount} />
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
// PACKAGING / QA SCREEN — Commercial Batch entry, with bulk multi-name split
// ============================================================================
function PackagingScreen({ dept, userName, setUserName, motherBatches, commercialBatches, setCommercialBatches, storageStatus, setStorageStatus }) {
  const d = DEPARTMENTS[dept];
  const isTabletCapsule = dept === "tablet" || dept === "capsule";
  const deptMBs = motherBatches.filter((m) => m.dept === dept);

  const [mbId, setMbId] = useState(deptMBs[0]?.id || "");
  useEffect(() => {
    if (!mbId && deptMBs[0]) setMbId(deptMBs[0].id);
  }, [deptMBs]); // eslint-disable-line

  const selectedMB = motherBatches.find((m) => m.id === mbId);
  const mbCalc = selectedMB ? computeMB(selectedMB, commercialBatches) : null;

  // ---- Step A: how many commercial batches to create, and their names ----
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

  // ---- Step B: per-batch detail entry (weight/qty, packed, dispatch) ----
  const detailBlank = isTabletCapsule
    ? { allocatedKg: "", packedQty: "", dispatchQty: "", qaStatus: "Pending", remarks: "" }
    : { allocatedQty: "", gramWtPerUnit: "", packedQty: "", dispatchQty: "", qaStatus: "Pending", remarks: "" };
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
    const missing = splitRows.some((r, i) => {
      const det = details[i] || {};
      return isTabletCapsule ? !det.allocatedKg : (!det.allocatedQty || !det.gramWtPerUnit);
    });
    if (missing) { setToast("Please fill the allocated amount for every batch"); return; }

    const newRecords = splitRows.map((r, i) => {
      const det = details[i] || {};
      return { r, det };
    });

    // generate sequential unique IDs
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
    setStorageStatus("saving");
    const result = await saveShared("dpyms_commercial_batches", updated);
    setStorageStatus(result.ok ? "connected" : "error");
    setToast(result.ok ? `${finalRecords.length} commercial batch(es) saved` : `Save failed: ${result.error || "unknown error"} — try Save again`);

    // reset for next round
    setSplitCount(1);
    setSplitRows([{ productName: "", batchNumber: "" }]);
    setDetails({});
    setShowSplitSetup(true);
  };

  const deptCBs = commercialBatches.filter((c) => c.dept === dept);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading eyebrow={`Packaging / QA · ${d.label}`} title="Log Commercial Batches" sub="Choose how many batches this Mother Batch splits into, name each, then fill details." />
      <StorageIndicator status={storageStatus} />

      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Logged by"><TextInput placeholder="Your name" value={userName} onChange={(e) => setUserName(e.target.value)} /></Field>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Field label="Mother Batch">
            <SelectInput value={mbId} onChange={(e) => setMbId(e.target.value)}>
              {deptMBs.length === 0 && <option value="">No mother batches available</option>}
              {deptMBs.map((mb) => <option key={mb.id} value={mb.id}>{mb.id} — {mb.genericName || "Untitled"}</option>)}
            </SelectInput>
          </Field>
        </div>

        {mbCalc && (
          <div style={{ background: C.paleBg, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span>Planned <b>{mbCalc.plannedLakh || "—"} L</b></span>
            <span>Allocated <b>{mbCalc.allocatedLakh} L</b></span>
            <span>Remaining <b style={{ color: mbCalc.unallocated < 0 ? C.bad : C.ink }}>{mbCalc.unallocated} L</b></span>
            <StatusPill status={mbCalc.status} />
          </div>
        )}

        {showSplitSetup ? (
          <>
            <Field label="Number of Commercial Batches" hint="How many products is this Mother Batch being split into?">
              <TextInput type="number" min="1" max="20" value={splitCount} onChange={(e) => applySplitCount(e.target.value)} />
            </Field>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {splitRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: C.paleBg, padding: 12, borderRadius: 10 }}>
                  <Field label={`Batch ${i + 1} — Product Name`}>
                    <TextInput placeholder="e.g. LOPRABLUE" value={row.productName} onChange={(e) => setSplitRows((prev) => prev.map((r, j) => j === i ? { ...r, productName: e.target.value } : r))} />
                  </Field>
                  <Field label={`Batch ${i + 1} — Batch Number`}>
                    <TextInput placeholder="e.g. LEA26001" value={row.batchNumber} onChange={(e) => setSplitRows((prev) => prev.map((r, j) => j === i ? { ...r, batchNumber: e.target.value } : r))} />
                  </Field>
                </div>
              ))}
            </div>
            <PrimaryButton onClick={startDetailEntry}>Continue to Batch Details →</PrimaryButton>
          </>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
              {splitRows.map((row, i) => {
                const det = details[i] || {};
                return (
                  <Card key={i} style={{ padding: 14, background: C.paleBg }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>
                      {row.productName} <span style={{ color: C.sub, fontWeight: 400 }}>· {row.batchNumber}</span>
                    </div>
                    {isTabletCapsule ? (
                      <Field label="Allocated Batch Wt (kg)" hint="Portion of mother batch given to this product">
                        <TextInput type="number" value={det.allocatedKg || ""} onChange={setDetail(i, "allocatedKg")} />
                      </Field>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Field label={`Allocated Qty (${dept === "ors" ? "sachets" : "tubes"})`}>
                          <TextInput type="number" value={det.allocatedQty || ""} onChange={setDetail(i, "allocatedQty")} />
                        </Field>
                        <Field label="Weight per Unit (g)" hint="Typed manually">
                          <TextInput type="number" value={det.gramWtPerUnit || ""} onChange={setDetail(i, "gramWtPerUnit")} />
                        </Field>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label={`Packed Qty (${isTabletCapsule ? "tabs" : dept === "ors" ? "sachets" : "tubes"})`}>
                        <TextInput type="number" value={det.packedQty || ""} onChange={setDetail(i, "packedQty")} />
                      </Field>
                      <Field label="Dispatch Qty">
                        <TextInput type="number" value={det.dispatchQty || ""} onChange={setDetail(i, "dispatchQty")} />
                      </Field>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="QA Status">
                        <SelectInput value={det.qaStatus || "Pending"} onChange={setDetail(i, "qaStatus")}>
                          <option>Pending</option><option>Approved</option><option>Rejected</option><option>On Hold</option>
                        </SelectInput>
                      </Field>
                      <Field label="Remarks">
                        <TextInput value={det.remarks || ""} onChange={setDetail(i, "remarks")} />
                      </Field>
                    </div>
                  </Card>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <SecondaryButton onClick={() => setShowSplitSetup(true)} style={{ flex: 1 }}>← Edit Names</SecondaryButton>
              <PrimaryButton onClick={saveAll} style={{ flex: 2 }}>Save All {splitRows.length} Batch(es)</PrimaryButton>
            </div>
          </>
        )}
      </Card>

      <SectionHeading title={`Recent ${d.label} Commercial Batches`} small sub="Newest first" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {deptCBs.length === 0 && <EmptyNote text="No commercial batches logged yet in this department." />}
        {deptCBs.map((cb) => {
          const calc = computeCB(cb, motherBatches);
          return (
            <Card key={cb.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{cb.id} · {cb.productName}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    {cb.batchNumber} · linked to {cb.mbId} · {fmtDate(cb.date)}{cb.loggedBy ? ` · by ${cb.loggedBy}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <YieldBadge value={calc.finalYield} />
                  <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>final yield</div>
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
// BATCH SPLIT VISUAL
// ============================================================================
function BatchSplitVisual({ mb, commercialBatches, calc }) {
  const linked = commercialBatches.filter((c) => c.mbId === mb.id);
  if (linked.length === 0) return null;
  const total = calc.plannedLakh || 1;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 10.5, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Batch Split</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.white, background: C.navy, borderRadius: 8, padding: "8px 10px", minWidth: 70, textAlign: "center" }}>
          {mb.id}<div style={{ fontSize: 9, fontWeight: 400, opacity: 0.8 }}>{calc.plannedLakh}L</div>
        </div>
        <div style={{ color: C.line, fontSize: 18 }}>→</div>
        <div style={{ display: "flex", flex: 1, height: 26, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.line}` }}>
          {linked.map((cb, i) => {
            const cbCalc = computeCB(cb, [mb]);
            const w = typeof cbCalc.allocLakh === "number" ? Math.max((cbCalc.allocLakh / total) * 100, 4) : 100 / linked.length;
            const hue = 215 - i * (55 / Math.max(linked.length, 1));
            return <div key={cb.id} title={`${cb.productName}: ${cbCalc.allocLakh || "?"}L`} style={{ width: `${w}%`, background: `hsl(${hue}, 55%, ${40 + (i % 3) * 8}%)`, borderRight: `1px solid ${C.white}` }} />;
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 8 }}>
        {linked.map((cb) => <div key={cb.id} style={{ fontSize: 10.5, color: C.sub }}><b style={{ color: C.ink }}>{cb.productName}</b> {cb.batchNumber}</div>)}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, tone }) {
  const toneColors = { ok: C.ok, warn: C.warn, bad: C.bad };
  return (
    <Card style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 10.5, color: C.sub, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT_DISPLAY, color: tone ? toneColors[tone] : C.navy, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{sub}</div>}
    </Card>
  );
}

// ============================================================================
// MANAGER DASHBOARD — plant-wide, all departments
// ============================================================================
function ManagerScreen({ motherBatches, commercialBatches, onOpenRegister }) {
  const [deptFilter, setDeptFilter] = useState("all");
  const filteredMBs = deptFilter === "all" ? motherBatches : motherBatches.filter((m) => m.dept === deptFilter);
  const rows = filteredMBs.map((mb) => ({ mb, calc: computeMB(mb, commercialBatches) }));

  const totals = useMemo(() => {
    const alerts = rows.filter((r) => r.calc.status === "OVER-ALLOCATED!").length;
    const cbInScope = deptFilter === "all" ? commercialBatches : commercialBatches.filter((c) => c.dept === deptFilter);
    const pending = cbInScope.filter((c) => c.qaStatus === "Pending").length;
    const rejected = cbInScope.filter((c) => c.qaStatus === "Rejected").length;
    return { alerts, pending, rejected, batches: filteredMBs.length, splits: cbInScope.length };
  }, [rows, commercialBatches, filteredMBs, deptFilter]);

  const byDept = DEPT_LIST.map((d) => {
    const mbs = motherBatches.filter((m) => m.dept === d.key);
    const cbs = commercialBatches.filter((c) => c.dept === d.key);
    return { ...d, count: mbs.length, splits: cbs.length };
  });

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading
        eyebrow="Manager"
        title="Plant-Wide Dashboard"
        sub="Every stage, every department, live."
        right={<SecondaryButton onClick={onOpenRegister}>Open Plant Register →</SecondaryButton>}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        <FilterChip active={deptFilter === "all"} onClick={() => setDeptFilter("all")} label="All Departments" />
        {DEPT_LIST.map((d) => (
          <FilterChip key={d.key} active={deptFilter === d.key} onClick={() => setDeptFilter(d.key)} label={`${d.icon} ${d.label}`} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 18 }}>
        <KpiCard label="Mother Batches" value={totals.batches} />
        <KpiCard label="Commercial Batches" value={totals.splits} />
        <KpiCard label="Over-allocated" value={totals.alerts} tone={totals.alerts > 0 ? "bad" : "ok"} />
        <KpiCard label="QA Pending" value={totals.pending} tone={totals.pending > 0 ? "warn" : "ok"} />
        <KpiCard label="QA Rejected" value={totals.rejected} tone={totals.rejected > 0 ? "bad" : "ok"} />
      </div>

      {deptFilter === "all" && (
        <>
          <SectionHeading title="By Department" small />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            {byDept.map((d) => (
              <Card key={d.key} style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => setDeptFilter(d.key)}>
                <div style={{ fontSize: 20 }}>{d.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, marginTop: 4 }}>{d.label}</div>
                <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{d.count} mother · {d.splits} commercial</div>
              </Card>
            ))}
          </div>
        </>
      )}

      <SectionHeading title="Mother Batches — Detail" small sub="Newest first" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.length === 0 && <EmptyNote text="No batches logged yet." />}
        {rows.map(({ mb, calc }) => {
          const isTC = mb.dept === "tablet" || mb.dept === "capsule";
          const unit = DEPARTMENTS[mb.dept]?.unit || "L";
          return (
            <Card key={mb.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                    {mb.id} · {mb.genericName || "Untitled"} <DeptTag dept={mb.dept} />
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    {mb.productGroup} · {fmtDate(mb.date)}{mb.loggedBy ? ` · logged by ${mb.loggedBy}` : ""}
                  </div>
                </div>
                <StatusPill status={calc.status} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginTop: 14, fontSize: 12.5 }}>
                <Stat label="Planned" value={`${calc.plannedLakh || "—"} ${unit}`} />
                {isTC ? (
                  <>
                    <Stat label="Gran Output" value={`${mb.granOutput || "—"} kg`} />
                    <Stat label="Gran Yield" value={<YieldBadge value={calc.granYield} />} />
                    <Stat label="Comp Output" value={`${mb.compOutput || "—"} kg`} />
                    <Stat label="Comp Yield" value={<YieldBadge value={calc.compYield} />} />
                    <Stat label="Coat Output" value={calc.coat === "NA" ? "NA" : `${mb.coatOutput || "—"} kg`} />
                    <Stat label="Coat Yield" value={<YieldBadge value={calc.coatYield} />} />
                  </>
                ) : (
                  <>
                    <Stat label="Mix Output" value={`${mb.mixOutputKg || "—"} kg`} />
                    <Stat label="Fill Output" value={fmtNum(mb.fillOutputQty)} />
                    <Stat label="Fill Yield" value={<YieldBadge value={calc.fillYield} />} />
                  </>
                )}
                <Stat label="Allocated" value={`${calc.allocatedLakh} ${unit}`} />
                <Stat label="Unallocated" value={`${calc.unallocated} ${unit}`} />
                <Stat label="Packed (all)" value={`${calc.packedLakhTotal} ${unit}`} />
                <Stat label="Dispatched (all)" value={`${calc.dispatchLakhTotal} ${unit}`} />
                <Stat label="Splits" value={calc.linkedCount} />
              </div>

              <BatchSplitVisual mb={mb} commercialBatches={commercialBatches} calc={calc} />
            </Card>
          );
        })}
      </div>
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
// PLANT REGISTER — full detailed log of every batch, date-wise, exportable
// ============================================================================
function PlantRegister({ motherBatches, commercialBatches, onBack }) {
  const [tab, setTab] = useState("mother"); // "mother" | "commercial"
  const [deptFilter, setDeptFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const filterByCommon = (list, dateKey, textFields) =>
    list.filter((r) => {
      if (deptFilter !== "all" && r.dept !== deptFilter) return false;
      if (dateFrom && r[dateKey] < dateFrom) return false;
      if (dateTo && r[dateKey] > dateTo) return false;
      if (search) {
        const hay = textFields.map((f) => (r[f] || "").toString().toLowerCase()).join(" ");
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });

  const mbFiltered = sortNewestFirst(filterByCommon(motherBatches, "date", ["id", "genericName", "productGroup", "loggedBy"]));
  const cbFiltered = sortNewestFirst(filterByCommon(commercialBatches, "date", ["id", "productName", "batchNumber", "mbId", "loggedBy"]));

  const exportMother = () => {
    const headers = [
      { key: "id", label: "MB ID" }, { key: "dept", label: "Department" }, { key: "date", label: "Date" },
      { key: "loggedBy", label: "Logged By" }, { key: "genericName", label: "Generic Name" }, { key: "productGroup", label: "Product Group" },
      { key: "plannedLakh", label: "Planned (Lakh)" }, { key: "granOutput", label: "Gran Output (kg)" }, { key: "granYield", label: "Gran Yield %" },
      { key: "compOutput", label: "Comp Output (kg)" }, { key: "compYield", label: "Comp Yield %" }, { key: "coatOutput", label: "Coat Output (kg)" },
      { key: "coatYield", label: "Coat Yield %" }, { key: "mixOutputKg", label: "Mix Output (kg)" }, { key: "fillOutputQty", label: "Fill Output Qty" },
      { key: "fillYield", label: "Fill Yield %" }, { key: "allocatedLakh", label: "Allocated (Lakh)" }, { key: "unallocated", label: "Unallocated (Lakh)" },
      { key: "status", label: "Allocation Status" }, { key: "remarks", label: "Remarks" },
    ];
    const rows = mbFiltered.map((mb) => {
      const calc = computeMB(mb, commercialBatches);
      return { ...mb, ...calc };
    });
    downloadCSV(`DPYMS_Mother_Batches_${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows, headers));
  };

  const exportCommercial = () => {
    const headers = [
      { key: "id", label: "CB ID" }, { key: "dept", label: "Department" }, { key: "mbId", label: "MB ID" }, { key: "date", label: "Date" },
      { key: "loggedBy", label: "Logged By" }, { key: "productName", label: "Product Name" }, { key: "batchNumber", label: "Batch Number" },
      { key: "allocatedKg", label: "Allocated (kg)" }, { key: "allocatedQty", label: "Allocated Qty" }, { key: "gramWtPerUnit", label: "Wt per Unit (g)" },
      { key: "allocLakh", label: "Allocated (Lakh)" }, { key: "packedQty", label: "Packed Qty" }, { key: "packedLakh", label: "Packed (Lakh)" },
      { key: "dispatchQty", label: "Dispatch Qty" }, { key: "dispatchLakh", label: "Dispatch (Lakh)" }, { key: "finalYield", label: "Final Yield %" },
      { key: "qaStatus", label: "QA Status" }, { key: "remarks", label: "Remarks" },
    ];
    const rows = cbFiltered.map((cb) => {
      const calc = computeCB(cb, motherBatches);
      return { ...cb, ...calc };
    });
    downloadCSV(`DPYMS_Commercial_Batches_${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows, headers));
  };

  const exportEverything = () => { exportMother(); setTimeout(exportCommercial, 300); };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 60px" }}>
      <SectionHeading
        eyebrow="Manager"
        title="Plant Register"
        sub="Complete record of every batch logged across the plant — filter, search, export."
        right={<SecondaryButton onClick={onBack}>← Back to Dashboard</SecondaryButton>}
      />

      <Card style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setTab("mother")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${C.navy}`, background: tab === "mother" ? C.navy : C.white, color: tab === "mother" ? C.white : C.navy, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Mother Batches ({mbFiltered.length})
          </button>
          <button onClick={() => setTab("commercial")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${C.navy}`, background: tab === "commercial" ? C.navy : C.white, color: tab === "commercial" ? C.white : C.navy, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Commercial Batches ({cbFiltered.length})
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
          <Field label="Department">
            <SelectInput value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="all">All</option>
              {DEPT_LIST.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </SelectInput>
          </Field>
          <Field label="From Date"><TextInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></Field>
          <Field label="To Date"><TextInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></Field>
          <Field label="Search"><TextInput placeholder="ID, name, batch no..." value={search} onChange={(e) => setSearch(e.target.value)} /></Field>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <SecondaryButton onClick={tab === "mother" ? exportMother : exportCommercial}>
            ⬇ Export {tab === "mother" ? "Mother Batches" : "Commercial Batches"} (CSV)
          </SecondaryButton>
          <SecondaryButton onClick={exportEverything}>⬇ Export Entire Plant Register (both files)</SecondaryButton>
        </div>
      </Card>

      {tab === "mother" ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, background: C.white, borderRadius: 12, overflow: "hidden" }}>
            <thead>
              <tr style={{ background: C.navy, color: C.white, textAlign: "left" }}>
                {["Date", "MB ID", "Dept", "Generic Name", "Logged By", "Planned", "Gran %", "Comp %", "Coat %", "Allocated", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mbFiltered.length === 0 && <tr><td colSpan={11} style={{ padding: 20, textAlign: "center", color: C.sub }}>No records match your filters.</td></tr>}
              {mbFiltered.map((mb, i) => {
                const calc = computeMB(mb, commercialBatches);
                const unit = DEPARTMENTS[mb.dept]?.unit.replace("Lakh ", "") || "";
                return (
                  <tr key={mb.id} style={{ background: i % 2 === 0 ? C.white : C.paleBg, borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{fmtDate(mb.date)}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700 }}>{mb.id}</td>
                    <td style={{ padding: "9px 12px" }}><DeptTag dept={mb.dept} /></td>
                    <td style={{ padding: "9px 12px" }}>{mb.genericName}</td>
                    <td style={{ padding: "9px 12px" }}>{mb.loggedBy || "—"}</td>
                    <td style={{ padding: "9px 12px" }}>{calc.plannedLakh || "—"} L</td>
                    <td style={{ padding: "9px 12px" }}><YieldBadge value={calc.granYield} /></td>
                    <td style={{ padding: "9px 12px" }}><YieldBadge value={calc.compYield} /></td>
                    <td style={{ padding: "9px 12px" }}><YieldBadge value={calc.coatYield} /></td>
                    <td style={{ padding: "9px 12px" }}>{calc.allocatedLakh} L</td>
                    <td style={{ padding: "9px 12px" }}><StatusPill status={calc.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, background: C.white, borderRadius: 12, overflow: "hidden" }}>
            <thead>
              <tr style={{ background: C.navy, color: C.white, textAlign: "left" }}>
                {["Date", "CB ID", "Dept", "Product", "Batch No.", "MB ID", "Logged By", "Packed", "Dispatch", "Final Yield", "QA"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cbFiltered.length === 0 && <tr><td colSpan={11} style={{ padding: 20, textAlign: "center", color: C.sub }}>No records match your filters.</td></tr>}
              {cbFiltered.map((cb, i) => {
                const calc = computeCB(cb, motherBatches);
                return (
                  <tr key={cb.id} style={{ background: i % 2 === 0 ? C.white : C.paleBg, borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>{fmtDate(cb.date)}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700 }}>{cb.id}</td>
                    <td style={{ padding: "9px 12px" }}><DeptTag dept={cb.dept} /></td>
                    <td style={{ padding: "9px 12px" }}>{cb.productName}</td>
                    <td style={{ padding: "9px 12px" }}>{cb.batchNumber}</td>
                    <td style={{ padding: "9px 12px" }}>{cb.mbId}</td>
                    <td style={{ padding: "9px 12px" }}>{cb.loggedBy || "—"}</td>
                    <td style={{ padding: "9px 12px" }}>{fmtNum(cb.packedQty)}</td>
                    <td style={{ padding: "9px 12px" }}>{fmtNum(cb.dispatchQty)}</td>
                    <td style={{ padding: "9px 12px" }}><YieldBadge value={calc.finalYield} /></td>
                    <td style={{ padding: "9px 12px" }}><StatusPill status={cb.qaStatus} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ROOT APP
// ============================================================================
function App() {
  const [step, setStep] = useState("role"); // role -> department -> screen
  const [role, setRole] = useState(null);
  const [dept, setDept] = useState(null);
  const [userName, setUserName] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const [motherBatches, setMotherBatches] = useState([]);
  const [commercialBatches, setCommercialBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState("connected");
  const [storageSelfTestFailed, setStorageSelfTestFailed] = useState(false);

  useEffect(() => {
    // one-time self-test: confirm this session can actually write to shared storage
    (async () => {
      const testVal = { ping: Date.now() };
      const result = await saveShared("dpyms_selftest", testVal);
      if (!result.ok) {
        console.error("Storage self-test failed:", result.error);
        setStorageSelfTestFailed(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const mb = await loadShared("dpyms_mother_batches", []);
      const cb = await loadShared("dpyms_commercial_batches", []);
      setMotherBatches(sortNewestFirst(mb));
      setCommercialBatches(sortNewestFirst(cb));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (step !== "screen") return;
    const interval = setInterval(async () => {
      if (storageStatus === "saving" || storageStatus === "error") return; // don't refresh if writes aren't working
      const mb = await loadShared("dpyms_mother_batches", motherBatches);
      const cb = await loadShared("dpyms_commercial_batches", commercialBatches);
      // safety: never let a poll result that has FEWER records silently erase local data
      if (mb.length >= motherBatches.length) setMotherBatches(sortNewestFirst(mb));
      if (cb.length >= commercialBatches.length) setCommercialBatches(sortNewestFirst(cb));
    }, 6000);
    return () => clearInterval(interval);
  }, [step, storageStatus]); // eslint-disable-line

  // Role selection: managers skip department picking entirely. Production/Packaging pick a department next.
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
        Loading DPYMS…
      </div>
    );
  }

  if (step === "role") return <RolePicker onPick={pickRole} storageWarning={storageSelfTestFailed} />;

  const roleLabel = role === "production" ? "Production" : role === "packaging" ? "Packaging / QA" : "Manager Dashboard";

  if (step === "department") {
    return <DepartmentPicker onPick={pickDept} onBack={goHome} />;
  }

  // step === "screen"
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
        <PlantRegister motherBatches={motherBatches} commercialBatches={commercialBatches} onBack={() => setShowRegister(false)} />
      )}
      {role === "manager" && !showRegister && (
        <ManagerScreen motherBatches={motherBatches} commercialBatches={commercialBatches} onOpenRegister={() => setShowRegister(true)} />
      )}
      {role === "production" && (
        <ProductionScreen
          dept={dept} userName={userName} setUserName={setUserName}
          motherBatches={motherBatches} setMotherBatches={setMotherBatches}
          commercialBatches={commercialBatches}
          storageStatus={storageStatus} setStorageStatus={setStorageStatus}
        />
      )}
      {role === "packaging" && (
        <PackagingScreen
          dept={dept} userName={userName} setUserName={setUserName}
          motherBatches={motherBatches} commercialBatches={commercialBatches}
          setCommercialBatches={setCommercialBatches}
          storageStatus={storageStatus} setStorageStatus={setStorageStatus}
        />
      )}
      <div style={{ textAlign: "center", padding: "18px 16px 30px", fontSize: 10.5, color: C.sub }}>
        Danish Health Care (P) Ltd. · 76/27-29, Industrial Estate, Maxi Road, Ujjain 456010 · ISO 9001:2015 &amp; WHO GMP Certified
      </div>
    </div>
  );
}


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

