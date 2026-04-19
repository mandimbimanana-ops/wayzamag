// ============================================================
//  WAYZA 2026 — Console Gérant (par Spot)
//  Authentification par code WAYZA-XXXX-XXXX
//  Le gérant accède uniquement à son spot
//  v7 — Offre standard 27 jours,
//       Upload images par le gérant,
//       Annonceurs extérieurs : pub à la carte
// ============================================================

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://qmoesstuwetdugjgqbyl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtb2Vzc3R1d2V0ZHVnamdxYnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTEyODMsImV4cCI6MjA5MjA2NzI4M30.yUMqnecvSjz3w8Ug1_dek7HR7kZILq4VeSgiZga_bn0";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── COMPRESSION WEBP < 100 Ko ────────────────────────────────
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
          if (blob.size / 1024 > maxKb && quality > 0.2) {
            quality -= 0.1;
            tryCompress();
          } else {
            URL.revokeObjectURL(url);
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
          }
        }, "image/webp", quality);
      };
      tryCompress();
    };
    img.src = url;
  });
}

// ─── OFFRES COMMERCIALES ──────────────────────────────────────
// Standard = 27 jours | Durées spéciales
const OFFRES = [
  { id: "tongasoa_27", label: "Tongasoa — Standard", duree: "27 jours", prix: "Offre standard", desc: "Fiche spot complète, catégorie, WhatsApp" },
  { id: "premium_27",  label: "Premium — Standard",  duree: "27 jours", prix: "Offre standard", desc: "Tout Tongasoa + résa en ligne, réseaux sociaux, galerie" },
  { id: "premium_3",   label: "Premium — Court",     duree: "3 jours",  prix: "Offre courte",   desc: "Idéal événement ponctuel" },
  { id: "premium_7",   label: "Premium — Semaine",   duree: "7 jours",  prix: "Offre semaine",  desc: "Visibilité sur une semaine complète" },
];

// Pubs à la carte (spots ET annonceurs extérieurs)
const PUB_TYPES_CARTE = [
  { v: "popup",         l: "Pop up",          p: "200 000 Ar/j", desc: "Plein écran au lancement" },
  { v: "banniere_haut", l: "Bannière Haut",    p: "20 000 Ar/j",  desc: "Carrousel en haut de liste" },
  { v: "banniere_bas",  l: "Bannière Bas",     p: "10 000 Ar/j",  desc: "Pied de liste spots" },
  { v: "sponsorise",    l: "Spot Sponsorisé",  p: "5 000 Ar/j",   desc: "Première position de la liste" },
  { v: "ticker",        l: "Ticker",           p: "2 000 Ar/j",   desc: "Bandeau défilant en haut" },
  { v: "wayzmag",       l: "Wayz'Mag",         p: "Sur devis",    desc: "Article ou partenariat magazine" },
];

// ─── STYLES ───────────────────────────────────────────────────
const S = {
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 12,
    padding: "12px 14px", color: "#F4F7F7", fontSize: 13,
    fontFamily: "Arial, sans-serif", outline: "none", marginBottom: 12,
  },
  label: {
    fontSize: 9, color: "#C8920A", letterSpacing: "0.25em",
    fontWeight: 700, display: "block", marginBottom: 6, fontFamily: "Arial",
  },
  btnGold: {
    background: "#C8920A", color: "#0D2B30", border: "none",
    borderRadius: 12, padding: "14px 0", fontWeight: 800,
    cursor: "pointer", fontSize: 13, width: "100%", letterSpacing: "0.1em",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(200,146,10,0.2)",
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
};

// ─── ÉCRAN DE CONNEXION ───────────────────────────────────────
const LoginGerant = ({ onLogin }) => {
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  const handleLogin = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setErr("");
    try {
      const { data, error } = await supabase
        .from("gerants")
        .select("*, spots(*)")
        .eq("code_acces", clean)
        .eq("actif", true)
        .single();

      if (error || !data) {
        setErr("Code invalide ou accès révoqué. Contactez Mandimbimanana.");
      } else {
        onLogin(data);
      }
    } catch (e) {
      setErr("Erreur de connexion. Réessayez.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D2B30", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.5em", marginBottom: 6, fontFamily: "Arial" }}>CONSOLE</p>
          <h1 style={{ fontSize: 32, fontWeight: 900, fontStyle: "italic", color: "#F4F7F7", lineHeight: 1 }}>
            WAY<span style={{ color: "#C8920A" }}>ZA</span>
          </h1>
          <p style={{ fontSize: 11, color: "rgba(244,247,247,0.35)", marginTop: 6 }}>Espace Gérant</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 24, padding: 28 }}>
          <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.3em", fontFamily: "Arial", marginBottom: 4 }}>ACCÈS GÉRANT</p>
          <p style={{ fontSize: 12, color: "rgba(244,247,247,0.4)", marginBottom: 20, lineHeight: 1.5 }}>
            Saisissez votre code d'accès personnel fourni par Mandimbimanana.
          </p>

          <label style={S.label}>CODE D'ACCÈS</label>
          <input
            placeholder="WAYZA-XXXX-XXXX"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{
              ...S.input,
              fontFamily: "monospace", fontSize: 16, letterSpacing: "0.1em",
              textAlign: "center", border: `0.5px solid ${err ? "#E74C3C" : "rgba(200,146,10,0.3)"}`,
            }}
          />
          {err && (
            <p style={{ fontSize: 11, color: "#E74C3C", marginBottom: 12, lineHeight: 1.4 }}>{err}</p>
          )}

          <button onClick={handleLogin} disabled={loading} style={{ ...S.btnGold, opacity: loading ? 0.6 : 1 }}>
            {loading ? "VÉRIFICATION..." : "ACCÉDER À MON ESPACE"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(244,247,247,0.2)", marginTop: 20 }}>
          Pas encore de code ? Contactez Mandimbimanana.
        </p>
      </div>
    </div>
  );
};

