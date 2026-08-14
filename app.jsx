const { useState, useMemo, useEffect } = React;

const INK = "#1B2420";
const FILM = "#E3E6E3";
const FILM2 = "#EDEFEC";
const RULE = "#A8B0AB";
const MAG = "#B0246A";
const CYAN = "#0E6B8C";
const AMB = "#B07714";

const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SANS = "'IBM Plex Sans', system-ui, sans-serif";
const DISP = "'Saira Condensed', 'IBM Plex Sans', sans-serif";

const IN_PER_M = 39.3700787402;
const FT_PER_M = 3.2808398950;
const SQFT_PER_SQM = 10.7639104167;

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function ftIn(m, denom = 8) {
  const total = m * IN_PER_M;
  const sign = total < 0 ? "-" : "";
  let t = Math.abs(total);
  let ft = Math.floor(t / 12);
  let n = Math.round((t - ft * 12) * denom);
  if (n >= 12 * denom) {
    ft += 1;
    n = 0;
  }
  const whole = Math.floor(n / denom);
  const rem = n - whole * denom;
  let frac = "";
  if (rem) {
    const d = gcd(rem, denom);
    frac = ` ${rem / d}/${denom / d}`;
  }
  return `${sign}${ft}'-${whole}${frac}"`;
}

function inchOnly(m, denom = 16) {
  const t = m * IN_PER_M;
  const n = Math.round(t * denom);
  const whole = Math.floor(n / denom);
  const rem = n - whole * denom;
  if (!rem) return `${whole}"`;
  const d = gcd(rem, denom);
  return `${whole} ${rem / d}/${denom / d}"`;
}

const ISLAND_PROGRAMS = [
  { n: "Boxing ring + apron", w: 7.8, l: 7.8 },
  { n: "Breaking / dance circle", w: 12, l: 12 },
  { n: "Stage + front pit", w: 10, l: 14 },
  { n: "3x3 basketball", w: 11, l: 15 },
  { n: "Padel court", w: 10, l: 20 },
  { n: "Full basketball", w: 15, l: 28 },
  { n: "Tennis + runoff", w: 17, l: 34 },
  { n: "Futsal", w: 20, l: 40 },
];

const RING_PROGRAMS = [
  { n: "Processional / parade", c: 0, lane: 3 },
  { n: "Skate pump-track loop", c: 60, lane: 4 },
  { n: "Short-track skating oval", c: 100, lane: 7, hi: 125 },
  { n: "Criterium bike circuit", c: 120, lane: 6 },
  { n: "Athletics relay loop", c: 150, lane: 6 },
];

const SWEEP = [12, 18, 25, 35, 50, 70, 100, 140];

const SITES = [
  { n: "Columbus Circle", c: "New York", lat: 40.76808, lng: -73.98195, icd: 116, w: 18 },
  { n: "Buckingham Fountain", c: "Chicago", lat: 41.87587, lng: -87.61895, icd: 100, w: 10 },
  { n: "Place Charles de Gaulle", c: "Paris", lat: 48.87380, lng: 2.29500, icd: 240, w: 26 },
];

const MERC = 20037508.342789244;
const toMercX = (lng) => (lng * MERC) / 180;
const toMercY = (lat) =>
  (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) * (MERC / 180);

