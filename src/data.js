export const PHASES = [
  { id:1, name:"Foundation + Corrective Strength", wk:"1–6", c:"#10b981", desc:"Movement quality, pain resolution, corrective loading RPE 5–6",
    exit:["Single-leg stance 30s no Trendelenburg","Full squat — no valgus, neutral pelvis","Knee-to-wall ≥10cm bilateral","Thomas test negative","Tennis elbow ≤2/10","No flare-ups 2+ weeks","Chin tuck hold >30s"] },
  { id:2, name:"Hypertrophy & Strength Base", wk:"7–14", c:"#3b82f6", desc:"Muscle mass, connective tissue, RPE 7–8",
    exit:["Squat ≥0.75× BW × 5","Trap bar DL ≥1.0× BW × 5","Bench ≥0.65× BW × 5","RFESS 10/side + 20% BW","No pain 4+ weeks","≥85% session completion"] },
  { id:3, name:"Strength & Power", wk:"15–22", c:"#f59e0b", desc:"Max strength, explosive power, RFD",
    exit:["Squat ≥1.0× BW × 3","Box jump 20\"+ soft landing","4×4 HIIT at 90% HRmax","Plyo volume 50+ contacts"] },
  { id:4, name:"Athletic & Sport Transfer", wk:"23–28", c:"#ef4444", desc:"Court movement, lateral agility, rotational power",
    exit:["Reactive agility at match tempo","Split-step timing consistent","3-step deceleration controlled","Pain-free court movement"] },
  { id:5, name:"In-Season Maintenance", wk:"29+", c:"#a855f7", desc:"Sport performance, minimum effective dose",
    exit:["Strength within 5%","No new injuries","Energy stable","VO2max maintained"] }
];

export const ST = {
  gym:{i:"🏋️",c:"#10b981",l:"Gym"}, court:{i:"🎾",c:"#f59e0b",l:"Court"}, cardio:{i:"❤️",c:"#3b82f6",l:"Cardio"},
  rest:{i:"😴",c:"#555",l:"Rest"}, yoga:{i:"🧘",c:"#a855f7",l:"Yoga"}, pilates:{i:"💪",c:"#ec4899",l:"Pilates"},
  swim:{i:"🏊",c:"#06b6d4",l:"Swim"}, custom:{i:"⚡",c:"#f97316",l:"Custom"}
};

export const SCHED = {
  1: [
    { day:"Monday",t:"Corrective Strength A",s:"Lower Body",ty:"gym",d:60,rp:"4–5",
      wu:[{n:"Foam roll quads & TFL",d:"60–90s/side"},{n:"Foam roll piriformis",d:"60s/side"},{n:"Lacrosse ball plantar fascia",d:"1–2min/foot"},{n:"Hip flexor stretch",d:"30s×3/side"},{n:"Wall calf stretch (straight+bent)",d:"30s×3 each/side"},{n:"Banded ankle mobilisation",d:"2×15/side"}],
      ex:[{n:"Glute bridge",s:3,r:"15",te:"2s hold"},{n:"Clamshell (band)",s:3,r:"15/side",te:"2s hold"},{n:"Terminal knee extension",s:3,r:"15",te:"Controlled"},{n:"Dead bug",s:3,r:"10/side",te:"Slow"},{n:"Bird dog",s:3,r:"10/side",te:"5s hold"},{n:"Goblet squat (light)",s:3,r:"10",te:"Controlled",no:"RPE 5"},{n:"Eccentric calf raise",s:3,r:"12",te:"3–4s lower"}] },
    { day:"Tuesday",t:"Tennis / Padel",s:"Light Technique",ty:"court",d:70,rp:"4–5",
      wu:[{n:"Hip + ankle + glute activation",d:"10 min"}],
      ex:[{n:"Rally practice",s:1,r:"20 min",te:""},{n:"Serve practice",s:1,r:"15 min",te:""},{n:"Light match play",s:1,r:"30 min",te:"",no:"RPE 4–5"}] },
    { day:"Wednesday",t:"Corrective Strength B",s:"Upper Body + Recovery",ty:"gym",d:60,rp:"4–5",
      wu:[{n:"Foam roll thoracic",d:"10 reps × 3 pos"},{n:"Doorway pec stretch",d:"30s×2/side"},{n:"Open book rotation",d:"10/side"},{n:"Cat-cow",d:"10 reps"},{n:"Chin tucks",d:"10 × 5s hold"}],
      ex:[{n:"Prone Y-T-W",s:3,r:"10 each",te:"Controlled"},{n:"Band pull-aparts",s:3,r:"15",te:"Squeeze"},{n:"Face pulls",s:3,r:"15",te:"2s hold"},{n:"DB row (light)",s:3,r:"10/side",te:"Controlled",no:"RPE 5"},{n:"Tyler Twist (FlexBar)",s:3,r:"15",te:"4s ecc"},{n:"Pallof press",s:3,r:"10/side",te:"2s hold"},{n:"Pool recovery",s:1,r:"15–20 min",te:"Easy"}] },
    { day:"Thursday",t:"Mobility + Zone 2",s:"Recovery",ty:"cardio",d:55,rp:"3–4",
      wu:[{n:"Full foam roll",d:"8 min"}],
      ex:[{n:"Hip flexor series",s:1,r:"3 min",te:""},{n:"Ankle mobility",s:1,r:"3 min",te:""},{n:"Thoracic mobility",s:1,r:"3 min",te:""},{n:"Zone 2 (row/bike/pool)",s:1,r:"25–30 min",te:"",no:"60–70% HRmax"}] },
    { day:"Friday",t:"Corrective Strength C",s:"Full Body Integration",ty:"gym",d:60,rp:"5–6",
      wu:[{n:"Standard warm-up",d:"Foam roll + hip + ankle + glute — 10 min"}],
      ex:[{n:"Pallof press",s:3,r:"10/side",te:"2s hold"},{n:"Split squats",s:3,r:"10/side",te:"Controlled"},{n:"Step-ups w/ hip drive",s:3,r:"10/side",te:""},{n:"Single-leg RDL",s:3,r:"8/side",te:"Controlled"},{n:"SL glute bridge",s:3,r:"10/side",te:"2s hold"},{n:"Dead bug (band)",s:3,r:"10/side",te:"Slow"},{n:"Zone 2 cardio",s:1,r:"20 min",te:""}] },
    { day:"Saturday",t:"Tennis / Padel",s:"Moderate",ty:"court",d:75,rp:"4–6",
      wu:[{n:"Corrective warm-up",d:"10 min"}],
      ex:[{n:"Court session / active recovery",s:1,r:"60–75 min",te:""}] },
    { day:"Sunday",t:"Rest",s:"Full Recovery",ty:"rest",d:0,rp:"0–1",wu:[],ex:[{n:"Gentle walk or swim",s:1,r:"30 min max",te:"Easy"}] }
  ],
  2: [
    { day:"Monday",t:"Strength A — Lower",s:"Hypertrophy RPE 7",ty:"gym",d:65,rp:"7",wu:[{n:"Corrective warm-up",d:"12 min"}],
      ex:[{n:"Back squat",s:4,r:"8–10",te:"Controlled",no:"RPE 7"},{n:"Romanian deadlift",s:3,r:"10",te:"2s ecc"},{n:"Bulgarian split squat",s:3,r:"10/side",te:""},{n:"Leg curl",s:3,r:"12",te:""},{n:"Eccentric calf raise",s:3,r:"12",te:"3s lower"},{n:"Pallof press",s:3,r:"10/side",te:""}] },
    { day:"Tuesday",t:"Tennis / Padel",s:"Regular",ty:"court",d:75,rp:"5–6",wu:[{n:"Corrective warm-up",d:"10 min"}],ex:[{n:"Court session",s:1,r:"60–75 min",te:""}] },
    { day:"Wednesday",t:"Strength B — Upper",s:"Hypertrophy + Zone 2",ty:"gym",d:70,rp:"7",wu:[{n:"Thoracic + shoulder",d:"8 min"}],
      ex:[{n:"DB bench press",s:4,r:"8–10",te:"Controlled",no:"RPE 7"},{n:"Cable row",s:4,r:"10",te:"Squeeze"},{n:"Landmine press",s:3,r:"10",te:""},{n:"Face pulls",s:3,r:"15",te:""},{n:"Tyler Twist + wrist ecc",s:3,r:"15",te:"4s ecc"},{n:"Cable woodchops",s:3,r:"10/side",te:""},{n:"Zone 2 (bike/row)",s:1,r:"20–30 min",te:""}] },
    { day:"Thursday",t:"Zone 2",s:"Aerobic Base",ty:"cardio",d:50,rp:"4",wu:[{n:"Light mobility",d:"5 min"}],ex:[{n:"Zone 2 (row/bike/pool)",s:1,r:"40–45 min",te:"",no:"60–70% HRmax"}] },
    { day:"Friday",t:"Strength C — Full Body",s:"RPE 7–8",ty:"gym",d:65,rp:"7–8",wu:[{n:"Corrective warm-up",d:"10 min"}],
      ex:[{n:"Trap bar deadlift",s:4,r:"5",te:"Controlled",no:"RPE 7–8"},{n:"DB bench press",s:4,r:"6",te:""},{n:"FFESS",s:3,r:"8/side",te:""},{n:"Bent-over row",s:3,r:"8",te:""},{n:"Single-leg RDL",s:3,r:"8/side",te:""},{n:"Farmer's carry",s:3,r:"40m",te:""}] },
    { day:"Saturday",t:"Tennis / Padel",s:"Regular",ty:"court",d:75,rp:"5–7",wu:[{n:"Corrective warm-up",d:"10 min"}],ex:[{n:"Court session",s:1,r:"60–75 min",te:""}] },
    { day:"Sunday",t:"Rest",s:"Recovery",ty:"rest",d:0,rp:"0–1",wu:[],ex:[{n:"Rest",s:1,r:"—",te:""}] }
  ],
  3: [
    { day:"Monday",t:"Lower — Strength + Power",s:"RPE 7–8",ty:"gym",d:70,rp:"7–8",wu:[{n:"Corrective + CNS activation",d:"12 min"}],
      ex:[{n:"Box jumps / Lateral bounds",s:4,r:"4",te:"Full recovery",no:"Max intent"},{n:"Back squat",s:4,r:"4–5",te:"Controlled",no:"RPE 8"},{n:"Romanian deadlift",s:3,r:"6",te:"2s ecc"},{n:"Walking lunges",s:3,r:"8/side",te:""},{n:"Calf raises + clamshells",s:2,r:"12 each",te:""}] },
    { day:"Tuesday",t:"Tennis / Padel",s:"Practice",ty:"court",d:75,rp:"6–7",wu:[{n:"Corrective warm-up",d:"10 min"}],ex:[{n:"Court session",s:1,r:"60–75 min",te:""}] },
    { day:"Wednesday",t:"Upper — Str + Rotation + HIIT",s:"RPE 7–8",ty:"gym",d:75,rp:"7–8",wu:[{n:"Thoracic + shoulder",d:"8 min"}],
      ex:[{n:"Med ball rotational throw",s:4,r:"5/side",te:"Max velocity"},{n:"Bench press",s:4,r:"4–5",te:"Controlled",no:"RPE 8"},{n:"Pull-up / Lat pulldown",s:4,r:"5",te:""},{n:"Face pulls + DB press",s:3,r:"12 / 8",te:""},{n:"Norwegian 4×4 (rower)",s:4,r:"4min / 3min off",te:"90–95% HRmax"}] },
    { day:"Thursday",t:"Zone 2",s:"Aerobic + Recovery",ty:"cardio",d:55,rp:"3–4",wu:[{n:"Mobility circuit",d:"10 min"}],ex:[{n:"Zone 2 (row/bike/pool)",s:1,r:"45–55 min",te:""}] },
    { day:"Friday",t:"Full Body — Power",s:"RPE 7–8",ty:"gym",d:65,rp:"7–8",wu:[{n:"Corrective + activation",d:"10 min"}],
      ex:[{n:"Kettlebell swing",s:4,r:"8",te:"Explosive"},{n:"Landmine rotation press",s:3,r:"5/side",te:"Explosive"},{n:"Trap bar deadlift",s:3,r:"4",te:"",no:"RPE 8"},{n:"Single-arm DB row",s:3,r:"6/side",te:""},{n:"Split squat + Pallof",s:3,r:"6/side",te:""}] },
    { day:"Saturday",t:"Tennis / Padel",s:"Match Play",ty:"court",d:80,rp:"7–8",wu:[{n:"Corrective warm-up",d:"10 min"}],ex:[{n:"Match play",s:1,r:"60–80 min",te:""}] },
    { day:"Sunday",t:"Rest",s:"Recovery",ty:"rest",d:0,rp:"0–1",wu:[],ex:[{n:"Rest",s:1,r:"—",te:""}] }
  ],
  4: [
    { day:"Monday",t:"Agility + Power",s:"Track & Gym",ty:"gym",d:60,rp:"7–8",wu:[{n:"Dynamic warm-up",d:"12 min"}],
      ex:[{n:"Split-step drill",s:4,r:"6",te:"Reactive"},{n:"Lateral shuffle → decel",s:4,r:"4/dir",te:"Max"},{n:"Back squat (maint)",s:3,r:"5",te:"",no:"RPE 7–8"},{n:"Single-leg RDL",s:3,r:"6/side",te:""},{n:"Med ball throws",s:3,r:"5/side",te:"Max velocity"}] },
    { day:"Tuesday",t:"Tennis / Padel",s:"Competitive",ty:"court",d:85,rp:"7–8",wu:[{n:"Corrective warm-up",d:"10 min"}],ex:[{n:"Competitive practice",s:1,r:"75–85 min",te:""}] },
    { day:"Wednesday",t:"Upper + Zone 2",s:"Maintenance",ty:"gym",d:55,rp:"5–7",wu:[{n:"Thoracic warm-up",d:"8 min"}],
      ex:[{n:"DB bench press",s:3,r:"6",te:"",no:"RPE 7–8"},{n:"Cable row",s:3,r:"8",te:""},{n:"Face pulls",s:3,r:"12",te:""},{n:"Zone 2",s:1,r:"25–30 min",te:""}] },
    { day:"Thursday",t:"Mobility + Zone 2",s:"Recovery",ty:"cardio",d:50,rp:"3–4",wu:[{n:"Full mobility",d:"15 min"}],ex:[{n:"Zone 2 (pool/bike)",s:1,r:"35–40 min",te:""}] },
    { day:"Friday",t:"Court Speed + Gym",s:"Agility",ty:"gym",d:60,rp:"7–8",wu:[{n:"Dynamic warm-up",d:"10 min"}],
      ex:[{n:"T-drill",s:4,r:"3",te:"Max"},{n:"Reactive agility",s:4,r:"6",te:"Reactive"},{n:"Trap bar deadlift",s:3,r:"4",te:""},{n:"Farmer's carry",s:3,r:"40m",te:""}] },
    { day:"Saturday",t:"Tennis / Padel",s:"Match Play",ty:"court",d:85,rp:"7–8",wu:[{n:"Corrective warm-up",d:"10 min"}],ex:[{n:"Match play",s:1,r:"75–85 min",te:""}] },
    { day:"Sunday",t:"Rest",s:"Recovery",ty:"rest",d:0,rp:"0–1",wu:[],ex:[{n:"Rest",s:1,r:"—",te:""}] }
  ],
  5: [
    { day:"Monday",t:"Gym A — Maintenance",s:"Strength",ty:"gym",d:50,rp:"7–8",wu:[{n:"Corrective warm-up",d:"12 min"}],
      ex:[{n:"Back squat",s:3,r:"5",te:"",no:"RPE 7–8"},{n:"DB bench press",s:3,r:"6",te:""},{n:"Single-leg RDL",s:3,r:"6/side",te:""},{n:"Cable row",s:3,r:"8",te:""},{n:"Pallof press",s:2,r:"10/side",te:""}] },
    { day:"Tuesday",t:"Tennis / Padel",s:"Regular",ty:"court",d:75,rp:"6–7",wu:[{n:"Corrective warm-up",d:"10 min"}],ex:[{n:"Court session",s:1,r:"60–75 min",te:""}] },
    { day:"Wednesday",t:"Zone 2 + HIIT",s:"Cardio",ty:"cardio",d:55,rp:"Var",wu:[{n:"Light mobility",d:"5 min"}],
      ex:[{n:"Zone 2",s:1,r:"30 min",te:""},{n:"Norwegian 4×4",s:3,r:"4min / 3min off",te:"90–95% HRmax"}] },
    { day:"Thursday",t:"Gym B — Power",s:"Maintenance",ty:"gym",d:50,rp:"7–8",wu:[{n:"Corrective + activation",d:"12 min"}],
      ex:[{n:"Kettlebell swing",s:3,r:"8",te:"Explosive"},{n:"Trap bar deadlift",s:3,r:"4",te:""},{n:"Landmine press",s:3,r:"8",te:""},{n:"Med ball rotational",s:3,r:"5/side",te:""},{n:"Face pulls + calf raises",s:2,r:"12 each",te:""}] },
    { day:"Friday",t:"Tennis / Padel",s:"Regular",ty:"court",d:75,rp:"6–7",wu:[{n:"Corrective warm-up",d:"10 min"}],ex:[{n:"Court session",s:1,r:"60–75 min",te:""}] },
    { day:"Saturday",t:"Tennis or Zone 2",s:"Active",ty:"court",d:70,rp:"5–7",wu:[{n:"Warm-up",d:"10 min"}],ex:[{n:"Court or Zone 2",s:1,r:"60–70 min",te:""}] },
    { day:"Sunday",t:"Rest",s:"Recovery",ty:"rest",d:0,rp:"0–1",wu:[],ex:[{n:"Rest",s:1,r:"—",te:""}] }
  ]
};

export const SUPPS = [
  {n:"Creatine monohydrate",d:"3–5g",t:"Any time"},
  {n:"Vitamin D3 + K2",d:"2–4000 IU + 100mcg",t:"With fat"},
  {n:"Omega-3 (EPA/DHA)",d:"2–3g",t:"With meal"},
  {n:"Magnesium glycinate",d:"300–400mg",t:"Before bed"},
  {n:"Collagen + Vit C",d:"10–15g + 50mg",t:"30–60 min pre-training"},
  {n:"CoQ10 (ubiquinol)",d:"100–200mg",t:"With meal"}
];

export const RECOV = ["7.5–8.5 hrs sleep","Morning sunlight (10 min)","Protein target (1.6–2.0g/kg)","Hydration (3L+)","Collagen pre-training"];
export const DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const PAIN_AREAS = ["Knee (L)","Knee (R)","Ankle (L)","Ankle (R)","Elbow (R)","Elbow (L)","Neck","Lower back","Shoulder (L)","Shoulder (R)","Hip (L)","Hip (R)","Calf (L)","Calf (R)","Pec / chest"];
export const KEY_LIFTS = ["Back squat","Trap bar deadlift","DB bench press","Bench press","Romanian deadlift","Bulgarian split squat","Goblet squat","Landmine press","Pull-up / Lat pulldown","Kettlebell swing"];
export const INBODY_FIELDS = [{k:"weight",l:"Weight (kg)",u:"kg"},{k:"smm",l:"Skeletal Muscle Mass",u:"kg"},{k:"bfp",l:"Body Fat %",u:"%"},{k:"bfm",l:"Body Fat Mass",u:"kg"},{k:"tbw",l:"Total Body Water",u:"L"},{k:"vfl",l:"Visceral Fat Level",u:""},{k:"bmr",l:"BMR",u:"kcal"}];

// ─── PADEL DATA ─────────────────────────────────────────────────────────────

export const PADEL_SHOTS = [
  { k:"bandeja", l:"Bandeja", d:"Controlled overhead slice — your safety net" },
  { k:"vibora", l:"Víbora", d:"Aggressive sidespin overhead — point finisher" },
  { k:"chiquita", l:"Chiquita", d:"Soft dip to feet — transition weapon" },
  { k:"bh_volley", l:"Backhand Volley", d:"Primary defensive weapon at net" },
  { k:"bajada", l:"Bajada de Pared", d:"Backhand wall shot — defense to offense" },
  { k:"serve", l:"Serve Placement", d:"Side glass/body/wide variation" }
];

export const TACTICAL_PRINCIPLES = [
  "Never attempt winners from red zone",
  "Own the middle with forehand",
  "Stay 2–3m from net when attacking",
  "Shadow movement with partner",
  "Avoid no man's land",
  "Hit at 50–70% power",
  "Follow every chiquita forward",
  "Recover forward after every bandeja",
  "Direct 70% to weaker opponent (nevera)",
  "Play the right shot for the right zone"
];

export const TACTICAL_FOCUS_OPTIONS = [
  ...["Red zone discipline","Middle ball ownership","Net positioning","Shadow movement","Zone transitions","Pace control","Chiquita approaches","Bandeja recovery","La nevera execution","Zone-based shot selection"],
  ...["Bandeja variation","Víbora development","Chiquita disguise","Backhand volley control","Bajada power","Serve placement","Lob depth","Passing shot timing","Return of serve","Wall reading"]
];

