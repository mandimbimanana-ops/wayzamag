// ============================================================
//  WAYZA 2026 — Console Gérant
//  v8 — Présence/Premium, champs complets, horaires,
//       équipements, tarifs, paiements, parking, GPS auto+manuel
//       contacts complets, pub à la carte, migration Premium
// ============================================================

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://qmoesstuwetdugjgqbyl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtb2Vzc3R1d2V0ZHVnamdxYnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTEyODMsImV4cCI6MjA5MjA2NzI4M30.yUMqnecvSjz3w8Ug1_dek7HR7kZILq4VeSgiZga_bn0";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── COMPRESSION WEBP ────────────────────────────────────────
async function compressToWebP(file, maxKb = 100) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let quality = 0.85;
      const canvas = document.createElement("canvas");
      const MAX_W = 1200;
      const ratio = Math.min(1, MAX_W / img.width);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      const tryCompress = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob.size / 1024 > maxKb && quality > 0.2) { quality -= 0.1; tryCompress(); }
          else { URL.revokeObjectURL(url); resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" })); }
        }, "image/webp", quality);
      };
      tryCompress();
    };
    img.src = url;
  });
}

// ─── CONSTANTES ──────────────────────────────────────────────
const PUB_TYPES = [
  { v:"popup",         l:"Pop up",         p:"200 000 Ar/j", desc:"Plein écran au lancement" },
  { v:"banniere_haut", l:"Bannière Haut",   p:"20 000 Ar/j",  desc:"Carrousel en haut de liste" },
  { v:"banniere_bas",  l:"Bannière Bas",    p:"10 000 Ar/j",  desc:"Pied de liste spots" },
  { v:"sponsorise",    l:"Spot Sponsorisé", p:"5 000 Ar/j",   desc:"Première position de la liste" },
  { v:"ticker",        l:"Ticker",          p:"2 000 Ar/j",   desc:"Bandeau défilant en haut" },
  { v:"wayzmag",       l:"Wayz'Mag",        p:"Sur devis",    desc:"Article ou partenariat magazine" },
];

const EQUIPEMENTS = [
  { k:"wifi",        l:"WiFi",             icon:"📶" },
  { k:"clim",        l:"Climatisation",    icon:"❄️" },
  { k:"terrasse",    l:"Terrasse",         icon:"🪴" },
  { k:"vue_mer",     l:"Vue mer / piscine",icon:"🌊" },
  { k:"musique",     l:"Musique live",     icon:"🎵" },
  { k:"dj",          l:"DJ",               icon:"🎧" },
  { k:"karaoke",     l:"Karaoké",          icon:"🎤" },
  { k:"ecran_sport", l:"Écran sport",      icon:"📺" },
  { k:"livraison",   l:"Livraison",        icon:"🛵" },
  { k:"emporter",    l:"À emporter",       icon:"📦" },
];

const PAIEMENTS = [
  { k:"visa",         l:"Visa",         icon:"💳" },
  { k:"mastercard",   l:"Mastercard",   icon:"💳" },
  { k:"mvola",        l:"MVola",        icon:"📱" },
  { k:"orange_money", l:"Orange Money", icon:"📱" },
  { k:"airtel_money", l:"Airtel Money", icon:"📱" },
  { k:"especes",      l:"Espèces",      icon:"💵" },
];

// ─── STYLES ──────────────────────────────────────────────────
const S = {
  wrap:     { minHeight:"100vh", background:"#0D2B30", color:"#F4F7F7", fontFamily:"Arial, sans-serif" },
  input:    { width:"100%", background:"rgba(255,255,255,0.05)", border:"0.5px solid rgba(200,146,10,0.3)", borderRadius:12, padding:"12px 14px", color:"#F4F7F7", fontSize:13, fontFamily:"Arial, sans-serif", outline:"none", marginBottom:12 },
  label:    { fontSize:9, color:"#C8920A", letterSpacing:"0.25em", fontWeight:700, display:"block", marginBottom:6, fontFamily:"Arial" },
  btnGold:  { background:"#C8920A", color:"#0D2B30", border:"none", borderRadius:12, padding:"14px 0", fontWeight:800, cursor:"pointer", fontSize:13, width:"100%", letterSpacing:"0.1em" },
  btnGhost: { background:"transparent", color:"#C8920A", border:"1px solid rgba(200,146,10,0.4)", borderRadius:12, padding:"12px 0", fontWeight:700, cursor:"pointer", fontSize:12, width:"100%" },
  card:     { background:"rgba(255,255,255,0.03)", border:"0.5px solid rgba(200,146,10,0.2)", borderRadius:16, padding:16, marginBottom:16 },
  divider:  { height:1, background:"rgba(200,146,10,0.15)", margin:"8px 0 16px" },
  subhead:  { fontSize:9, color:"#C8920A", letterSpacing:"0.25em", fontWeight:700, marginBottom:12 },
};

// ─── TOGGLE SWITCH ───────────────────────────────────────────
const Toggle = ({ value, onChange, label, icon }) => (
  <div onClick={() => onChange(!value)} style={{
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"10px 14px", borderRadius:12, cursor:"pointer", marginBottom:8,
    background: value ? "rgba(200,146,10,0.1)" : "rgba(255,255,255,0.03)",
    border:`0.5px solid ${value ? "rgba(200,146,10,0.4)" : "rgba(255,255,255,0.07)"}`,
  }}>
    <span style={{ fontSize:13, color: value ? "#C8920A" : "rgba(244,247,247,0.5)" }}>{icon} {label}</span>
    <div style={{ width:36, height:20, borderRadius:10, background: value ? "#C8920A" : "rgba(255,255,255,0.1)", position:"relative", flexShrink:0, marginLeft:8 }}>
      <div style={{ position:"absolute", top:3, left: value ? 18 : 3, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
    </div>
  </div>
);

// ─── LOGIN ───────────────────────────────────────────────────
const LoginGerant = ({ onLogin }) => {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  const handleLogin = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setLoading(true); setErr("");
    try {
      const { data, error } = await supabase.from("gerants").select("*, spots(*)").eq("code_acces", clean).eq("actif", true).single();
      if (error || !data) setErr("Code invalide ou accès révoqué. Contactez Mandimbimanana.");
      else onLogin(data);
    } catch { setErr("Erreur de connexion. Réessayez."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0D2B30", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.5em", marginBottom:6 }}>CONSOLE</p>
          <h1 style={{ fontSize:32, fontWeight:900, fontStyle:"italic", color:"#F4F7F7", lineHeight:1 }}>WAY<span style={{ color:"#C8920A" }}>ZA</span></h1>
          <p style={{ fontSize:11, color:"rgba(244,247,247,0.35)", marginTop:6 }}>Espace Gérant</p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"0.5px solid rgba(200,146,10,0.3)", borderRadius:24, padding:28 }}>
          <p style={{ fontSize:10, color:"#C8920A", letterSpacing:"0.3em", marginBottom:4 }}>ACCÈS GÉRANT</p>
          <p style={{ fontSize:12, color:"rgba(244,247,247,0.4)", marginBottom:20, lineHeight:1.5 }}>Saisissez votre code d'accès personnel fourni par Mandimbimanana.</p>
          <label style={S.label}>CODE D'ACCÈS</label>
          <input
            placeholder="WAYZA-XXXX-XXXX" value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ ...S.input, fontFamily:"monospace", fontSize:16, letterSpacing:"0.1em", textAlign:"center", border:`0.5px solid ${err?"#E74C3C":"rgba(200,146,10,0.3)"}` }}
          />
          {err && <p style={{ fontSize:11, color:"#E74C3C", marginBottom:12, lineHeight:1.4 }}>{err}</p>}
          <button onClick={handleLogin} disabled={loading} style={{ ...S.btnGold, opacity:loading?0.6:1 }}>
            {loading ? "VÉRIFICATION..." : "ACCÉDER À MON ESPACE"}
          </button>
        </div>
        <p style={{ textAlign:"center", fontSize:10, color:"rgba(244,247,247,0.2)", marginTop:20 }}>Pas encore de code ? Contactez Mandimbimanana.</p>
      </div>
    </div>
  );
};

// ─── CONSOLE ─────────────────────────────────────────────────
const ConsoleGerant = ({ gerant, onLogout }) => {
  const spot = gerant.spots;
  const isPremium = spot.pass === "Premium";

  const [section, setSection] = useState("infos");

  const [form, setForm] = useState({
    slogan:           spot.slogan           || "",
    description:      spot.description      || "",
    wa:               spot.wa               || "",
    telephone:        spot.telephone        || "",
    email:            spot.email            || "",
    site_web:         spot.site_web         || "",
    instagram:        spot.instagram        || "",
    facebook:         spot.facebook         || "",
    tiktok:           spot.tiktok           || "",
    gps:              spot.gps              || "",
    adresse:          spot.adresse          || "",
    tarif_entree:     spot.tarif_entree     || "",
    tarif_fourchette: spot.tarif_fourchette || "",
    happy_hour:       spot.happy_hour       || "",
    menu_jour:        spot.menu_jour        || "",
    tarif_vip:        spot.tarif_vip        || "",
    wifi_reseau:      spot.wifi_reseau      || "",
    parking_moto:     spot.parking?.moto    || "non",
    parking_auto:     spot.parking?.auto    || "non",
    parking_gardien:  spot.parking?.gardienne ?? false,
    parking_note:     spot.parking?.note    || "",
    enfants:          spot.enfants          ?? true,
    dress_code:       spot.dress_code       || "",
    age_minimum:      spot.age_minimum      || "",
    style:            spot.style            || "",
    equipements:      spot.equipements      || {},
    paiements:        spot.paiements        || {},
    horaires:         spot.horaires         || {},
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [uploading,    setUploading]    = useState(false);
  const [uploadMsg,    setUploadMsg]    = useState("");
  const [uploadedUrls, setUploadedUrls] = useState(spot.photos || []);

  const [pub, setPub] = useState({
    type:"popup", titre:spot.nom, texte:"", lien_wa:spot.wa||"",
    cta:"RÉSERVER SUR WHATSAPP", date_debut:"", date_fin:"",
    est_annonceur_ext:false, annonceur_nom:"", annonceur_contact:"",
  });
  const [pubSent,         setPubSent]        = useState(false);
  const [pubSending,      setPubSending]     = useState(false);
  const [pubImageFile,    setPubImageFile]   = useState(null);
  const [pubImagePreview, setPubImagePreview]= useState(null);
  const [migrationSent,   setMigrationSent]  = useState(false);

  const [resas,    setResas]    = useState([]);
  const [resaLoad, setResaLoad] = useState(true);

  const loadResas = async () => {
    setResaLoad(true);
    const { data } = await supabase.from("reservations").select("*").eq("spot_id", spot.id).order("created_at", { ascending:false }).limit(30);
    setResas(data || []);
    setResaLoad(false);
  };
  useEffect(() => { if (section === "resas") loadResas(); }, [section]);

  const getGPS = () => {
    if (!navigator.geolocation) return alert("Géolocalisation non disponible.");
    navigator.geolocation.getCurrentPosition(
      pos => setForm(f => ({ ...f, gps:`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}` })),
      () => alert("Impossible d'obtenir la position. Activez la localisation.")
    );
  };

  const setHoraire = (jour, field, val) =>
    setForm(f => ({ ...f, horaires: { ...f.horaires, [jour]: { ...f.horaires[jour], [field]: val } } }));

  const saveInfos = async () => {
    setSaving(true);
    const { error } = await supabase.from("spots").update({
      slogan: form.slogan, description: form.description,
      wa: form.wa, telephone: form.telephone, email: form.email,
      site_web: form.site_web, instagram: form.instagram, facebook: form.facebook, tiktok: form.tiktok,
      gps: form.gps, adresse: form.adresse,
      tarif_entree: form.tarif_entree, tarif_fourchette: form.tarif_fourchette,
      happy_hour: form.happy_hour, menu_jour: form.menu_jour, tarif_vip: form.tarif_vip,
      wifi_reseau: form.wifi_reseau,
      parking: { moto:form.parking_moto, auto:form.parking_auto, gardienne:form.parking_gardien, note:form.parking_note },
      enfants: form.enfants, dress_code: form.dress_code, age_minimum: form.age_minimum, style: form.style,
      equipements: form.equipements, paiements: form.paiements, horaires: form.horaires,
    }).eq("id", spot.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else alert("Erreur : " + error.message);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setUploadMsg("Compression en cours...");
    try {
      const compressed = await compressToWebP(file);
      setUploadMsg("Upload en cours...");
      const path = `spots/${spot.id}/${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from("spot-photos").upload(path, compressed, { upsert:false });
      if (upErr) throw upErr;
      const { data:{ publicUrl } } = supabase.storage.from("spot-photos").getPublicUrl(path);
      const newPhotos = [...uploadedUrls, publicUrl];
      await supabase.from("spots").update({ photos: newPhotos }).eq("id", spot.id);
      setUploadedUrls(newPhotos);
      setUploadMsg("✓ Photo ajoutée !");
      setTimeout(() => setUploadMsg(""), 2500);
    } catch { setUploadMsg("Erreur upload. Réessayez."); }
    setUploading(false);
  };

  const deletePhoto = async (url) => {
    const newPhotos = uploadedUrls.filter(u => u !== url);
    await supabase.from("spots").update({ photos: newPhotos }).eq("id", spot.id);
    setUploadedUrls(newPhotos);
  };

  const handlePubImageChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setPubImagePreview(URL.createObjectURL(file));
    setPubImageFile(await compressToWebP(file));
  };

  const submitPub = async () => {
    if (!pub.date_debut || !pub.date_fin) return alert("Dates requises.");
    if (pub.est_annonceur_ext && !pub.annonceur_nom) return alert("Nom de l'annonceur requis.");
    setPubSending(true);
    let imageUrl = null;
    if (pubImageFile) {
      const path = `ads/${spot.id}/${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from("spot-photos").upload(path, pubImageFile, { upsert:false });
      if (!upErr) { const { data:{ publicUrl } } = supabase.storage.from("spot-photos").getPublicUrl(path); imageUrl = publicUrl; }
    }
    const { error } = await supabase.from("ads_regie").insert({
      type:pub.type, titre: pub.est_annonceur_ext ? pub.annonceur_nom : pub.titre,
      texte:pub.texte, lien_wa:pub.lien_wa, cta:pub.cta,
      date_debut:pub.date_debut, date_fin:pub.date_fin, actif:false, image_url:imageUrl,
      gerant_id: pub.est_annonceur_ext ? null : gerant.id,
      spot_id:   pub.est_annonceur_ext ? null : spot.id,
      annonceur_ext:pub.est_annonceur_ext,
      annonceur_nom: pub.est_annonceur_ext ? pub.annonceur_nom : null,
      annonceur_contact: pub.est_annonceur_ext ? pub.annonceur_contact : null,
    });
    setPubSending(false);
    if (!error) setPubSent(true);
    else alert("Erreur : " + error.message);
  };

  const submitMigration = async () => {
    const { error } = await supabase.from("ads_regie").insert({
      type:"migration_premium", titre:`Migration Premium — ${spot.nom}`,
      texte:`Gérant ${gerant.nom} demande la migration vers Premium.`,
      actif:false, gerant_id:gerant.id, spot_id:spot.id,
    });
    if (!error) setMigrationSent(true);
    else alert("Erreur : " + error.message);
  };

  const statutColor = { en_attente:"#C8920A", confirmee:"#2ECC8A", annulee:"#E74C3C" };

  const sections = [
    { id:"infos",    label:"Mon Spot",     icon:"📍" },
    { id:"contact",  label:"Contacts",     icon:"📞" },
    { id:"horaires", label:"Horaires",     icon:"🕐" },
    { id:"tarifs",   label:"Tarifs",       icon:"💰" },
    { id:"equip",    label:"Équip.",       icon:"⚙️" },
    { id:"photos",   label:"Photos",       icon:"📸" },
    { id:"pub",      label:"Visibilité",   icon:"📢" },
    { id:"resas",    label:"Résa",         icon:"📅" },
  ];

  const SaveBtn = () => (
    <button onClick={saveInfos} disabled={saving} style={{ ...S.btnGold, opacity:saving?0.6:1, marginTop:4 }}>
      {saved ? "✓ SAUVEGARDÉ !" : saving ? "SAUVEGARDE..." : "SAUVEGARDER"}
    </button>
  );

  return (
    <div style={S.wrap}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } ::-webkit-scrollbar { display:none; }`}</style>

      {/* Header */}
      <div style={{ background:"#000", borderBottom:"0.5px solid rgba(200,146,10,0.3)", padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ fontSize:8, color:"#C8920A", letterSpacing:"0.4em" }}>ESPACE GÉRANT</p>
          <h1 style={{ fontSize:18, fontWeight:800, fontStyle:"italic", color:"#F4F7F7", lineHeight:1.2 }}>{spot.nom}</h1>
          <p style={{ fontSize:10, color:"rgba(244,247,247,0.35)", marginTop:2 }}>
            {spot.ville} · {isPremium ? "⭐ Premium" : "Présence"} · 27 jours
          </p>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:10, color:"#C8920A", fontWeight:700 }}>{gerant.nom}</p>
          <button onClick={onLogout} style={{ fontSize:10, color:"rgba(244,247,247,0.4)", background:"none", border:"none", cursor:"pointer" }}>Déconnexion</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display:"flex", borderBottom:"0.5px solid rgba(200,146,10,0.15)", background:"rgba(0,0,0,0.3)", overflowX:"auto" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            flexShrink:0, padding:"10px 10px 8px", background:"none", border:"none",
            borderBottom: section===s.id ? "2px solid #C8920A" : "2px solid transparent",
            color: section===s.id ? "#C8920A" : "rgba(244,247,247,0.4)",
            cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:"0.04em", whiteSpace:"nowrap", lineHeight:1.4,
          }}>
            <div>{s.icon}</div>
            <div>{s.label}</div>
          </button>
        ))}
      </div>

      <div style={{ padding:"20px 16px", maxWidth:480, margin:"0 auto" }}>

        {/* ══ MON SPOT ══ */}
        {section === "infos" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", marginBottom:2 }}>INFORMATIONS</p>
              <h2 style={{ fontSize:20, fontWeight:800, fontStyle:"italic", color:"#F4F7F7" }}>Mon Spot</h2>
            </div>

            {/* Badge offre */}
            <div style={{ ...S.card, background:"rgba(200,146,10,0.07)" }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.2em", marginBottom:8, fontWeight:700 }}>VOTRE OFFRE</p>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#F4F7F7" }}>{isPremium ? "⭐ Premium" : "Présence"}</span>
                <span style={{ fontSize:11, color:"#C8920A", fontWeight:700 }}>27 jours</span>
              </div>
              <p style={{ fontSize:10, color:"rgba(244,247,247,0.4)", lineHeight:1.4 }}>
                {isPremium ? "Calendrier + réservations + pub 1×/sem incluse" : "Fiche complète + pub à la carte — Réservations désactivées"}
              </p>
            </div>

            {/* Infos fixes */}
            <div style={{ ...S.card, background:"rgba(200,146,10,0.03)" }}>
              <p style={{ fontSize:9, color:"rgba(244,247,247,0.3)", letterSpacing:"0.2em", marginBottom:8 }}>INFORMATIONS FIXES (admin uniquement)</p>
              {[["Catégorie",spot.cat],["Offre",isPremium?"⭐ Premium":"Présence"],["Ville",spot.ville],["Région",spot.region]].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:11, color:"rgba(244,247,247,0.35)" }}>{l}</span>
                  <span style={{ fontSize:11, color:"rgba(244,247,247,0.6)", fontWeight:600 }}>{v||"—"}</span>
                </div>
              ))}
            </div>

            <label style={S.label}>SLOGAN</label>
            <input placeholder="Ex : La table de l'archipel" value={form.slogan} onChange={e=>setForm({...form,slogan:e.target.value})} style={S.input} />

            <label style={S.label}>DESCRIPTION</label>
            <textarea placeholder="Description de votre établissement (2-4 phrases)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{ ...S.input, height:90, resize:"none" }} />

            <label style={S.label}>ADRESSE</label>
            <input placeholder="Ex : Rue Pasteur, Antananarivo" value={form.adresse} onChange={e=>setForm({...form,adresse:e.target.value})} style={S.input} />

            {/* GPS */}
            <label style={S.label}>COORDONNÉES GPS</label>
            <div style={{ display:"flex", gap:8, marginBottom:4 }}>
              <input placeholder="Ex : -18.9100, 47.5311" value={form.gps} onChange={e=>setForm({...form,gps:e.target.value})} style={{ ...S.input, marginBottom:0, flex:1 }} />
              <button onClick={getGPS} title="Détecter ma position" style={{ background:"rgba(200,146,10,0.15)", border:"0.5px solid rgba(200,146,10,0.4)", borderRadius:12, padding:"0 14px", color:"#C8920A", cursor:"pointer", fontSize:16, flexShrink:0 }}>📍</button>
            </div>
            <p style={{ fontSize:10, color:"rgba(244,247,247,0.3)", marginBottom:16 }}>📍 détecte automatiquement — ou saisissez manuellement.</p>

            {/* Ambiance */}
            <div style={S.divider} />
            <p style={S.subhead}>AMBIANCE</p>
            <Toggle value={form.enfants} onChange={v=>setForm({...form,enfants:v})} label="Enfants bienvenus" icon="👶" />
            <label style={{ ...S.label, marginTop:8 }}>DRESS CODE</label>
            <input placeholder="Ex : Tenue correcte exigée" value={form.dress_code} onChange={e=>setForm({...form,dress_code:e.target.value})} style={S.input} />
            <label style={S.label}>ÂGE MINIMUM</label>
            <input placeholder="Ex : 18 ans" value={form.age_minimum} onChange={e=>setForm({...form,age_minimum:e.target.value})} style={S.input} />
            <label style={S.label}>STYLE / AMBIANCE</label>
            <input placeholder="Ex : Lounge, Chic, Décontracté…" value={form.style} onChange={e=>setForm({...form,style:e.target.value})} style={S.input} />

            <SaveBtn />

            {/* Migration Premium */}
            {!isPremium && (
              <div style={{ ...S.card, marginTop:24, background:"rgba(200,146,10,0.05)", border:"0.5px solid rgba(200,146,10,0.3)" }}>
                <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.2em", marginBottom:8, fontWeight:700 }}>PASSER EN PREMIUM</p>
                <p style={{ fontSize:11, color:"rgba(244,247,247,0.5)", lineHeight:1.5, marginBottom:14 }}>
                  Activez le calendrier, les réservations et les offres pub 1×/semaine.<br />
                  <strong style={{ color:"#C8920A" }}>20 000 Ar — 27 jours</strong>
                </p>
                {migrationSent
                  ? <p style={{ fontSize:12, color:"#2ECC8A", textAlign:"center" }}>✓ Demande envoyée ! Mandimbimanana vous contactera.</p>
                  : <button onClick={submitMigration} style={S.btnGhost}>⭐ DEMANDER LA MIGRATION PREMIUM</button>}
              </div>
            )}
          </div>
        )}

        {/* ══ CONTACTS ══ */}
        {section === "contact" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", marginBottom:2 }}>COORDONNÉES</p>
              <h2 style={{ fontSize:20, fontWeight:800, fontStyle:"italic", color:"#F4F7F7" }}>Contacts</h2>
            </div>

            <label style={S.label}>WHATSAPP RÉSERVATIONS</label>
            <input placeholder="+261 32…" value={form.wa} onChange={e=>setForm({...form,wa:e.target.value})} style={S.input} />
            <label style={S.label}>TÉLÉPHONE</label>
            <input placeholder="+261 20…" value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} style={S.input} />
            <label style={S.label}>EMAIL</label>
            <input placeholder="contact@…" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={S.input} />
            <label style={S.label}>SITE WEB</label>
            <input placeholder="https://…" value={form.site_web} onChange={e=>setForm({...form,site_web:e.target.value})} style={S.input} />

            <div style={S.divider} />
            <p style={S.subhead}>RÉSEAUX SOCIAUX</p>

            <label style={S.label}>INSTAGRAM</label>
            <input placeholder="@votre_compte ou URL" value={form.instagram} onChange={e=>setForm({...form,instagram:e.target.value})} style={S.input} />
            <label style={S.label}>FACEBOOK</label>
            <input placeholder="Page Facebook (URL)" value={form.facebook} onChange={e=>setForm({...form,facebook:e.target.value})} style={S.input} />
            <label style={S.label}>TIKTOK</label>
            <input placeholder="@votre_compte ou URL" value={form.tiktok} onChange={e=>setForm({...form,tiktok:e.target.value})} style={S.input} />

            <SaveBtn />
          </div>
        )}

        {/* ══ HORAIRES ══ */}
        {section === "horaires" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", marginBottom:2 }}>PLANNING</p>
              <h2 style={{ fontSize:20, fontWeight:800, fontStyle:"italic", color:"#F4F7F7" }}>Horaires</h2>
              <p style={{ fontSize:11, color:"rgba(244,247,247,0.35)", marginTop:4 }}>Définissez vos horaires d'ouverture par jour.</p>
            </div>

            {["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"].map(jour => {
              const h = form.horaires[jour] || {};
              const ouvert = h.ouvert !== false;
              return (
                <div key={jour} style={{ ...S.card, marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: ouvert?12:0 }}>
                    <span style={{ fontSize:13, fontWeight:700, color: ouvert?"#F4F7F7":"rgba(244,247,247,0.3)", textTransform:"capitalize" }}>{jour}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {!ouvert && <span style={{ fontSize:10, color:"rgba(244,247,247,0.3)" }}>Fermé</span>}
                      <div onClick={() => setHoraire(jour,"ouvert",!ouvert)} style={{ width:36, height:20, borderRadius:10, background:ouvert?"#C8920A":"rgba(255,255,255,0.1)", position:"relative", cursor:"pointer" }}>
                        <div style={{ position:"absolute", top:3, left:ouvert?18:3, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
                      </div>
                    </div>
                  </div>
                  {ouvert && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div>
                        <label style={S.label}>OUVERTURE</label>
                        <input type="time" value={h.ouverture||""} onChange={e=>setHoraire(jour,"ouverture",e.target.value)} style={{ ...S.input, marginBottom:0, colorScheme:"dark" }} />
                      </div>
                      <div>
                        <label style={S.label}>FERMETURE</label>
                        <input type="time" value={h.fermeture||""} onChange={e=>setHoraire(jour,"fermeture",e.target.value)} style={{ ...S.input, marginBottom:0, colorScheme:"dark" }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <SaveBtn />
          </div>
        )}

        {/* ══ TARIFS & PAIEMENTS ══ */}
        {section === "tarifs" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", marginBottom:2 }}>PRIX</p>
              <h2 style={{ fontSize:20, fontWeight:800, fontStyle:"italic", color:"#F4F7F7" }}>Tarifs & Paiements</h2>
            </div>

            <p style={S.subhead}>TARIFS</p>
            <label style={S.label}>ENTRÉE</label>
            <input placeholder="Ex : 5 000 Ar / gratuit" value={form.tarif_entree} onChange={e=>setForm({...form,tarif_entree:e.target.value})} style={S.input} />
            <label style={S.label}>FOURCHETTE DE PRIX</label>
            <input placeholder="Ex : 10 000 – 50 000 Ar" value={form.tarif_fourchette} onChange={e=>setForm({...form,tarif_fourchette:e.target.value})} style={S.input} />
            <label style={S.label}>HAPPY HOUR</label>
            <input placeholder="Ex : 17h–19h — 50% sur cocktails" value={form.happy_hour} onChange={e=>setForm({...form,happy_hour:e.target.value})} style={S.input} />
            <label style={S.label}>MENU DU JOUR</label>
            <input placeholder="Ex : Plat + boisson 15 000 Ar" value={form.menu_jour} onChange={e=>setForm({...form,menu_jour:e.target.value})} style={S.input} />
            <label style={S.label}>TARIF VIP / TABLE PRIVÉE</label>
            <input placeholder="Ex : Table VIP à partir de 200 000 Ar" value={form.tarif_vip} onChange={e=>setForm({...form,tarif_vip:e.target.value})} style={S.input} />

            <div style={S.divider} />
            <p style={S.subhead}>MOYENS DE PAIEMENT ACCEPTÉS</p>
            {PAIEMENTS.map(p => (
              <Toggle key={p.k} value={!!(form.paiements[p.k])} onChange={v=>setForm(f=>({...f,paiements:{...f.paiements,[p.k]:v}}))} label={p.l} icon={p.icon} />
            ))}

            <div style={S.divider} />
            <p style={S.subhead}>PARKING</p>

            <label style={S.label}>PARKING MOTO</label>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {["gratuit","payant","non"].map(v=>(
                <button key={v} onClick={()=>setForm({...form,parking_moto:v})} style={{
                  flex:1, padding:"10px 0", borderRadius:10, cursor:"pointer", fontSize:11, fontWeight:700,
                  background:form.parking_moto===v?"rgba(200,146,10,0.15)":"rgba(255,255,255,0.03)",
                  border:`0.5px solid ${form.parking_moto===v?"rgba(200,146,10,0.5)":"rgba(255,255,255,0.08)"}`,
                  color:form.parking_moto===v?"#C8920A":"rgba(244,247,247,0.45)",
                }}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
              ))}
            </div>

            <label style={S.label}>PARKING AUTO</label>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {["gratuit","payant","non"].map(v=>(
                <button key={v} onClick={()=>setForm({...form,parking_auto:v})} style={{
                  flex:1, padding:"10px 0", borderRadius:10, cursor:"pointer", fontSize:11, fontWeight:700,
                  background:form.parking_auto===v?"rgba(200,146,10,0.15)":"rgba(255,255,255,0.03)",
                  border:`0.5px solid ${form.parking_auto===v?"rgba(200,146,10,0.5)":"rgba(255,255,255,0.08)"}`,
                  color:form.parking_auto===v?"#C8920A":"rgba(244,247,247,0.45)",
                }}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
              ))}
            </div>

            <Toggle value={form.parking_gardien} onChange={v=>setForm({...form,parking_gardien:v})} label="Parking gardienné" icon="🔒" />
            <label style={{ ...S.label, marginTop:8 }}>NOTE PARKING</label>
            <input placeholder="Ex : Parking privé à 50 m" value={form.parking_note} onChange={e=>setForm({...form,parking_note:e.target.value})} style={S.input} />

            <SaveBtn />
          </div>
        )}

        {/* ══ ÉQUIPEMENTS ══ */}
        {section === "equip" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", marginBottom:2 }}>SERVICES</p>
              <h2 style={{ fontSize:20, fontWeight:800, fontStyle:"italic", color:"#F4F7F7" }}>Équipements</h2>
            </div>

            {EQUIPEMENTS.map(eq=>(
              <Toggle key={eq.k} value={!!(form.equipements[eq.k])} onChange={v=>setForm(f=>({...f,equipements:{...f.equipements,[eq.k]:v}}))} label={eq.l} icon={eq.icon} />
            ))}

            {form.equipements.wifi && (
              <>
                <label style={{ ...S.label, marginTop:8 }}>NOM DU RÉSEAU WiFi</label>
                <input placeholder="Ex : WAYZA_FREE" value={form.wifi_reseau} onChange={e=>setForm({...form,wifi_reseau:e.target.value})} style={S.input} />
              </>
            )}

            <SaveBtn />
          </div>
        )}

        {/* ══ PHOTOS ══ */}
        {section === "photos" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", marginBottom:2 }}>GALERIE</p>
              <h2 style={{ fontSize:20, fontWeight:800, fontStyle:"italic", color:"#F4F7F7" }}>Mes Photos</h2>
              <p style={{ fontSize:11, color:"rgba(244,247,247,0.35)", marginTop:4 }}>Compressées automatiquement en WebP &lt;100 Ko.</p>
            </div>

            <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(200,146,10,0.1)", border:"1px dashed rgba(200,146,10,0.4)", borderRadius:14, padding:"20px 16px", cursor:"pointer", marginBottom:16 }}>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:"none" }} disabled={uploading} />
              <span style={{ fontSize:20 }}>📷</span>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:"#C8920A" }}>{uploading?"Traitement…":"Ajouter une photo"}</p>
                <p style={{ fontSize:10, color:"rgba(244,247,247,0.35)" }}>JPG, PNG, HEIC → WebP</p>
              </div>
            </label>

            {uploadMsg && <p style={{ fontSize:12, color:uploadMsg.startsWith("✓")?"#2ECC8A":"#E74C3C", marginBottom:12, textAlign:"center" }}>{uploadMsg}</p>}

            {uploadedUrls.length > 0 ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {uploadedUrls.map((url,i)=>(
                  <div key={i} style={{ position:"relative", borderRadius:10, overflow:"hidden", aspectRatio:"1" }}>
                    <img src={url} alt={`p${i}`} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    <button onClick={()=>deletePhoto(url)} style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,0.7)", border:"none", borderRadius:"50%", width:22, height:22, cursor:"pointer", color:"#E74C3C", fontSize:12 }}>✕</button>
                    {i===0 && <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(200,146,10,0.85)", padding:"2px 6px" }}><p style={{ fontSize:8, color:"#0D2B30", fontWeight:800, textAlign:"center" }}>PRINCIPALE</p></div>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign:"center", fontSize:13, color:"rgba(244,247,247,0.25)", fontStyle:"italic", padding:"30px 20px" }}>Aucune photo. Ajoutez-en une !</p>
            )}

            <div style={{ background:"rgba(200,146,10,0.08)", border:"0.5px solid rgba(200,146,10,0.25)", borderRadius:12, padding:"12px 14px", marginTop:16 }}>
              <p style={{ fontSize:11, color:"#C8920A", lineHeight:1.5 }}>💡 La première photo est utilisée comme image principale de votre fiche.</p>
            </div>
          </div>
        )}

        {/* ══ VISIBILITÉ / PUB ══ */}
        {section === "pub" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", marginBottom:2 }}>RÉGIE</p>
              <h2 style={{ fontSize:20, fontWeight:800, fontStyle:"italic", color:"#F4F7F7" }}>Visibilité & Publicité</h2>
            </div>

            {pubSent ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
                <p style={{ fontSize:18, fontWeight:800, fontStyle:"italic", color:"#F4F7F7", marginBottom:8 }}>Demande envoyée !</p>
                <p style={{ fontSize:12, color:"rgba(244,247,247,0.4)", lineHeight:1.6, marginBottom:24 }}>
                  {pub.est_annonceur_ext ? "Mandimbimanana traitera la demande sous 24h." : "Votre visuel sera préparé et activé sous 24h."}
                </p>
                <button onClick={()=>{ setPubSent(false); setPubImageFile(null); setPubImagePreview(null); }} style={{ ...S.btnGold, width:"auto", padding:"12px 28px" }}>NOUVELLE DEMANDE</button>
              </div>
            ) : (
              <>
                {isPremium && (
                  <div style={{ ...S.card, background:"rgba(200,146,10,0.06)", border:"0.5px solid rgba(200,146,10,0.3)" }}>
                    <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.2em", marginBottom:8, fontWeight:700 }}>⭐ INCLUS PREMIUM — 1×/SEMAINE</p>
                    <p style={{ fontSize:11, color:"rgba(244,247,247,0.5)", lineHeight:1.5 }}>Bannière Haut, Bannière Bas, Spot Sponsorisé, Ticker et Wayz'Mag offerts 1 fois/semaine.</p>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
                  {[
                    { val:false, label:"🏠 Mon Spot", sub:"Je booste mon établissement" },
                    { val:true,  label:"🌐 Annonceur Ext.", sub:"Pub pour une autre marque" },
                  ].map(opt=>(
                    <button key={String(opt.val)} onClick={()=>setPub({...pub,est_annonceur_ext:opt.val})} style={{
                      padding:"12px 10px", borderRadius:12, cursor:"pointer", textAlign:"left",
                      background:pub.est_annonceur_ext===opt.val?"rgba(200,146,10,0.12)":"rgba(255,255,255,0.03)",
                      border:`0.5px solid ${pub.est_annonceur_ext===opt.val?"rgba(200,146,10,0.5)":"rgba(255,255,255,0.1)"}`,
                    }}>
                      <p style={{ fontSize:11, fontWeight:700, color:pub.est_annonceur_ext===opt.val?"#C8920A":"rgba(244,247,247,0.6)", marginBottom:3 }}>{opt.label}</p>
                      <p style={{ fontSize:9, color:"rgba(244,247,247,0.3)" }}>{opt.sub}</p>
                    </button>
                  ))}
                </div>

                {pub.est_annonceur_ext && (
                  <div style={{ ...S.card, borderColor:"rgba(200,146,10,0.3)" }}>
                    <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.2em", marginBottom:10, fontWeight:700 }}>INFOS ANNONCEUR</p>
                    <label style={S.label}>NOM DE L'ANNONCEUR / MARQUE</label>
                    <input placeholder="Ex : Pizzeria Akamasoa" value={pub.annonceur_nom} onChange={e=>setPub({...pub,annonceur_nom:e.target.value})} style={S.input} />
                    <label style={S.label}>CONTACT (WhatsApp ou email)</label>
                    <input placeholder="+261 32… ou email" value={pub.annonceur_contact} onChange={e=>setPub({...pub,annonceur_contact:e.target.value})} style={S.input} />
                    <div style={{ background:"rgba(200,146,10,0.06)", borderRadius:10, padding:"10px 12px" }}>
                      <p style={{ fontSize:10, color:"#C8920A", lineHeight:1.5 }}>🎨 <strong>Créa incluse :</strong> WAYZA crée le visuel. L'annonceur n'a rien à préparer.</p>
                    </div>
                  </div>
                )}

                <label style={S.label}>FORMAT PUBLICITAIRE</label>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                  {PUB_TYPES.map(t=>(
                    <button key={t.v} onClick={()=>setPub({...pub,type:t.v})} style={{
                      padding:"11px 14px", borderRadius:12, cursor:"pointer", textAlign:"left",
                      background:pub.type===t.v?"rgba(200,146,10,0.12)":"rgba(255,255,255,0.03)",
                      border:`0.5px solid ${pub.type===t.v?"rgba(200,146,10,0.5)":"rgba(255,255,255,0.08)"}`,
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                    }}>
                      <div>
                        <p style={{ fontSize:12, fontWeight:700, color:pub.type===t.v?"#C8920A":"rgba(244,247,247,0.7)", marginBottom:2 }}>{t.l}</p>
                        <p style={{ fontSize:9, color:"rgba(244,247,247,0.3)" }}>{t.desc}</p>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:pub.type===t.v?"#C8920A":"rgba(244,247,247,0.35)", flexShrink:0, marginLeft:10 }}>{t.p}</span>
                    </button>
                  ))}
                </div>

                <label style={S.label}>TITRE / SLOGAN</label>
                <input placeholder="Ex : Orchidea Club — La nuit commence ici" value={pub.titre} onChange={e=>setPub({...pub,titre:e.target.value})} style={S.input} />
                <label style={S.label}>MESSAGE</label>
                <textarea placeholder="Ex : Réservez votre table VIP ce soir" value={pub.texte} onChange={e=>setPub({...pub,texte:e.target.value})} style={{ ...S.input, height:70, resize:"none" }} />
                <label style={S.label}>WHATSAPP DU BOUTON</label>
                <input placeholder="+261 32…" value={pub.lien_wa} onChange={e=>setPub({...pub,lien_wa:e.target.value})} style={S.input} />
                <label style={S.label}>TEXTE DU BOUTON</label>
                <input placeholder='Ex : RÉSERVER SUR WHATSAPP' value={pub.cta} onChange={e=>setPub({...pub,cta:e.target.value})} style={S.input} />

                <label style={{ ...S.label, marginBottom:8 }}>IMAGE (optionnel — sinon WAYZA crée la créa)</label>
                <label style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(200,146,10,0.06)", border:"1px dashed rgba(200,146,10,0.3)", borderRadius:12, padding:14, cursor:"pointer", marginBottom:14 }}>
                  <input type="file" accept="image/*" onChange={handlePubImageChange} style={{ display:"none" }} />
                  {pubImagePreview ? <img src={pubImagePreview} alt="preview" style={{ width:56, height:56, borderRadius:8, objectFit:"cover", flexShrink:0 }} /> : <span style={{ fontSize:24, flexShrink:0 }}>🖼</span>}
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:"#C8920A" }}>{pubImagePreview?"Image sélectionnée ✓":"Ajouter une image"}</p>
                    <p style={{ fontSize:9, color:"rgba(244,247,247,0.3)" }}>Si absent, Mandimbimanana crée le visuel</p>
                  </div>
                </label>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
                  <div>
                    <label style={S.label}>DATE DÉBUT</label>
                    <input type="date" value={pub.date_debut} onChange={e=>setPub({...pub,date_debut:e.target.value})} style={{ ...S.input, colorScheme:"dark" }} />
                  </div>
                  <div>
                    <label style={S.label}>DATE FIN</label>
                    <input type="date" value={pub.date_fin} onChange={e=>setPub({...pub,date_fin:e.target.value})} style={{ ...S.input, colorScheme:"dark" }} />
                  </div>
                </div>

                <div style={{ background:"rgba(200,146,10,0.08)", border:"0.5px solid rgba(200,146,10,0.25)", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                  <p style={{ fontSize:11, color:"#C8920A", lineHeight:1.6 }}>
                    {pub.est_annonceur_ext ? "🌐 Mandimbimanana prendra contact pour confirmer et créer la pub." : "🔒 Votre demande sera activée sous 24h."}
                  </p>
                </div>

                <button onClick={submitPub} disabled={pubSending} style={{ ...S.btnGold, opacity:pubSending?0.6:1 }}>
                  {pubSending ? "ENVOI…" : pub.est_annonceur_ext ? "✓ SOUMETTRE LA DEMANDE ANNONCEUR" : "✓ SOUMETTRE LA DEMANDE"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ══ RÉSERVATIONS ══ */}
        {section === "resas" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", marginBottom:2 }}>PANNEAU</p>
              <h2 style={{ fontSize:20, fontWeight:800, fontStyle:"italic", color:"#F4F7F7" }}>Mes Réservations</h2>
            </div>

            {!isPremium ? (
              <div style={{ ...S.card, background:"rgba(200,146,10,0.05)", border:"0.5px solid rgba(200,146,10,0.3)", textAlign:"center", padding:"32px 20px" }}>
                <p style={{ fontSize:32, marginBottom:12 }}>🔒</p>
                <p style={{ fontSize:14, fontWeight:700, color:"#C8920A", marginBottom:8 }}>Fonctionnalité Premium</p>
                <p style={{ fontSize:11, color:"rgba(244,247,247,0.4)", lineHeight:1.6, marginBottom:20 }}>
                  Les réservations en ligne sont disponibles avec l'offre Premium.<br />
                  <strong style={{ color:"#C8920A" }}>20 000 Ar — 27 jours</strong>
                </p>
                {migrationSent
                  ? <p style={{ fontSize:12, color:"#2ECC8A" }}>✓ Demande envoyée !</p>
                  : <button onClick={submitMigration} style={S.btnGhost}>⭐ DEMANDER LA MIGRATION PREMIUM</button>}
              </div>
            ) : resaLoad ? (
              <p style={{ color:"rgba(244,247,247,0.4)", fontSize:13 }}>Chargement…</p>
            ) : resas.length === 0 ? (
              <p style={{ color:"rgba(244,247,247,0.3)", fontSize:13 }}>Aucune réservation pour ce spot.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {resas.map(r=>(
                  <div key={r.id} style={{
                    background:"rgba(255,255,255,0.03)",
                    border:`0.5px solid ${statutColor[r.statut]||"#C8920A"}30`,
                    borderLeft:`3px solid ${statutColor[r.statut]||"#C8920A"}`,
                    borderRadius:14, padding:"12px 16px",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:"#F4F7F7" }}>{r.client_nom}</p>
                        <p style={{ fontSize:10, color:"rgba(244,247,247,0.4)", marginTop:2 }}>{r.date_reservation} à {r.heure} · {r.personnes} pers.</p>
                        {r.notes && <p style={{ fontSize:10, color:"rgba(244,247,247,0.35)", marginTop:4, fontStyle:"italic" }}>{r.notes}</p>}
                      </div>
                      <span style={{ fontSize:9, fontWeight:700, color:statutColor[r.statut], letterSpacing:"0.1em", background:`${statutColor[r.statut]}20`, padding:"3px 8px", borderRadius:10, flexShrink:0, marginLeft:8 }}>
                        {r.statut?.replace("_"," ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// ─── EXPORT ──────────────────────────────────────────────────
export default function FormulaireCommercial() {
  const [gerant, setGerant] = useState(null);
  return gerant
    ? <ConsoleGerant gerant={gerant} onLogout={() => setGerant(null)} />
    : <LoginGerant onLogin={setGerant} />;
}