const TILESETS = {
  clean: {
    n: "Clean 2D",
    max: 20,
    credit: "© OpenStreetMap contributors, © CARTO",
    url: (z, x, y) => `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}@2x.png`,
  },
  bare: {
    n: "No labels",
    max: 20,
    credit: "© OpenStreetMap contributors, © CARTO",
    url: (z, x, y) => `https://basemaps.cartocdn.com/light_nolabels/${z}/${x}/${y}@2x.png`,
  },
  voyager: {
    n: "Voyager",
    max: 20,
    credit: "© OpenStreetMap contributors, © CARTO",
    url: (z, x, y) => `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png`,
  },
  dark: {
    n: "Dark",
    max: 20,
    credit: "© OpenStreetMap contributors, © CARTO",
    url: (z, x, y) => `https://basemaps.cartocdn.com/dark_nolabels/${z}/${x}/${y}@2x.png`,
  },
  street: {
    n: "Street",
    max: 19,
    credit: "Esri, HERE, Garmin, OpenStreetMap contributors",
    url: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
  },
  satellite: {
    n: "Satellite",
    max: 19,
    credit: "Esri, Maxar, Earthstar Geographics",
    url: (z, x, y) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
};

function computeNode(p) {
  const islandD = p.icd - 2 * p.w;
  const seatingD = islandD - 2 * p.apron;
  const ok = seatingD > 6;
  const r0 = seatingD / 2;
  const D1 = Math.max(p.apron + (p.focus === "far" ? p.w : 0), 1.2);
  const C = p.targetC / 1000;
  const rows = [];
  let h = p.eye1;
  for (let i = 0; i < p.rows; i++) {
    const ro = r0 - i * p.rowDepth;
    if (ro < 2.4) break;
    if (i > 0) {
      const Dn = D1 + i * p.rowDepth;
      h = ((h + C) * Dn) / (Dn - p.rowDepth);
    }
    const seats = Math.floor(((2 * Math.PI * (ro - p.rowDepth / 2)) / p.seatW) * 0.85);
    rows.push({
      i: i + 1,
      ro,
      ri: ro - p.rowDepth,
      D: D1 + i * p.rowDepth,
      eye: h,
      deck: h - 1.15,
      riser: i === 0 ? h - p.eye1 : h - rows[i - 1].eye,
      seats,
    });
  }
  const cap = rows.reduce((a, r) => a + r.seats, 0);
  const maxRiser = rows.reduce((a, r) => Math.max(a, r.riser), 0);
  const top = rows.length ? rows[rows.length - 1] : null;
  const islandArea = (Math.PI * seatingD * seatingD) / 4;
  return {
    ok,
    islandD,
    seatingD,
    rows,
    cap,
    maxRiser,
    top,
    islandArea,
    standing: Math.floor(islandArea / 0.4),
    ringInner: Math.PI * islandD,
    ringCentre: Math.PI * (p.icd - p.w),
    ringOuter: Math.PI * p.icd,
    trackArea: (Math.PI / 4) * (p.icd * p.icd - islandD * islandD),
  };
}

function Field({ label, value, min, max, step, impStep, imp, kind = "len", onChange }) {
  let sv = value,
    smin = min,
    smax = max,
    sstep = step,
    disp;
  if (kind === "plain") {
    disp = value;
  } else if (!imp) {
    disp = `${value} ${kind === "mm" ? "mm" : "m"}`;
  } else if (kind === "mm") {
    sv = +(value / 25.4).toFixed(4);
    smin = min / 25.4;
    smax = max / 25.4;
    sstep = 0.125;
    disp = inchOnly(value / 1000);
  } else {
    sv = +(value * IN_PER_M).toFixed(3);
    smin = min * IN_PER_M;
    smax = max * IN_PER_M;
    sstep = impStep || 1;
    disp = ftIn(value);
  }
  const back = (x) => {
    if (kind === "plain" || !imp) return x;
    return kind === "mm" ? +(x * 25.4).toFixed(2) : +(x / IN_PER_M).toFixed(4);
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: SANS, fontSize: 12, color: INK }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: MAG }}>{disp}</span>
      </div>
      <input
        type="range"
        min={smin}
        max={smax}
        step={sstep}
        value={sv}
        onChange={(e) => onChange(back(parseFloat(e.target.value)))}
        style={{ width: "100%", accentColor: MAG, marginTop: 4 }}
      />
    </div>
  );
}

function Metric({ label, value, unit, flag }) {
  return (
    <div style={{ borderTop: `1px solid ${RULE}`, padding: "7px 0" }}>
      <div style={{ fontFamily: SANS, fontSize: 11, color: RULE, letterSpacing: 0.2 }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 17, color: flag ? AMB : INK }}>
        {value}
        <span style={{ fontSize: 11, color: RULE }}> {unit}</span>
      </div>
    </div>
  );
}