// ─── CONSOLE DU GÉRANT ────────────────────────────────────────
const ConsoleGerant = ({ gerant, onLogout }) => {
  const spot = gerant.spots;
  const [section,  setSection]  = useState("infos");
  const [form,     setForm]     = useState({
    slogan:      spot.slogan      || "",
    description: spot.description || "",
    wa:          spot.wa          || "",
    gps:         spot.gps         || "",
    social_wa:   spot.social?.whatsapp  || "",
    social_fb:   spot.social?.facebook  || "",
    social_ig:   spot.social?.instagram || "",
    social_msg:  spot.social?.messenger || "",
  });
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  // Upload photos
  const [uploading,    setUploading]    = useState(false);
  const [uploadMsg,    setUploadMsg]    = useState("");
  const [uploadedUrls, setUploadedUrls] = useState(spot.photos || []);

  // Pub
  const [pub,      setPub]      = useState({
    type: "popup", titre: spot.nom, texte: "", lien_wa: spot.wa || "",
    cta: "RÉSERVER SUR WHATSAPP", date_debut: "", date_fin: "",
    // Pour annonceurs extérieurs
    est_annonceur_ext: false,
    annonceur_nom: "", annonceur_contact: "",
  });
  const [pubSent,    setPubSent]    = useState(false);
  const [pubSending, setPubSending] = useState(false);
  const [pubImageFile, setPubImageFile] = useState(null);
  const [pubImagePreview, setPubImagePreview] = useState(null);

  // Réservations du spot
  const [resas,    setResas]    = useState([]);
  const [resaLoad, setResaLoad] = useState(true);

  const loadResas = async () => {
    setResaLoad(true);
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("spot_nom", spot.nom)
      .order("created_at", { ascending: false })
      .limit(30);
    setResas(data || []);
    setResaLoad(false);
  };

  useEffect(() => { if (section === "resas") loadResas(); }, [section]);

  // ── Upload photo du spot ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("Compression en cours...");
    try {
      const compressed = await compressToWebP(file);
      setUploadMsg("Upload en cours...");
      const path = `spots/${spot.id}/${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from("spot-photos").upload(path, compressed, { upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("spot-photos").getPublicUrl(path);
      const newPhotos = [...uploadedUrls, publicUrl];
      await supabase.from("spots").update({ photos: newPhotos }).eq("id", spot.id);
      setUploadedUrls(newPhotos);
      setUploadMsg("✓ Photo ajoutée !");
      setTimeout(() => setUploadMsg(""), 2500);
    } catch (err) {
      setUploadMsg("Erreur upload. Réessayez.");
    }
    setUploading(false);
  };

  // ── Supprimer une photo ──
  const deletePhoto = async (url) => {
    const newPhotos = uploadedUrls.filter(u => u !== url);
    await supabase.from("spots").update({ photos: newPhotos }).eq("id", spot.id);
    setUploadedUrls(newPhotos);
  };

  // ── Sauvegarder les infos du spot ──
  const saveInfos = async () => {
    setSaving(true);
    const { error } = await supabase.from("spots").update({
      slogan:      form.slogan,
      description: form.description,
      wa:          form.wa,
      gps:         form.gps,
      social: {
        whatsapp:  form.social_wa,
        facebook:  form.social_fb,
        instagram: form.social_ig,
        messenger: form.social_msg,
      },
    }).eq("id", spot.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else alert("Erreur : " + error.message);
  };

  // ── Upload image pub ──
  const handlePubImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPubImagePreview(URL.createObjectURL(file));
    const compressed = await compressToWebP(file);
    setPubImageFile(compressed);
  };

  // ── Soumettre une demande de pub ──
  const submitPub = async () => {
    if (!pub.date_debut || !pub.date_fin) return alert("Dates requises.");
    if (pub.est_annonceur_ext && !pub.annonceur_nom) return alert("Nom de l'annonceur requis.");
    setPubSending(true);

    let imageUrl = null;

    // Upload image pub si fournie
    if (pubImageFile) {
      const path = `ads/${spot.id}/${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from("spot-photos").upload(path, pubImageFile, { upsert: false });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("spot-photos").getPublicUrl(path);
        imageUrl = publicUrl;
      }
    }

    const { error } = await supabase.from("ads_regie").insert({
      type:            pub.type,
      titre:           pub.est_annonceur_ext ? pub.annonceur_nom : pub.titre,
      texte:           pub.texte,
      lien_wa:         pub.lien_wa,
      cta:             pub.cta,
      date_debut:      pub.date_debut,
      date_fin:        pub.date_fin,
      actif:           false,
      image_url:       imageUrl,
      gerant_id:       pub.est_annonceur_ext ? null : gerant.id,
      spot_id:         pub.est_annonceur_ext ? null : spot.id,
      annonceur_ext:   pub.est_annonceur_ext,
      annonceur_nom:   pub.est_annonceur_ext ? pub.annonceur_nom : null,
      annonceur_contact: pub.est_annonceur_ext ? pub.annonceur_contact : null,
    });
    setPubSending(false);
    if (!error) setPubSent(true);
    else alert("Erreur : " + error.message);
  };

  const statutColor = { en_attente: "#C8920A", confirmee: "#2ECC8A", annulee: "#E74C3C" };

  const sections = [
    { id: "infos",  label: "Mon Spot",     icon: "📍" },
    { id: "photos", label: "Photos",       icon: "📸" },
    { id: "pub",    label: "Visibilité",   icon: "📢" },
    { id: "resas",  label: "Réservations", icon: "📅" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0D2B30", color: "#F4F7F7", fontFamily: "Arial, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { display: none; }`}</style>

      {/* Header */}
      <div style={{ background: "#000", borderBottom: "0.5px solid rgba(200,146,10,0.3)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 8, color: "#C8920A", letterSpacing: "0.4em" }}>ESPACE GÉRANT</p>
          <h1 style={{ fontSize: 18, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7", lineHeight: 1.2 }}>
            {spot.nom}
          </h1>
          <p style={{ fontSize: 10, color: "rgba(244,247,247,0.35)", marginTop: 2 }}>{spot.ville} · {spot.pass} · 27 jours</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: "#C8920A", fontWeight: 700 }}>{gerant.nom}</p>
          <button onClick={onLogout} style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", background: "none", border: "none", cursor: "pointer" }}>Déconnexion</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", borderBottom: "0.5px solid rgba(200,146,10,0.15)", background: "rgba(0,0,0,0.3)", overflowX: "auto" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            flex: 1, minWidth: 70, padding: "12px 6px", background: "none", border: "none",
            borderBottom: section === s.id ? "2px solid #C8920A" : "2px solid transparent",
            color: section === s.id ? "#C8920A" : "rgba(244,247,247,0.4)",
            cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap",
          }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 480, margin: "0 auto" }}>

        {/* ── SECTION INFOS ── */}
        {section === "infos" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>INFORMATIONS</p>
              <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Mon Spot</h2>
              <p style={{ fontSize: 11, color: "rgba(244,247,247,0.35)", marginTop: 4 }}>
                Vous pouvez modifier slogan, description, WhatsApp et réseaux sociaux.
              </p>
            </div>

            {/* Offre & durée */}
            <div style={{ ...S.card, background: "rgba(200,146,10,0.07)", marginBottom: 16 }}>
              <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.2em", marginBottom: 8, fontWeight: 700 }}>VOTRE OFFRE</p>
              {OFFRES.filter(o => o.label.toLowerCase().includes(spot.pass.toLowerCase())).slice(0, 1).map(o => (
                <div key={o.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#F4F7F7", fontWeight: 700 }}>{spot.pass}</span>
                    <span style={{ fontSize: 11, color: "#C8920A", fontWeight: 700 }}>✦ {o.duree}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(244,247,247,0.45)", lineHeight: 1.4 }}>{o.desc}</p>
                </div>
              ))}
            </div>

            {/* Infos non modifiables */}
            <div style={{ ...S.card, marginBottom: 16, background: "rgba(200,146,10,0.03)" }}>
              <p style={{ fontSize: 9, color: "rgba(244,247,247,0.3)", letterSpacing: "0.2em", marginBottom: 8 }}>INFORMATIONS FIXES (admin uniquement)</p>
              {[["Catégorie", spot.cat], ["Pass", spot.pass], ["Ville", spot.ville], ["Région", spot.region]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "rgba(244,247,247,0.35)" }}>{l}</span>
                  <span style={{ fontSize: 11, color: "rgba(244,247,247,0.6)", fontWeight: 600 }}>{v || "—"}</span>
                </div>
              ))}
            </div>

            {/* Champs modifiables */}
            <label style={S.label}>SLOGAN</label>
            <input placeholder="Ex : La table de l'archipel" value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} style={S.input} />

            <label style={S.label}>DESCRIPTION</label>
            <textarea placeholder="Description de votre établissement (2-4 phrases)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...S.input, height: 90, resize: "none" }} />

            <label style={S.label}>WHATSAPP RÉSERVATIONS</label>
            <input placeholder="+261 32..." value={form.wa} onChange={e => setForm({ ...form, wa: e.target.value })} style={S.input} />

            <label style={S.label}>COORDONNÉES GPS (optionnel)</label>
            <input placeholder="Ex : -13.3167, 48.2667" value={form.gps} onChange={e => setForm({ ...form, gps: e.target.value })} style={S.input} />

            {spot.pass === "Premium" && (
              <>
                <label style={{ ...S.label, marginTop: 4 }}>RÉSEAUX SOCIAUX — PASS PREMIUM</label>
                <input placeholder="WhatsApp Business (+261...)" value={form.social_wa}  onChange={e => setForm({ ...form, social_wa: e.target.value })}  style={S.input} />
                <input placeholder="Page Facebook (URL)"          value={form.social_fb}  onChange={e => setForm({ ...form, social_fb: e.target.value })}  style={S.input} />
                <input placeholder="Instagram (@pseudo ou URL)"   value={form.social_ig}  onChange={e => setForm({ ...form, social_ig: e.target.value })}  style={S.input} />
                <input placeholder="Messenger (URL)"              value={form.social_msg} onChange={e => setForm({ ...form, social_msg: e.target.value })} style={S.input} />
              </>
            )}

            <button onClick={saveInfos} disabled={saving} style={{ ...S.btnGold, opacity: saving ? 0.6 : 1 }}>
              {saved ? "✓ SAUVEGARDÉ !" : saving ? "SAUVEGARDE..." : "SAUVEGARDER MES INFOS"}
            </button>
          </div>
        )}

        {/* ── SECTION PHOTOS ── */}
        {section === "photos" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>GALERIE</p>
              <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Mes Photos</h2>
              <p style={{ fontSize: 11, color: "rgba(244,247,247,0.35)", marginTop: 4 }}>
                Ajoutez vos photos directement. Compressées automatiquement en WebP.
              </p>
            </div>

            {/* Bouton upload */}
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "rgba(200,146,10,0.1)", border: "1px dashed rgba(200,146,10,0.4)",
              borderRadius: 14, padding: "20px 16px", cursor: "pointer", marginBottom: 16,
            }}>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} disabled={uploading} />
              <span style={{ fontSize: 20 }}>📷</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#C8920A" }}>
                  {uploading ? "Traitement..." : "Ajouter une photo"}
                </p>
                <p style={{ fontSize: 10, color: "rgba(244,247,247,0.35)" }}>JPG, PNG, HEIC → WebP &lt;100 Ko</p>
              </div>
            </label>

            {uploadMsg && (
              <p style={{ fontSize: 12, color: uploadMsg.startsWith("✓") ? "#2ECC8A" : "#E74C3C", marginBottom: 12, textAlign: "center" }}>{uploadMsg}</p>
            )}

            {/* Galerie actuelle */}
            {uploadedUrls.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {uploadedUrls.map((url, i) => (
                  <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1" }}>
                    <img src={url} alt={`photo-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => deletePhoto(url)} style={{
                      position: "absolute", top: 4, right: 4,
                      background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                      width: 22, height: 22, cursor: "pointer", color: "#E74C3C",
                      fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                    {i === 0 && (
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(200,146,10,0.8)", padding: "2px 6px" }}>
                        <p style={{ fontSize: 8, color: "#0D2B30", fontWeight: 800, textAlign: "center" }}>PRINCIPALE</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 20px" }}>
                <p style={{ fontSize: 13, color: "rgba(244,247,247,0.25)", fontStyle: "italic" }}>Aucune photo. Ajoutez-en une !</p>
              </div>
            )}

            <div style={{ background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.25)", borderRadius: 12, padding: "12px 14px", marginTop: 16 }}>
              <p style={{ fontSize: 11, color: "#C8920A", lineHeight: 1.5 }}>
                💡 La première photo sera utilisée comme image principale de votre fiche. Glissez pour réorganiser.
              </p>
            </div>
          </div>
        )}

        {/* ── SECTION PUB ── */}
        {section === "pub" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>RÉGIE</p>
              <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Visibilité & Publicité</h2>
              <p style={{ fontSize: 11, color: "rgba(244,247,247,0.35)", marginTop: 4 }}>
                Boostez votre spot — ou créez une pub pour un annonceur extérieur.
              </p>
            </div>

            {pubSent ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <p style={{ fontSize: 18, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7", marginBottom: 8 }}>Demande envoyée !</p>
                <p style={{ fontSize: 12, color: "rgba(244,247,247,0.4)", lineHeight: 1.6, marginBottom: 24 }}>
                  {pub.est_annonceur_ext
                    ? "La demande sera traitée par Mandimbimanana sous 24h."
                    : "Mandimbimanana va préparer votre visuel et activer la pub sous 24h."}
                </p>
                <button onClick={() => { setPubSent(false); setPubImageFile(null); setPubImagePreview(null); }} style={{ ...S.btnGold, width: "auto", padding: "12px 28px" }}>
                  NOUVELLE DEMANDE
                </button>
              </div>
            ) : (
              <>
                {/* Toggle : Mon spot / Annonceur extérieur */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {[
                    { val: false, label: "🏠 Mon Spot",          sub: "Je booste mon établissement" },
                    { val: true,  label: "🌐 Annonceur Extérieur", sub: "Pub pour une autre marque" },
                  ].map(opt => (
                    <button key={String(opt.val)} onClick={() => setPub({ ...pub, est_annonceur_ext: opt.val })} style={{
                      padding: "12px 10px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                      background: pub.est_annonceur_ext === opt.val ? "rgba(200,146,10,0.12)" : "rgba(255,255,255,0.03)",
                      border: `0.5px solid ${pub.est_annonceur_ext === opt.val ? "rgba(200,146,10,0.5)" : "rgba(255,255,255,0.1)"}`,
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: pub.est_annonceur_ext === opt.val ? "#C8920A" : "rgba(244,247,247,0.6)", marginBottom: 3 }}>{opt.label}</p>
                      <p style={{ fontSize: 9, color: "rgba(244,247,247,0.3)" }}>{opt.sub}</p>
                    </button>
                  ))}
                </div>

                {/* Infos annonceur extérieur */}
                {pub.est_annonceur_ext && (
                  <div style={{ ...S.card, borderColor: "rgba(200,146,10,0.3)", marginBottom: 16 }}>
                    <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.2em", marginBottom: 10, fontWeight: 700 }}>INFOS ANNONCEUR</p>
                    <label style={S.label}>NOM DE L'ANNONCEUR / MARQUE</label>
                    <input placeholder="Ex : Pizzeria Akamasoa" value={pub.annonceur_nom} onChange={e => setPub({ ...pub, annonceur_nom: e.target.value })} style={S.input} />
                    <label style={S.label}>CONTACT (WhatsApp ou email)</label>
                    <input placeholder="+261 32... ou email" value={pub.annonceur_contact} onChange={e => setPub({ ...pub, annonceur_contact: e.target.value })} style={S.input} />
                    <div style={{ background: "rgba(200,146,10,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                      <p style={{ fontSize: 10, color: "#C8920A", lineHeight: 1.5 }}>
                        🎨 <strong>Créa incluse :</strong> WAYZA crée le visuel de la pub. L'annonceur n'a rien à préparer — tarifs à la carte ci-dessous.
                      </p>
                    </div>
                  </div>
                )}

                {/* FORMAT */}
                <label style={S.label}>FORMAT PUBLICITAIRE</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {PUB_TYPES_CARTE.map(t => (
                    <button key={t.v} onClick={() => setPub({ ...pub, type: t.v })} style={{
                      padding: "11px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                      background: pub.type === t.v ? "rgba(200,146,10,0.12)" : "rgba(255,255,255,0.03)",
                      border: `0.5px solid ${pub.type === t.v ? "rgba(200,146,10,0.5)" : "rgba(255,255,255,0.08)"}`,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: pub.type === t.v ? "#C8920A" : "rgba(244,247,247,0.7)", marginBottom: 2 }}>{t.l}</p>
                        <p style={{ fontSize: 9, color: "rgba(244,247,247,0.3)" }}>{t.desc}</p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: pub.type === t.v ? "#C8920A" : "rgba(244,247,247,0.35)", flexShrink: 0, marginLeft: 10 }}>{t.p}</span>
                    </button>
                  ))}
                </div>

                {/* Contenu de la pub */}
                <label style={S.label}>{pub.est_annonceur_ext ? "NOM / TITRE DE LA PUB" : "TITRE DE LA PUB"}</label>
                <input
                  placeholder={pub.est_annonceur_ext ? "Ex : Pizzeria Akamasoa" : "Ex : Orchidea Club"}
                  value={pub.est_annonceur_ext ? pub.annonceur_nom || "" : pub.titre}
                  onChange={e => pub.est_annonceur_ext
                    ? setPub({ ...pub, annonceur_nom: e.target.value })
                    : setPub({ ...pub, titre: e.target.value })}
                  style={S.input}
                />

                <label style={S.label}>MESSAGE / SLOGAN</label>
                <textarea placeholder="Ex : La nuit commence ici — Réservez votre table VIP" value={pub.texte} onChange={e => setPub({ ...pub, texte: e.target.value })} style={{ ...S.input, height: 70, resize: "none" }} />

                <label style={S.label}>WHATSAPP DU BOUTON</label>
                <input placeholder="+261 32..." value={pub.lien_wa} onChange={e => setPub({ ...pub, lien_wa: e.target.value })} style={S.input} />

                <label style={S.label}>TEXTE DU BOUTON</label>
                <input placeholder='Ex: "RÉSERVER SUR WHATSAPP"' value={pub.cta} onChange={e => setPub({ ...pub, cta: e.target.value })} style={S.input} />

                {/* Upload image (optionnel — sinon créa par WAYZA) */}
                <label style={{ ...S.label, marginBottom: 8 }}>IMAGE (optionnel — sinon WAYZA crée la créa)</label>
                <label style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "rgba(200,146,10,0.06)", border: "1px dashed rgba(200,146,10,0.3)",
                  borderRadius: 12, padding: "14px", cursor: "pointer", marginBottom: 14,
                }}>
                  <input type="file" accept="image/*" onChange={handlePubImageChange} style={{ display: "none" }} />
                  {pubImagePreview ? (
                    <img src={pubImagePreview} alt="preview" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <span style={{ fontSize: 24, flexShrink: 0 }}>🖼</span>
                  )}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#C8920A" }}>{pubImagePreview ? "Image sélectionnée ✓" : "Ajouter une image"}</p>
                    <p style={{ fontSize: 9, color: "rgba(244,247,247,0.3)" }}>Si absent, Mandimbimanana crée le visuel</p>
                  </div>
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
                  <div>
                    <label style={S.label}>DATE DÉBUT</label>
                    <input type="date" value={pub.date_debut} onChange={e => setPub({ ...pub, date_debut: e.target.value })} style={{ ...S.input, colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label style={S.label}>DATE FIN</label>
                    <input type="date" value={pub.date_fin} onChange={e => setPub({ ...pub, date_fin: e.target.value })} style={{ ...S.input, colorScheme: "dark" }} />
                  </div>
                </div>

                <div style={{ background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.25)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: "#C8920A", lineHeight: 1.6 }}>
                    {pub.est_annonceur_ext
                      ? "🌐 Cette demande concerne un annonceur extérieur. Mandimbimanana prendra contact pour confirmer et créer la pub."
                      : "🔒 Votre demande sera en attente jusqu'à activation par Mandimbimanana."}
                  </p>
                </div>

                <button onClick={submitPub} disabled={pubSending} style={{ ...S.btnGold, opacity: pubSending ? 0.6 : 1 }}>
                  {pubSending ? "ENVOI..." : pub.est_annonceur_ext ? "✓ SOUMETTRE LA DEMANDE ANNONCEUR" : "✓ SOUMETTRE LA DEMANDE"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── SECTION RÉSERVATIONS ── */}
        {section === "resas" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>PANNEAU</p>
              <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Mes Réservations</h2>
            </div>
            {resaLoad ? (
              <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
            ) : resas.length === 0 ? (
              <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucune réservation pour ce spot.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {resas.map(r => (
                  <div key={r.id} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `0.5px solid ${statutColor[r.statut] || "#C8920A"}30`,
                    borderLeft: `3px solid ${statutColor[r.statut] || "#C8920A"}`,
                    borderRadius: 14, padding: "12px 16px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{r.client_nom}</p>
                        <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", marginTop: 2 }}>{r.date_reservation} à {r.heure} · {r.personnes} pers.</p>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: statutColor[r.statut], letterSpacing: "0.1em", background: `${statutColor[r.statut]}20`, padding: "3px 8px", borderRadius: 10 }}>
                        {r.statut?.replace("_", " ").toUpperCase()}
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

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────
export default function FormulaireCommercial() {
  const [gerant, setGerant] = useState(null);

  return gerant
    ? <ConsoleGerant gerant={gerant} onLogout={() => setGerant(null)} />
    : <LoginGerant onLogin={setGerant} />;
}
