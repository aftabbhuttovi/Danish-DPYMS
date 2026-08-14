// ====== TOP BAR ======
function TopBar(props) {
  return R('div', { style:{ background:C.navy, color:C.white, padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:20, boxShadow:"0 2px 8px rgba(0,0,0,0.15)", flexWrap:"wrap", gap:8 }, className:"no-print" },
    R('div', { style:{ display:"flex", alignItems:"center", gap:12 } },
      R('img', { src:BRAND_LOGO, onError:function(e){e.target.onerror=null;e.target.src=DEFAULT_LOGO;}, alt:"Logo", style:{ height:32, borderRadius:4 } }),
      R('div', null,
        R('div', { style:{ fontWeight:700, fontSize:13.5, fontFamily:FONT_DISPLAY, display:"flex", alignItems:"center", gap:8 } },
          "DPYMS v2 · Danish Healthcare",
          R('span', { style:{ fontSize:10, background:props.isSyncing?C.warnBg:C.okBg, color:props.isSyncing?C.warn:C.ok, padding:"2px 8px", borderRadius:999, fontWeight:700 } }, props.isSyncing?"🔄 Syncing...":"● Multi-Device Live")
        ),
        R('div', { style:{ fontSize:10, color:C.skyBlue, letterSpacing:0.5 } }, props.roleLabel+(props.deptLabel?" · "+props.deptLabel:"")+(props.userName?" · "+props.userName:""))
      )
    ),
    R('div', { style:{ display:"flex", gap:8, flexWrap:"wrap" } },
      R('button', { onClick:props.onForcePush, title:"Push all batches to Cloud", style:{ background:C.okBg, border:"1px solid "+C.ok, color:C.ok, borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer", fontWeight:700 } }, "☁️ Push Data to Cloud"),
      R('button', { onClick:props.onManualSync, title:"Fetch latest from Cloud", style:{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.35)", color:C.white, borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer", fontWeight:700 } }, "🔄 Sync Cloud Data"),
      props.showDeptChange ? R('button', { onClick:props.onChangeDept, style:{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.28)", color:C.white, borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer" } }, "← Change Department") : null,
      R('button', { onClick:props.onSwitchRole, style:{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.28)", color:C.white, borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer" } }, "← Switch Role")
    )
  );
}

// ====== PRODUCTION SCREEN ======
function ProductionScreen(props) {
  const dept = props.dept, motherBatches = props.motherBatches, commercialBatches = props.commercialBatches;
  const d = (dept && DEPARTMENTS[dept]) || { label:"Plant-Wide", unit:"Units", imgSrc:DEFAULT_LOGO };
  const isTablet = dept==="tablet", isCapsule=dept==="capsule", isOrsOintment=dept==="ors"||dept==="ointment";
  const [viewAllDepts, setViewAllDepts] = useState(false);
  const deptBatches = viewAllDepts ? motherBatches : motherBatches.filter(function(m){ return m.dept===dept; });
  const blank = { id:"", dept, date:new Date().toISOString().slice(0,10), genericName:"", productGroup:"", avgUnitWt:"", plannedLakhUnits:"", plannedBatchWt:"", rrGran:"0", granOutput:"", compOutput:"", compRR:"0", coated:"N", coreAvgWt:"", coatWtGainPct:"", actualCoatedWt:"", coatOutput:"", fillWtMg:"", shellWtMg:"", plannedQty:"", mixOutputKg:"", fillOutputQty:"", remarks:"", loggedBy:props.userName||"", qaStatus:"Pending" };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");
  useEffect(function(){ setForm(blank); setEditingId(null); }, [dept]); // eslint-disable-line
  function set(k){ return function(e){ setForm(function(f){ const next = Object.assign({},f,{[k]:e.target.value}); if(k==="coatWtGainPct"||k==="compOutput"||k==="actualCoatedWt"){ const comp=parseFloat(next.compOutput),gain=parseFloat(next.coatWtGainPct); if(isFinite(comp)&&isFinite(gain)) next.coatOutput=round2(comp*(1+gain/100)); } return next; }); }; }
  const previewLakhs = form.plannedLakhUnits ? parseFloat(form.plannedLakhUnits) : "";
  const previewAvgWt = isCapsule ? (parseFloat(form.fillWtMg)||parseFloat(form.avgUnitWt)) : parseFloat(form.avgUnitWt);
  const rrVal = parseFloat(form.rrGran)||0;
  const rawReqKg = previewLakhs&&previewAvgWt ? round2((previewLakhs*100000*previewAvgWt)/1000000) : "";
  const calculatedReqKg = rawReqKg!=="" ? Math.max(0,round2(rawReqKg-rrVal)) : "";
  const saveRecord = async function(isUpdate) {
    if (!form.genericName){ setToast("Please enter Generic Product Name"); return; }
    let recordId = form.id;
    if (!recordId) recordId = genMBId(motherBatches, dept);
    const updatedForm = Object.assign({}, form, { id:recordId, createdAt:form.createdAt||Date.now() });
    let updatedList;
    if (isUpdate && editingId) updatedList = motherBatches.map(function(m){ return m.id===editingId?updatedForm:m; });
    else updatedList = [updatedForm, ...motherBatches.filter(function(m){ return m.id!==recordId; })];
    const sorted = sortNewestFirst(updatedList);
    props.setMotherBatches(sorted);
    await saveShared("dpyms_mother_batches", sorted);
    setToast("Mother Batch "+recordId+" "+(isUpdate?"updated":"saved")+" & synced to all devices!");
    if (isUpdate) setEditingId(null);
    setForm(Object.assign({}, blank, { date:new Date().toISOString().slice(0,10) }));
  };
  const deleteBatch = async function(mbId) {
    if (!window.confirm("Are you sure you want to delete Mother Batch "+mbId+"?")) return;
    const updatedMBs = motherBatches.filter(function(m){ return m.id!==mbId; });
    const updatedCBs = commercialBatches.filter(function(c){ return c.mbId!==mbId; });
    props.setMotherBatches(updatedMBs); props.setCommercialBatches(updatedCBs);
    deleteSharedRow("mother_batches", mbId);
    await saveShared("dpyms_mother_batches", updatedMBs);
    await saveShared("dpyms_commercial_batches", updatedCBs);
    if (form.id===mbId||editingId===mbId){ setForm(blank); setEditingId(null); }
    setToast("Mother Batch "+mbId+" deleted");
  };
  const editBatch = function(mb){ setForm(mb); setEditingId(mb.id); window.scrollTo({top:0,behavior:"smooth"}); };

  return R('div', { style:{ maxWidth:820, margin:"0 auto", padding:"20px 16px 60px" } },
    R(SectionHeading, { eyebrow:"Production · "+d.label, title:(editingId?"Edit":"Log")+" "+d.label+" Mother Batch", sub:"Progressive multi-stage record (Syncs live across all devices)." }),
    R(UniversalActionBar, { onSave:function(){ saveRecord(false); }, onEdit:editingId?null:function(){ if(deptBatches[0]) editBatch(deptBatches[0]); }, onUpdate:function(){ saveRecord(true); }, onDelete:editingId?function(){ deleteBatch(editingId); }:null, onBack:function(){ setForm(blank); setEditingId(null); }, isEditing:!!editingId }),
    R(Card, { style:{ padding:22, marginBottom:24 } },
      editingId ? R('div', { style:{ background:C.warnBg, color:C.warn, padding:"8px 14px", borderRadius:8, fontSize:12.5, fontWeight:700, marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" } },
        R('span', null, "✏️ Editing Active Batch: "+editingId),
        R('button', { type:"button", className:"btn-nav btn-delete", style:{ padding:"4px 8px", fontSize:11 }, onClick:function(){ deleteBatch(editingId); } }, "🗑️ Delete Batch")
      ) : null,
      R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
        R(Field, { label:"Date" }, R(TextInput, { type:"date", value:form.date, onChange:set("date") })),
        R(Field, { label:"Production/QA Officer Name" }, R(TextInput, { placeholder:"Officer Name", value:form.loggedBy, onChange:set("loggedBy") }))
      ),
      R(Field, { label:"Generic Name of Product" }, R(TextInput, { placeholder:isTablet?"e.g. Aceclofenac (100 mg) Tablets":"e.g. OMEPRAZOLE CAPSULES BP 20 MG", value:form.genericName, onChange:set("genericName") })),
      R(Field, { label:"Product Group / Brand Family" }, R(TextInput, { placeholder:"e.g. ALDONIX / ACLONAC GROUP", value:form.productGroup, onChange:set("productGroup") })),
      // Tablet fields
      isTablet ? R(Fragment, null,
        R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
          R(Field, { label:"Planned Tablets (in Lakhs)" }, R(TextInput, { type:"number", step:"0.01", placeholder:"e.g. 10.00", value:form.plannedLakhUnits, onChange:set("plannedLakhUnits") })),
          R(Field, { label:"Avg Tablet Wt (mg)" }, R(TextInput, { type:"number", placeholder:"e.g. 630", value:form.avgUnitWt, onChange:set("avgUnitWt") }))
        ),
        R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
          R(Field, { label:"RR Added — Granulation (kg)", hint:"Reusable RR from previous runs" }, R(TextInput, { type:"number", value:form.rrGran, onChange:set("rrGran") })),
          R(Field, { label:"Planned Batch Wt (kg)", hint:calculatedReqKg!==""?"Auto Req (reduced by RR): "+calculatedReqKg+" kg":"Batch size in kg" }, R(TextInput, { type:"number", placeholder:calculatedReqKg||"e.g. 630.0", value:form.plannedBatchWt||calculatedReqKg, onChange:set("plannedBatchWt") }))
        ),
        R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
          R(Field, { label:"Granulation Output (kg)" }, R(TextInput, { type:"number", value:form.granOutput, onChange:set("granOutput") })),
          R(Field, { label:"Compression Output (kg)" }, R(TextInput, { type:"number", value:form.compOutput, onChange:set("compOutput") }))
        ),
        R('div', { style:{ borderTop:"1px solid "+C.line, paddingTop:16, marginTop:8, marginBottom:14 } },
          R('div', { style:{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:12 } }, "Coating Section Details"),
          R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
            R(Field, { label:"Coated Tablet?" },
              R(SelectInput, { value:form.coated, onChange:set("coated") },
                R('option', { value:"N" }, "No — Uncoated"),
                R('option', { value:"Y" }, "Yes — Coated")
              )
            ),
            form.coated==="Y" ? R(Field, { label:"Percent Weight Gain (%)", hint:"Triggers auto coating output" }, R(TextInput, { type:"number", placeholder:"e.g. 1.5", value:form.coatWtGainPct, onChange:set("coatWtGainPct") })) : null
          ),
          form.coated==="Y" ? R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
            R(Field, { label:"Actual Coated Tablet Wt (mg)" }, R(TextInput, { type:"number", placeholder:"e.g. 639.45", value:form.actualCoatedWt, onChange:set("actualCoatedWt") })),
            R(Field, { label:"Coating Output (kg)", hint:"Calculated automatically" }, R(TextInput, { type:"number", value:form.coatOutput, onChange:set("coatOutput") }))
          ) : null
        )
      ) : null,
      // Capsule fields
      isCapsule ? R(Fragment, null,
        R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
          R(Field, { label:"Planned Capsules (in Lakhs)" }, R(TextInput, { type:"number", placeholder:"e.g. 5.00", value:form.plannedLakhUnits, onChange:set("plannedLakhUnits") })),
          R(Field, { label:"Avg Fill Weight (mg)" }, R(TextInput, { type:"number", placeholder:"e.g. 250", value:form.fillWtMg, onChange:set("fillWtMg") }))
        ),
        R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
          R(Field, { label:"Avg Shell Weight (mg)" }, R(TextInput, { type:"number", placeholder:"e.g. 76", value:form.shellWtMg, onChange:set("shellWtMg") })),
          R(Field, { label:"Granulation Output (kg)" }, R(TextInput, { type:"number", value:form.granOutput, onChange:set("granOutput") }))
        ),
        R(Field, { label:"Filling Output (kg)" }, R(TextInput, { type:"number", value:form.compOutput, onChange:set("compOutput") }))
      ) : null,
      // ORS/Ointment fields
      isOrsOintment ? R(Fragment, null,
        R(Field, { label:"Planned Quantity ("+(dept==="ors"?"sachets":"tubes")+")" }, R(TextInput, { type:"number", placeholder:"e.g. 250000", value:form.plannedQty, onChange:set("plannedQty") })),
        R(Field, { label:"Mix Output (kg)" }, R(TextInput, { type:"number", value:form.mixOutputKg, onChange:set("mixOutputKg") })),
        R(Field, { label:"Fill Output ("+(dept==="ors"?"sachets":"tubes")+" filled)" }, R(TextInput, { type:"number", value:form.fillOutputQty, onChange:set("fillOutputQty") }))
      ) : null,
      R(Field, { label:"Remarks / Observations" }, R(TextInput, { value:form.remarks, onChange:set("remarks") }))
    ),
    R(SectionHeading, { title:viewAllDepts?"All Plant Mother Batches ("+motherBatches.length+")":"Recent "+d.label+" Mother Batches ("+deptBatches.length+")", small:true }),
    R('div', { style:{ display:"flex", gap:10, marginBottom:14 } },
      R(FilterChip, { active:!viewAllDepts, onClick:function(){ setViewAllDepts(false); }, label:"Current Section ("+d.label+")" }),
      R(FilterChip, { active:viewAllDepts, onClick:function(){ setViewAllDepts(true); }, label:"🌐 View All Plant Lines ("+motherBatches.length+" Batches)" })
    ),
    R('div', { style:{ display:"flex", flexDirection:"column", gap:12 } },
      deptBatches.map(function(mb) {
        const calc = computeMB(mb, commercialBatches);
        return R(Card, { key:mb.id, style:{ padding:16 } },
          R('div', { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" } },
            R('div', null,
              R('div', { style:{ fontWeight:700, fontSize:14, color:C.ink } }, mb.id+" · "+(mb.genericName||"Untitled")),
              R('div', { style:{ fontSize:12, color:C.sub, marginTop:2 } }, fmtDate(mb.date)+(mb.loggedBy?" · Officer: "+mb.loggedBy:"")+" · Planned: ", R('b', null, calc.plannedLakh?calc.plannedLakh+" Lacs":"—"), " ("+(calc.totalBatchKg?calc.totalBatchKg+" kg":"—")+")")
            ),
            R('div', { style:{ display:"flex", alignItems:"center", gap:8 } },
              R(StatusPill, { status:mb.qaStatus||"Pending" }),
              R('button', { type:"button", className:"btn-nav btn-edit", style:{ padding:"5px 10px", fontSize:12 }, onClick:function(){ editBatch(mb); } }, "✏️ Edit"),
              R('button', { type:"button", className:"btn-nav btn-delete", style:{ padding:"5px 10px", fontSize:12 }, onClick:function(){ deleteBatch(mb.id); } }, "🗑️ Delete")
            )
          )
        );
      })
    ),
    toast ? R(Toast, { message:toast, onDone:function(){ setToast(""); } }) : null
  );
}

// ====== QA SCREEN ======
function QaScreen(props) {
  const dept = props.dept, motherBatches = props.motherBatches, commercialBatches = props.commercialBatches;
  const d = (dept && DEPARTMENTS[dept]) || { label:"Plant-Wide", unit:"Units", imgSrc:DEFAULT_LOGO };
  const [viewAllDepts, setViewAllDepts] = useState(false);
  const deptMBs = viewAllDepts ? motherBatches : motherBatches.filter(function(m){ return m.dept===dept; });
  const [selectedMbId, setSelectedMbId] = useState(deptMBs[0] ? deptMBs[0].id : "");
  const [qaStatus, setQaStatus] = useState("QA Approved");
  const [qaAssay, setQaAssay] = useState("99.8");
  const [qaRemarks, setQaRemarks] = useState("");
  const [toast, setToast] = useState("");
  const selectedMB = motherBatches.find(function(m){ return m.id===selectedMbId; });
  const calc = selectedMB ? computeMB(selectedMB, commercialBatches) : null;
  const saveQaApproval = async function() {
    if (!selectedMB) return;
    const updatedMBs = motherBatches.map(function(m){ return m.id===selectedMbId ? Object.assign({},m,{qaStatus,qaAssay,qaRemarks,qaInspector:props.userName||"Production/QA Officer"}) : m; });
    props.setMotherBatches(updatedMBs);
    await saveShared("dpyms_mother_batches", updatedMBs);
    setToast("QA decision for "+selectedMbId+" saved as "+qaStatus+" & synced!");
  };
  return R('div', { style:{ maxWidth:820, margin:"0 auto", padding:"20px 16px 60px" } },
    R(SectionHeading, { eyebrow:"Quality Assurance · "+d.label, title:"QA Inspection & Quality Clearance", sub:"Review yield statistics and sign off on batch quality." }),
    R(UniversalActionBar, { onSave:saveQaApproval, onUpdate:saveQaApproval }),
    R(Card, { style:{ padding:20, marginBottom:24 } },
      R('div', { style:{ display:"flex", gap:10, marginBottom:14 } },
        R(FilterChip, { active:!viewAllDepts, onClick:function(){ setViewAllDepts(false); }, label:"Current Section ("+d.label+")" }),
        R(FilterChip, { active:viewAllDepts, onClick:function(){ setViewAllDepts(true); }, label:"🌐 View All Plant Batches ("+motherBatches.length+")" })
      ),
      R(Field, { label:"Select Mother Batch for QA Clearance" },
        R(SelectInput, { value:selectedMbId, onChange:function(e){ setSelectedMbId(e.target.value); } },
          deptMBs.map(function(m){ return R('option', { key:m.id, value:m.id }, m.id+" — "+m.genericName+" (Status: "+(m.qaStatus||"Pending")+")"); })
        )
      ),
      selectedMB && calc ? R('div', { style:{ background:C.paleBg, borderRadius:12, padding:16, marginBottom:18 } },
        R('div', { style:{ fontWeight:700, fontSize:15, color:C.navy, marginBottom:10 } }, "Batch Yield Summary — "+selectedMB.id),
        R('div', { style:{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:12, fontSize:13 } },
          R('div', null, R('b', null, "Planned:"), " "+calc.plannedLakh+" Lacs ("+calc.totalBatchKg+" kg)"),
          R('div', null, R('b', null, "Gran Yield:"), " ", R(YieldBadge, { value:calc.granYield })),
          R('div', null, R('b', null, "Comp Yield:"), " ", R(YieldBadge, { value:calc.compYield })),
          R('div', null, R('b', null, "Coat Yield:"), " ", R(YieldBadge, { value:calc.coatYield }))
        )
      ) : null,
      R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
        R(Field, { label:"QA Decision Status" },
          R(SelectInput, { value:qaStatus, onChange:function(e){ setQaStatus(e.target.value); } },
            R('option', { value:"QA Approved" }, "QA Approved"),
            R('option', { value:"Pending" }, "Pending Inspection"),
            R('option', { value:"QA Rejected" }, "QA Rejected"),
            R('option', { value:"On Hold" }, "On Hold")
          )
        ),
        R(Field, { label:"Assay / Potency (%)" }, R(TextInput, { value:qaAssay, onChange:function(e){ setQaAssay(e.target.value); } }))
      ),
      R(Field, { label:"QA Inspection Remarks" }, R(TextInput, { value:qaRemarks, onChange:function(e){ setQaRemarks(e.target.value); } })),
      R(PrimaryButton, { onClick:saveQaApproval }, "Save QA Clearance")
    ),
    toast ? R(Toast, { message:toast, onDone:function(){ setToast(""); } }) : null
  );
}

// ====== PACKAGING SCREEN ======
function PackagingScreen(props) {
  const dept = props.dept, motherBatches = props.motherBatches, commercialBatches = props.commercialBatches;
  const d = (dept && DEPARTMENTS[dept]) || { label:"Plant-Wide", unit:"Units", imgSrc:DEFAULT_LOGO };
  const deptMBs = dept ? motherBatches.filter(function(m){ return m.dept===dept; }) : motherBatches;
  const [mbId, setMbId] = useState(deptMBs[0] ? deptMBs[0].id : "");
  useEffect(function(){ if (!mbId && deptMBs[0]) setMbId(deptMBs[0].id); }, [deptMBs]); // eslint-disable-line
  const selectedMB = motherBatches.find(function(m){ return m.id===mbId; });
  const selectedMBCalc = selectedMB ? computeMB(selectedMB, commercialBatches) : null;
  const totalMotherUnits = selectedMBCalc ? (parseFloat(selectedMBCalc.plannedLakh)*100000||0) : 0;
  const [splitCount, setSplitCount] = useState(1);
  const [splitRows, setSplitRows] = useState([{ productName:"", batchNumber:"" }]);
  const [showSplitSetup, setShowSplitSetup] = useState(true);
  const [editingCbId, setEditingCbId] = useState(null);
  const detailBlank = { unitsReceived:"", packedQty:"", dispatchQty:"", rejectedUnits:"0", rrGeneratedUnits:"0", remarks:"" };
  const [details, setDetails] = useState({});
  const [toast, setToast] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  function applySplitCount(n) {
    const count = Math.max(1, Math.min(20, parseInt(n,10)||1));
    setSplitCount(count);
    setSplitRows(function(prev){ const next=[...prev]; while(next.length<count) next.push({productName:"",batchNumber:""}); return next.slice(0,count); });
  }
  function startDetailEntry() {
    if (splitRows.some(function(r){ return !r.productName||!r.batchNumber; })){ setToast("Please name every commercial batch before continuing"); return; }
    const init = {};
    splitRows.forEach(function(r,i){ init[i]=Object.assign({},detailBlank); });
    setDetails(init); setShowSplitSetup(false);
  }
  function setDetail(i,k){ return function(e){ setDetails(function(prev){ return Object.assign({},prev,{[i]:Object.assign({},prev[i],{[k]:e.target.value})}); }); }
  const saveAll = async function() {
    if (!mbId){ setToast("Select a Mother Batch first"); return; }
    const requestedTotal = splitRows.reduce(function(sum,_,i){ return sum+(parseFloat(details[i]?details[i].unitsReceived:null)||0); }, 0);
    const existingOtherAllocated = commercialBatches.filter(function(c){ return c.mbId===mbId&&c.id!==editingCbId; }).reduce(function(sum,c){ return sum+(parseFloat(c.unitsReceived)||0); }, 0);
    if (totalMotherUnits>0 && existingOtherAllocated+requestedTotal>totalMotherUnits) {
      const available = Math.max(0, totalMotherUnits-existingOtherAllocated);
      setToast("Over-allocation blocked! Remaining: "+lakhFromUnits(available)+" Lacs ("+available+" units)"); return;
    }
    let running = [...commercialBatches]; const finalRecords = [];
    splitRows.forEach(function(r,i){
      const id = editingCbId||genCBId(running,dept);
      const rec = Object.assign({ id,dept,mbId,date,loggedBy:props.userName||"Packaging Officer",productName:r.productName,batchNumber:r.batchNumber,createdAt:Date.now() }, details[i]);
      finalRecords.push(rec); running=[rec,...running.filter(function(c){ return c.id!==id; })];
    });
    const updated = sortNewestFirst([...finalRecords,...commercialBatches.filter(function(c){ return !finalRecords.some(function(f){ return f.id===c.id; }); })]);
    props.setCommercialBatches(updated); await saveShared("dpyms_commercial_batches", updated);
    setToast("Commercial batch saved & synced to all devices!");
    setSplitCount(1); setSplitRows([{productName:"",batchNumber:""}]); setDetails({}); setEditingCbId(null); setShowSplitSetup(true);
  };
  function editCB(cb){ setEditingCbId(cb.id); setMbId(cb.mbId); setDate(cb.date); setSplitCount(1); setSplitRows([{productName:cb.productName,batchNumber:cb.batchNumber}]); setDetails({0:{unitsReceived:cb.unitsReceived,packedQty:cb.packedQty,dispatchQty:cb.dispatchQty,rejectedUnits:cb.rejectedUnits,rrGeneratedUnits:cb.rrGeneratedUnits||"0"}}); setShowSplitSetup(false); window.scrollTo({top:0,behavior:"smooth"}); }
  const deleteCB = async function(cbId){ if(!window.confirm("Delete Commercial Batch "+cbId+"?"))return; const updatedCBs=commercialBatches.filter(function(c){return c.id!==cbId;}); props.setCommercialBatches(updatedCBs); deleteSharedRow("commercial_batches",cbId); await saveShared("dpyms_commercial_batches",updatedCBs); setToast("Commercial Batch "+cbId+" deleted"); };
  const deptCBs = commercialBatches.filter(function(c){ return c.dept===dept; });
  return R('div', { style:{ maxWidth:820, margin:"0 auto", padding:"20px 16px 60px" } },
    R(SectionHeading, { eyebrow:"Packaging · "+d.label, title:"Log Commercial Batches & Packaging Yields", sub:"Track Units Received, Packed, Dispatched & Yields (Syncs live across devices)." }),
    R(UniversalActionBar, { onSave:saveAll, onBack:function(){ setShowSplitSetup(true); setEditingCbId(null); } }),
    R(Card, { style:{ padding:20, marginBottom:24 } },
      R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 } },
        R(Field, { label:"Date" }, R(TextInput, { type:"date", value:date, onChange:function(e){ setDate(e.target.value); } })),
        R(Field, { label:"Packaging Officer Name" }, R(TextInput, { placeholder:"Officer Name", value:props.userName, onChange:function(e){ props.setUserName(e.target.value); } }))
      ),
      R(Field, { label:"Mother Batch ID (Parent Batch)", hint:selectedMB?"Generic: "+selectedMB.genericName+" ("+(selectedMBCalc?selectedMBCalc.plannedLakh:"?")+" Lacs)":"" },
        R(SelectInput, { value:mbId, onChange:function(e){ setMbId(e.target.value); } },
          deptMBs.map(function(mb){ return R('option', { key:mb.id, value:mb.id }, mb.id+" — "+(mb.genericName||"Untitled")); })
        )
      ),
      showSplitSetup ? R(Fragment, null,
        R(Field, { label:"Number of Brand Splits" }, R(TextInput, { type:"number", min:"1", max:"20", value:splitCount, onChange:function(e){ applySplitCount(e.target.value); } })),
        splitRows.map(function(row,i){
          return R('div', { key:i, style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, background:C.paleBg, padding:12, borderRadius:10, marginBottom:12 } },
            R(Field, { label:"Split "+(i+1)+" — Brand Name" }, R(TextInput, { placeholder:"e.g. ALDONIX-P", value:row.productName, onChange:function(e){ setSplitRows(function(prev){ return prev.map(function(r,j){ return j===i?Object.assign({},r,{productName:e.target.value}):r; }); }); } })),
            R(Field, { label:"Split "+(i+1)+" — Batch Number" }, R(TextInput, { placeholder:"e.g. LPX26001", value:row.batchNumber, onChange:function(e){ setSplitRows(function(prev){ return prev.map(function(r,j){ return j===i?Object.assign({},r,{batchNumber:e.target.value}):r; }); }); } }))
          );
        }),
        R(PrimaryButton, { onClick:startDetailEntry }, "Continue to Yield Entry →")
      ) : R(Fragment, null,
        splitRows.map(function(row,i){
          const det = details[i]||{};
          return R(Card, { key:i, style:{ padding:16, background:C.paleBg, marginBottom:14 } },
            R('div', { style:{ fontSize:11, fontWeight:700, color:C.blue, textTransform:"uppercase", marginBottom:6 } }, "Belongs to Mother Batch: "+mbId),
            R('div', { style:{ fontWeight:700, fontSize:14, color:C.navy, marginBottom:12 } }, "Brand Name: "+row.productName, R('span', { style:{ color:C.sub, fontWeight:400 } }, " · Batch #"+row.batchNumber)),
            R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 } },
              R(Field, { label:"Units Received (Batch Size)" }, R(TextInput, { type:"number", placeholder:"e.g. 400000", value:det.unitsReceived||"", onChange:setDetail(i,"unitsReceived") })),
              R(Field, { label:"Units Packed" }, R(TextInput, { type:"number", placeholder:"e.g. 397600", value:det.packedQty||"", onChange:setDetail(i,"packedQty") }))
            ),
            R('div', { style:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 } },
              R(Field, { label:"Units Dispatched" }, R(TextInput, { type:"number", placeholder:"e.g. 396000", value:det.dispatchQty||"", onChange:setDetail(i,"dispatchQty") })),
              R(Field, { label:"Rejected Units" }, R(TextInput, { type:"number", value:det.rejectedUnits||"0", onChange:setDetail(i,"rejectedUnits") }))
            ),
            R(Field, { label:"RR Generated / Retained for Future Batches (Units)", hint:"Good loose tablets saved for reuse — NOT counted as loss!" }, R(TextInput, { type:"number", placeholder:"e.g. 800", value:det.rrGeneratedUnits||"0", onChange:setDetail(i,"rrGeneratedUnits") }))
          );
        }),
        R('div', { style:{ display:"flex", gap:10 } },
          R(SecondaryButton, { onClick:function(){ setShowSplitSetup(true); }, style:{ flex:1 } }, "← Back"),
          R(PrimaryButton, { onClick:saveAll, style:{ flex:2 } }, editingCbId?"Update Commercial Record":"Save Packaging Records")
        )
      )
    ),
    R(SectionHeading, { title:"Commercial Batch Register", small:true }),
    R('div', { style:{ display:"flex", flexDirection:"column", gap:10 } },
      deptCBs.map(function(cb){
        const calc = computeCB(cb, motherBatches);
        return R(Card, { key:cb.id, style:{ padding:14 } },
          R('div', { style:{ display:"flex", justifyContent:"space-between", alignItems:"center" } },
            R('div', null,
              R('div', { style:{ fontWeight:700, fontSize:14 } }, cb.id+" · "+cb.productName, R('span', { style:{ color:C.sub } }, " (MB: "+cb.mbId+")")),
              R('div', { style:{ fontSize:12, color:C.sub, marginTop:2 } }, "Batch #"+cb.batchNumber+" · Recv: "+cb.unitsReceived+" ("+calc.recvLakh+" Lacs) · Packed: "+cb.packedQty+" ("+calc.packedLakh+" Lacs) · RR Retained: ", R('b', null, calc.rrGen+" units"))
            ),
            R('div', { style:{ display:"flex", alignItems:"center", gap:8 } },
              R(YieldBadge, { value:calc.pkgYield }),
              R('button', { type:"button", className:"btn-nav btn-edit", style:{ padding:"4px 8px", fontSize:11 }, onClick:function(){ editCB(cb); } }, "✏️ Edit"),
              R('button', { type:"button", className:"btn-nav btn-delete", style:{ padding:"4px 8px", fontSize:11 }, onClick:function(){ deleteCB(cb.id); } }, "🗑️ Delete")
            )
          )
        );
      })
    ),
    toast ? R(Toast, { message:toast, onDone:function(){ setToast(""); } }) : null
  );
}