function RoundaboutNodeCalculator() {
  const [p, setP] = useState({
    icd: 116,
    w: 18,
    apron: 3,
    setback: 14,
    facade: 40,
    focus: "near",
    targetC: 90,
    rows: 14,
    rowDepth: 0.85,
    eye1: 1.4,
    seatW: 0.5,
    lat: 40.76808,
    lng: -73.98195,
    site: "Columbus Circle",
    city: "New York",
    showImagery: true,
    style: "clean",
    imgOpacity: 0.85,
    units: "imp",
  });
  const [tab, setTab] = useState("node");
  const [tileState, setTileState] = useState("loading");
  const set = (k) => (v) => setP((s) => ({ ...s, [k]: v }));
  const r = useMemo(() => computeNode(p), [p]);
  const imp = p.units === "imp";
  const L = (m) => (imp ? ftIn(m) : m.toFixed(2));
  const LU = imp ? "ft-in" : "m";
  const A = (m2) => (imp ? Math.round(m2 * SQFT_PER_SQM).toLocaleString() : Math.round(m2).toLocaleString());
  const AU = imp ? "ft²" : "m²";

  const fitIsland = (a, b) =>
    a * a + b * b <= r.seatingD * r.seatingD && Math.min(a, b) <= r.seatingD;
  const bestIsland = ISLAND_PROGRAMS.filter((x) => fitIsland(x.w, x.l));
  const bestRing = RING_PROGRAMS.filter(
    (x) => r.ringCentre >= x.c && p.w >= x.lane && (!x.hi || r.ringCentre <= x.hi)
  );

  const W = 700;
  const baseY = 296;
  const extentX = p.icd / 2 + p.setback + 14;
  const maxH = Math.max(p.facade, r.top ? r.top.deck + 2 : 4) + 2;
  const k = Math.min((W - 96) / (2 * extentX), (baseY - 26) / maxH);
  const X = (m) => W / 2 + m * k;
  const Y = (m) => baseY - m * k;

  const stepPath = (sign) => {
    if (!r.rows.length) return "";
    let d = `M ${X(sign * r.rows[0].ro)} ${Y(0)}`;
    r.rows.forEach((row) => {
      d += ` L ${X(sign * row.ro)} ${Y(row.deck)} L ${X(sign * row.ri)} ${Y(row.deck)}`;
    });
    d += ` L ${X(0)} ${Y(r.top.deck)}`;
    return d;
  };

  const focusX = r.islandD / 2 + (p.focus === "far" ? p.w : 0);
  const seatR = r.seatingD / 2;

  const dim = (x1, x2, y, txt) => (
    <g>
      <line x1={X(x1)} y1={y} x2={X(x2)} y2={y} stroke={INK} strokeWidth="0.6" />
      <line x1={X(x1)} y1={y - 4} x2={X(x1)} y2={y + 4} stroke={INK} strokeWidth="0.6" />
      <line x1={X(x2)} y1={y - 4} x2={X(x2)} y2={y + 4} stroke={INK} strokeWidth="0.6" />
      <text
        x={(X(x1) + X(x2)) / 2}
        y={y - 6}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="10"
        fill={INK}
      >
        {txt}
      </text>
    </g>
  );

  const PW = 380;
  const pk = (PW / 2 - 26) / (p.icd / 2 + p.setback);
  const PX = (m) => PW / 2 + m * pk;
  const frameR = p.icd / 2 + p.setback;

  const basemap = useMemo(() => {
    const cos = Math.cos((p.lat * Math.PI) / 180);
    const ts = TILESETS[p.style] || TILESETS.clean;
    let z = Math.max(1, Math.min(ts.max, Math.ceil(Math.log2(156543.03392 * cos * pk))));
    let mpp, halfPx, cx, cy, tx0, tx1, ty0, ty1;
    for (;;) {
      const worldPx = 256 * Math.pow(2, z);
      mpp = (156543.03392 * cos) / Math.pow(2, z);
      cx = ((p.lng + 180) / 360) * worldPx;
      const s = Math.sin((p.lat * Math.PI) / 180);
      cy = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * worldPx;
      halfPx = frameR / mpp;
      tx0 = Math.floor((cx - halfPx) / 256);
      tx1 = Math.floor((cx + halfPx) / 256);
      ty0 = Math.floor((cy - halfPx) / 256);
      ty1 = Math.floor((cy + halfPx) / 256);
      if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) <= 36 || z <= 1) break;
      z -= 1;
    }
    const svgPerTilePx = pk * mpp;
    const tiles = [];
    for (let tx = tx0; tx <= tx1; tx++) {
      for (let ty = ty0; ty <= ty1; ty++) {
        tiles.push({
          k: `${p.style}/${z}/${tx}/${ty}`,
          url: ts.url(z, tx, ty),
          x: PW / 2 + (tx * 256 - cx) * svgPerTilePx,
          y: PW / 2 + (ty * 256 - cy) * svgPerTilePx,
          size: 256 * svgPerTilePx,
        });
      }
    }
    return { tiles, credit: ts.credit, z, mpp };
  }, [p.lat, p.lng, p.style, frameR, pk]);

  useEffect(() => {
    setTileState("loading");
  }, [p.style, p.lat, p.lng]);

  const sweep = SWEEP.map((icd) => {
    const q = computeNode({ ...p, icd });
    const fits = ISLAND_PROGRAMS.filter(
      (x) => x.w * x.w + x.l * x.l <= q.seatingD * q.seatingD
    );
    const ring = RING_PROGRAMS.filter(
      (x) => q.ringCentre >= x.c && p.w >= x.lane && (!x.hi || q.ringCentre <= x.hi)
    );
    return {
      icd,
      islandD: q.islandD,
      circ: q.ringCentre,
      cap: q.cap,
      standing: q.standing,
      island: fits.length ? fits[fits.length - 1] : null,
      ring: ring.length ? ring[ring.length - 1] : null,
    };
  });

  return (
    <div style={{ background: FILM, minHeight: "100vh", color: INK, fontFamily: SANS }}>
      <style>{`
        input[type=range]{height:16px}
        .plate{background:${FILM2};border:1px solid ${RULE}}
        table{border-collapse:collapse;width:100%}
        td,th{font-family:${MONO};font-size:11px;text-align:right;padding:4px 6px;border-bottom:1px solid ${RULE}}
        th{color:${RULE};font-weight:500;text-align:right}
        td:first-child,th:first-child{text-align:left}
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 20px 60px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: `2px solid ${INK}`,
            paddingBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: DISP,
                fontSize: 34,
                letterSpacing: 0.4,
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              Roundabout node calculator
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: MAG, marginTop: 4 }}>
              Inverted bowl sightline and capacity study
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button
              onClick={() => set("units")(p.units === "imp" ? "si" : "imp")}
              title="Switch unit system"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                padding: "7px 14px",
                marginBottom: 8,
                border: `1px solid ${INK}`,
                background: INK,
                color: FILM,
                cursor: "pointer",
                letterSpacing: 0.3,
              }}
            >
              {p.units === "imp" ? "FT-IN" : "METRIC"}
              <span style={{ opacity: 0.55 }}> · switch</span>
            </button>
            <div style={{ fontFamily: MONO, fontSize: 10, color: RULE }}>
              BREAK THE BOWL
              <br />
              SHEET 01 / SCALE LIVE
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, margin: "14px 0 16px" }}>
          {[
            ["node", "Single node"],
            ["taxonomy", "Taxonomy sweep"],
          ].map(([id, t]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                fontFamily: MONO,
                fontSize: 11,
                padding: "6px 16px",
                border: `1px solid ${tab === id ? INK : RULE}`,
                background: tab === id ? INK : "transparent",
                color: tab === id ? FILM : INK,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "node" ? (
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div className="plate" style={{ width: 262, padding: 16, flexShrink: 0 }}>
              <div style={{ fontFamily: DISP, fontSize: 17, textTransform: "uppercase", marginBottom: 12 }}>
                Site
              </div>
              <Field label="Inscribed circle diameter" value={p.icd} min={10} max={300} step={0.5} impStep={12} imp={imp} onChange={set("icd")} />
              <Field label="Circulatory roadway width" value={p.w} min={4.5} max={40} step={0.25} impStep={6} imp={imp} onChange={set("w")} />
              <Field label="Truck apron" value={p.apron} min={0} max={5} step={0.25} impStep={3} imp={imp} onChange={set("apron")} />
              <Field label="Facade setback" value={p.setback} min={0} max={40} step={0.5} impStep={12} imp={imp} onChange={set("setback")} />
              <Field label="Facade height" value={p.facade} min={3} max={60} step={0.5} impStep={12} imp={imp} onChange={set("facade")} />

              <div style={{ fontFamily: DISP, fontSize: 17, textTransform: "uppercase", margin: "18px 0 10px" }}>
                Basemap
              </div>
              {SITES.map((s) => (
                <button
                  key={s.n}
                  onClick={() =>
                    setP((v) => ({
                      ...v,
                      lat: s.lat,
                      lng: s.lng,
                      icd: s.icd,
                      w: s.w,
                      site: s.n,
                      city: s.c,
                    }))
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    fontFamily: MONO,
                    fontSize: 10,
                    lineHeight: 1.45,
                    padding: "5px 8px",
                    marginBottom: 4,
                    border: `1px solid ${p.site === s.n ? MAG : RULE}`,
                    background: p.site === s.n ? MAG : "transparent",
                    color: p.site === s.n ? FILM2 : INK,
                    cursor: "pointer",
                  }}
                >
                  {s.n}
                  <span style={{ display: "block", opacity: 0.7 }}>{s.c}</span>
                </button>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {[
                  ["lat", "Latitude"],
                  ["lng", "Longitude"],
                ].map(([kk, lbl]) => (
                  <label key={kk} style={{ flex: 1, fontFamily: SANS, fontSize: 11, color: RULE }}>
                    {lbl}
                    <input
                      type="number"
                      step="0.00001"
                      value={p[kk]}
                      onChange={(e) =>
                        setP((v) => ({ ...v, [kk]: parseFloat(e.target.value) || 0, site: "Custom location", city: "" }))
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        fontFamily: MONO,
                        fontSize: 11,
                        padding: "4px 5px",
                        marginTop: 3,
                        border: `1px solid ${RULE}`,
                        background: FILM,
                        color: INK,
                      }}
                    />
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                {Object.entries(TILESETS).map(([id, t]) => (
                  <button
                    key={id}
                    onClick={() => set("style")(id)}
                    style={{
                      flex: "1 1 30%",
                      fontFamily: MONO,
                      fontSize: 10,
                      padding: "6px 2px",
                      border: `1px solid ${p.style === id ? MAG : RULE}`,
                      background: p.style === id ? MAG : "transparent",
                      color: p.style === id ? FILM2 : INK,
                      cursor: "pointer",
                    }}
                  >
                    {t.n}
                  </button>
                ))}
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: SANS,
                  fontSize: 12,
                  margin: "10px 0 6px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={p.showImagery}
                  onChange={(e) => set("showImagery")(e.target.checked)}
                  style={{ accentColor: MAG }}
                />
                Show basemap
              </label>
              <Field label="Basemap opacity" value={p.imgOpacity} min={0.15} max={1} step={0.05} kind="plain" onChange={set("imgOpacity")} />

              <div style={{ fontFamily: DISP, fontSize: 17, textTransform: "uppercase", margin: "18px 0 12px" }}>
                Bank
              </div>
              <Field label="Target C-value" value={p.targetC} min={30} max={150} step={5} kind="mm" imp={imp} onChange={set("targetC")} />
              <Field label="Rows" value={p.rows} min={2} max={40} step={1} kind="plain" onChange={set("rows")} />
              <Field label="Row depth" value={p.rowDepth} min={0.7} max={1.1} step={0.05} impStep={1} imp={imp} onChange={set("rowDepth")} />
              <Field label="Front row eye height" value={p.eye1} min={0.9} max={3} step={0.05} impStep={1} imp={imp} onChange={set("eye1")} />
              <Field label="Seat width" value={p.seatW} min={0.45} max={0.62} step={0.01} impStep={0.5} imp={imp} onChange={set("seatW")} />

              <div style={{ fontFamily: SANS, fontSize: 12, marginTop: 6 }}>Point of focus</div>
              <div style={{ display: "flex", gap: 0, marginTop: 6 }}>
                {[
                  ["near", "Near kerb"],
                  ["far", "Far kerb"],
                ].map(([id, t]) => (
                  <button
                    key={id}
                    onClick={() => set("focus")(id)}
                    style={{
                      flex: 1,
                      fontFamily: MONO,
                      fontSize: 10,
                      padding: "6px 4px",
                      border: `1px solid ${p.focus === id ? MAG : RULE}`,
                      background: p.focus === id ? MAG : "transparent",
                      color: p.focus === id ? FILM2 : INK,
                      cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: "1 1 420px", minWidth: 380 }}>
              <div className="plate" style={{ padding: "10px 12px 4px" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: RULE, marginBottom: 2 }}>
                  SECTION — INVERTED BOWL
                </div>
                <svg width="100%" viewBox={`0 0 ${W} 340`} style={{ display: "block" }}>
                  {[-1, 1].map((s) => (
                    <rect
                      key={s}
                      x={s === 1 ? X(p.icd / 2 + p.setback) : X(-(p.icd / 2 + p.setback + 14))}
                      y={Y(p.facade)}
                      width={14 * k}
                      height={p.facade * k}
                      fill="none"
                      stroke={INK}
                      strokeWidth="0.7"
                    />
                  ))}
                  {[-1, 1].map((s) => (
                    <rect
                      key={s}
                      x={s === 1 ? X(r.islandD / 2) : X(-p.icd / 2)}
                      y={Y(0) - 3}
                      width={p.w * k}
                      height={3}
                      fill={MAG}
                      opacity="0.75"
                    />
                  ))}
                  <line x1={X(-extentX)} y1={Y(0)} x2={X(extentX)} y2={Y(0)} stroke={INK} strokeWidth="0.9" />
                  {r.top && (
                    <>
                      <line x1={X(seatR - (r.rows.length - 1) * p.rowDepth)} y1={Y(r.top.eye)} x2={X(focusX)} y2={Y(0)} stroke={MAG} strokeWidth="0.7" strokeDasharray="4 3" />
                      <line x1={X(seatR)} y1={Y(p.eye1)} x2={X(p.icd / 2 + p.setback)} y2={Y(p.facade)} stroke={CYAN} strokeWidth="0.7" strokeDasharray="2 3" />
                    </>
                  )}
                  {[1, -1].map((s) => (
                    <path key={s} d={stepPath(s)} fill={CYAN} fillOpacity="0.14" stroke={CYAN} strokeWidth="0.9" />
                  ))}
                  {[-1, 1].map((s) => (
                    <circle key={s} cx={X(s * focusX)} cy={Y(0)} r="3" fill={MAG} />
                  ))}
                  {dim(-p.icd / 2, p.icd / 2, baseY + 22, `ICD ${L(p.icd)}`)}
                  {dim(-r.islandD / 2, r.islandD / 2, baseY + 44, `island ${L(r.islandD)}`)}
                  <text x={X(0)} y={Y(0) + 14} textAnchor="middle" fontFamily={MONO} fontSize="9" fill={RULE}>
                    centre island
                  </text>
                  <text x={X(p.icd / 2 + p.setback + 7)} y={Y(p.facade) - 6} textAnchor="middle" fontFamily={MONO} fontSize="9" fill={INK}>
                    far tier
                  </text>
                </svg>
              </div>

              <div className="plate" style={{ padding: "10px 12px", marginTop: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: RULE, marginBottom: 4 }}>PLAN</div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <svg width={PW} height={PW} viewBox={`0 0 ${PW} ${PW}`} style={{ flexShrink: 0 }}>
                    <defs>
                      <clipPath id="planFrame">
                        <circle cx={PW / 2} cy={PW / 2} r={frameR * pk} />
                      </clipPath>
                    </defs>
                    {p.showImagery && (
                      <g clipPath="url(#planFrame)" opacity={p.imgOpacity}>
                        {basemap.tiles.map((t) => (
                          <image
                            key={t.k}
                            href={t.url}
                            x={t.x}
                            y={t.y}
                            width={t.size + 0.5}
                            height={t.size + 0.5}
                            preserveAspectRatio="none"
                            onLoad={() => setTileState("ok")}
                            onError={() => setTileState("blocked")}
                          />
                        ))}
                      </g>
                    )}
                    <circle cx={PW / 2} cy={PW / 2} r={frameR * pk} fill="none" stroke={RULE} strokeWidth="0.7" strokeDasharray="4 4" />
                    <circle cx={PW / 2} cy={PW / 2} r={(p.icd / 2) * pk} fill={MAG} fillOpacity="0.12" stroke={MAG} strokeWidth="1.1" />
                    <circle cx={PW / 2} cy={PW / 2} r={(r.islandD / 2) * pk} fill="none" stroke={MAG} strokeWidth="1.1" />
                    <line x1={PW / 2 - 8} y1={PW / 2} x2={PW / 2 + 8} y2={PW / 2} stroke={MAG} strokeWidth="0.8" />
                    <line x1={PW / 2} y1={PW / 2 - 8} x2={PW / 2} y2={PW / 2 + 8} stroke={MAG} strokeWidth="0.8" />
                    <circle cx={PW / 2} cy={PW / 2} r={(r.seatingD / 2) * pk} fill={CYAN} fillOpacity="0.16" stroke={CYAN} strokeWidth="0.8" />
                    {r.rows.map((row) => (
                      <circle key={row.i} cx={PW / 2} cy={PW / 2} r={row.ri * pk} fill="none" stroke={CYAN} strokeWidth="0.35" opacity="0.7" />
                    ))}
                    {bestIsland.length > 0 && (
                      <rect
                        x={PX(-bestIsland[bestIsland.length - 1].l / 2)}
                        y={PX(-bestIsland[bestIsland.length - 1].w / 2)}
                        width={bestIsland[bestIsland.length - 1].l * pk}
                        height={bestIsland[bestIsland.length - 1].w * pk}
                        fill="none"
                        stroke={INK}
                        strokeWidth="0.8"
                        strokeDasharray="3 2"
                      />
                    )}
                    <text x={PW / 2} y={16} textAnchor="middle" fontFamily={MONO} fontSize="9" fill={RULE}>
                      facade line
                    </text>
                  </svg>
                  <div style={{ flex: 1, minWidth: 170 }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: RULE }}>LEGEND</div>
                    {[
                      [MAG, "Circulatory roadway used as track"],
                      [CYAN, "Island seating, facing outward"],
                      [INK, "Largest fitting centre-stage pitch"],
                    ].map(([c, t]) => (
                      <div key={t} style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 8 }}>
                        <span style={{ width: 12, height: 12, background: c, opacity: 0.8, flexShrink: 0 }} />
                        <span style={{ fontFamily: SANS, fontSize: 11 }}>{t}</span>
                      </div>
                    ))}
                    <div style={{ fontFamily: SANS, fontSize: 11, color: RULE, marginTop: 12, lineHeight: 1.5 }}>
                      The dashed outer circle is the facade line acting as the far tier — the surface a
                      conventional bowl would wall off.
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: RULE, marginTop: 10, lineHeight: 1.6, borderTop: `1px solid ${RULE}`, paddingTop: 8 }}>
                      {p.site}{p.city ? `, ${p.city}` : ""}
                      <br />
                      {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                      <br />
                      {imp ? `${(FT_PER_M / pk).toFixed(3)} ft` : `${(1 / pk).toFixed(3)} m`} per pixel
                      <br />
                      zoom {basemap.z} · source {imp ? (basemap.mpp * FT_PER_M).toFixed(3) + " ft/px" : basemap.mpp.toFixed(3) + " m/px"} · {basemap.tiles.length} tile
                      {basemap.tiles.length === 1 ? "" : "s"}
                      <br />
                      <span
                        style={{
                          color:
                            tileState === "ok" ? CYAN : tileState === "blocked" ? AMB : RULE,
                        }}
                      >
                        {tileState === "ok"
                          ? "basemap loaded"
                          : tileState === "blocked"
                          ? "basemap request failed"
                          : "basemap loading"}
                      </span>{" "}
                      · build 10
                      <br />
                      {basemap.credit}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: 250, flexShrink: 0 }}>
              <div className="plate" style={{ padding: "12px 14px" }}>
                <div style={{ fontFamily: DISP, fontSize: 17, textTransform: "uppercase", marginBottom: 4 }}>
                  Output
                </div>
                {!r.ok && (
                  <div style={{ fontFamily: MONO, fontSize: 11, color: AMB, padding: "6px 0" }}>
                    Island too small for a bank — reduce roadway width or increase the inscribed circle.
                  </div>
                )}
                <Metric label="Ring circumference, centreline" value={L(r.ringCentre)} unit={LU} />
                <Metric label="Island diameter" value={L(r.islandD)} unit={LU} />
                <Metric label="Seated capacity, inverted" value={r.cap.toLocaleString()} unit="seats" />
                <Metric label="Rows achieved" value={r.rows.length} unit={`of ${p.rows}`} flag={r.rows.length < p.rows} />
                <Metric label="Top deck height" value={r.top ? L(r.top.deck) : "—"} unit={LU} />
                <Metric label="Steepest riser" value={r.maxRiser ? L(r.maxRiser) : "—"} unit={LU} flag={r.maxRiser > 0.55} />
                <Metric label="Standing crowd, centre-stage mode" value={r.standing.toLocaleString()} unit="people" />
                <Metric label="Track area" value={A(r.trackArea)} unit={AU} />
                {r.maxRiser > 0.55 && (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: AMB, marginTop: 8, lineHeight: 1.5 }}>
                    Riser exceeds {imp ? "1'-10\"" : "0.55 m"}. Lower the target C-value, deepen the rows, or lift the front
                    row further off the road.
                  </div>
                )}
              </div>

              <div className="plate" style={{ padding: "12px 14px", marginTop: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: RULE, marginBottom: 6 }}>
                  RING PROGRAM
                </div>
                {bestRing.length ? (
                  bestRing.map((x) => (
                    <div key={x.n} style={{ fontFamily: SANS, fontSize: 11, padding: "3px 0" }}>
                      {x.n}
                    </div>
                  ))
                ) : (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: AMB }}>
                    Ring too short or too narrow for circuit events.
                  </div>
                )}
                <div style={{ fontFamily: MONO, fontSize: 10, color: RULE, margin: "12px 0 6px" }}>
                  CENTRE-STAGE PROGRAM
                </div>
                {bestIsland.length ? (
                  bestIsland.map((x) => (
                    <div key={x.n} style={{ fontFamily: SANS, fontSize: 11, padding: "3px 0" }}>
                      {x.n}{" "}
                      <span style={{ fontFamily: MONO, color: RULE }}>
                        {imp
                          ? `${Math.round(x.w * FT_PER_M)}×${Math.round(x.l * FT_PER_M)} ft`
                          : `${x.w}×${x.l} m`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: AMB }}>
                    No standard pitch fits the island.
                  </div>
                )}
              </div>
            </div>

            <div className="plate" style={{ padding: "12px 14px", width: "100%" }}>
              <div style={{ fontFamily: DISP, fontSize: 17, textTransform: "uppercase", marginBottom: 8 }}>
                Rake schedule
                <span style={{ fontFamily: MONO, fontSize: 11, color: MAG, marginLeft: 10 }}>
                  C = {imp ? inchOnly(p.targetC / 1000) : `${p.targetC} mm`} held constant to the{" "}
                  {p.focus === "far" ? "far" : "near"} kerb
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Radius {LU}</th>
                      <th>D to focus {LU}</th>
                      <th>Riser {LU}</th>
                      <th>Deck {LU}</th>
                      <th>Eye {LU}</th>
                      <th>Seats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((row) => (
                      <tr key={row.i}>
                        <td>{row.i}</td>
                        <td>{L(row.ro)}</td>
                        <td>{L(row.D)}</td>
                        <td style={{ color: row.riser > 0.55 ? AMB : INK }}>{L(row.riser)}</td>
                        <td>{L(row.deck)}</td>
                        <td>{L(row.eye)}</td>
                        <td>{row.seats}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="plate" style={{ padding: "14px 16px" }}>
            <div style={{ fontFamily: DISP, fontSize: 20, textTransform: "uppercase" }}>
              Taxonomy sweep
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: RULE, margin: "4px 0 14px", maxWidth: 620, lineHeight: 1.6 }}>
              The same bank rules applied across eight inscribed circle diameters. This is the plate that
              shows the jury one system at four scales rather than a single clever roundabout.
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>ICD {LU}</th>
                    <th>Island {LU}</th>
                    <th>Ring circumference {LU}</th>
                    <th>Seated</th>
                    <th>Standing</th>
                    <th>Ring program</th>
                    <th>Centre pitch</th>
                  </tr>
                </thead>
                <tbody>
                  {sweep.map((s) => (
                    <tr key={s.icd} style={{ background: s.icd === p.icd ? "rgba(176,36,106,0.07)" : "transparent" }}>
                      <td style={{ color: MAG }}>{L(s.icd)}</td>
                      <td>{L(s.islandD)}</td>
                      <td>{L(s.circ)}</td>
                      <td>{s.cap > 0 ? s.cap.toLocaleString() : "—"}</td>
                      <td>{s.standing > 0 ? s.standing.toLocaleString() : "—"}</td>
                      <td style={{ fontFamily: SANS, textAlign: "left" }}>{s.ring ? s.ring.n : "—"}</td>
                      <td style={{ fontFamily: SANS, textAlign: "left" }}>{s.island ? s.island.n : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: RULE, marginTop: 12, lineHeight: 1.6 }}>
              Roadway width, apron, target C-value and row depth are inherited from the Single node tab,
              so the sweep re-runs whenever you change the bank rules there.
            </div>
          </div>
        )}

        <div style={{ fontFamily: MONO, fontSize: 10, color: RULE, marginTop: 20, lineHeight: 1.7 }}>
          C-value computed row by row as C = h(n)·(D−T)/D − h(n−1), solved for the riser that holds the
          target. Seat count applies a 0.85 factor for aisles and vomitories. Standing density at{" "}
          {imp ? "4.3 ft²/person sits inside the 3.2–5.4 ft²/person" : "0.40 m²/person sits inside the 0.3–0.5 m²/person"}{" "}
          range — check against the governing local code before using it on a board. All geometry is
          computed in metric and converted for display.
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RoundaboutNodeCalculator />);
