// ============================================================
//  WAYZA 2026 — Console Admin Mandimbimanana
//  Gestion Régie Pub + Spots + Gérants + Réservations + Demandes
//  v7 — Nouvelles sections :
//       • Demandes : pubs en attente (spots + annonceurs ext.)
//       • Régie : format Wayz'Mag + statut_demande
//       • Spots : offre 27j, gestion photos, dates abonnement
//       • Annonceurs extérieurs : traitement créa à la carte
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { compressToWebP } from "./WayzaApp";

const SUPABASE_URL     = "https://qmoesstuwetdugjgqbyl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtb2Vzc3R1d2V0ZHVnamdxYnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTEyODMsImV4cCI6MjA5MjA2NzI4M30.yUMqnecvSjz3w8Ug1_dek7HR7kZILq4VeSgiZga_bn0";
const ADMIN_PASSWORD   = "WAYZA_ADMIN_2026";
const supabase         = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `WAYZA-${seg(4)}-${seg(4)}`;
}

// Calcule date_fin = date_debut + duree_jours
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── STYLES ───────────────────────────────────────────────────
const S = {
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 10,
    padding: "10px 14px", color: "#F4F7F7", fontSize: 13,
    fontFamily: "Arial", outline: "none", marginBottom: 10,
  },
  label: {
    fontSize: 9, color: "#C8920A", letterSpacing: "0.25em",
    fontWeight: 700, display: "block", marginBottom: 5, fontFamily: "Arial",
  },
  btnGold: {
    background: "#C8920A", color: "#0D2B30", border: "none",
    borderRadius: 10, padding: "10px 18px", fontWeight: 800,
    cursor: "pointer", fontSize: 11, letterSpacing: "0.08em",
  },
  btnGhost: {
    background: "rgba(255,255,255,0.05)", color: "rgba(244,247,247,0.5)",
    border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 10,
    padding: "10px 18px", cursor: "pointer", fontSize: 11,
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(200,146,10,0.15)",
    borderRadius: 14, padding: "14px 16px",
  },
};

// ─── AUTH ─────────────────────────────────────────────────────
const AdminLogin = ({ onLogin }) => {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if (pwd === ADMIN_PASSWORD) onLogin(); else setErr(true); };
  return (
    <div style={{ minHeight: "100vh", background: "#0D2B30", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 24, padding: 32 }}>
        <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.4em", fontFamily: "Arial", marginBottom: 6 }}>ACCÈS RESTREINT</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7", marginBottom: 8 }}>Console <span style={{ color: "#C8920A" }}>Admin</span></h1>
        <p style={{ fontSize: 12, color: "rgba(244,247,247,0.4)", marginBottom: 24 }}>Réservé à Mandimbimanana</p>
        <input type="password" placeholder="Mot de passe admin" value={pwd}
          onChange={e => { setPwd(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          style={{ ...S.input, border: `0.5px solid ${err ? "#E74C3C" : "rgba(200,146,10,0.3)"}`, marginBottom: 8 }}
        />
        {err && <p style={{ fontSize: 11, color: "#E74C3C", marginBottom: 8 }}>Mot de passe incorrect</p>}
        <button onClick={submit} style={{ ...S.btnGold, width: "100%", padding: "14px 0", fontSize: 13 }}>ENTRER</button>
      </div>
    </div>
  );
};

// ─── IMAGE UPLOADER ───────────────────────────────────────────
const ImageUploader = ({ onUploaded, bucket = "wayza-ads", label = "Image publicitaire", initialUrl = null }) => {
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(initialUrl);
  const [info,      setInfo]      = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setInfo("Compression...");
    try {
      const compressed = await compressToWebP(file, 100);
      const kb = Math.round(compressed.size / 1024);
      setPreview(URL.createObjectURL(compressed));
      const path = `${Date.now()}_${compressed.name}`;
      const { data, error } = await supabase.storage.from(bucket).upload(path, compressed, { contentType: "image/webp" });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
      onUploaded(publicUrl);
      setInfo(`✓ ${kb} Ko — prêt`);
    } catch (err) { setInfo("Erreur : " + err.message); }
    setUploading(false);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ ...S.label }}>{label.toUpperCase()}</label>
      <div onClick={() => inputRef.current.click()} style={{ border: "1px dashed rgba(200,146,10,0.4)", borderRadius: 12, overflow: "hidden", cursor: "pointer", minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {preview
          ? <img src={preview} style={{ width: "100%", height: 120, objectFit: "cover" }} alt="preview" />
          : <div style={{ textAlign: "center", padding: 16 }}>
              <p style={{ fontSize: 20, marginBottom: 4 }}>📁</p>
              <p style={{ fontSize: 11, color: "rgba(244,247,247,0.4)" }}>Cliquez pour sélectionner</p>
              <p style={{ fontSize: 10, color: "rgba(244,247,247,0.25)" }}>Auto-compression WebP &lt; 100 Ko</p>
            </div>
        }
        {uploading && <div style={{ position: "absolute", inset: 0, background: "rgba(13,43,48,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#C8920A", fontSize: 12 }}>Upload...</span></div>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      {info && <p style={{ fontSize: 10, color: "#C8920A", marginTop: 4 }}>{info}</p>}
    </div>
  );
};

// ─── FORMULAIRE PUB (admin) ───────────────────────────────────
const AdForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || {
    type: "popup", titre: "", texte: "", lien_wa: "", cta: "RÉSERVER SUR WHATSAPP",
    image_url: "", date_debut: "", date_fin: "", actif: true,
    annonceur_ext: false, annonceur_nom: "", annonceur_contact: "",
    statut_demande: "actif",
  });

  const TYPES = [
    { v: "popup",         l: "Pop up",          p: "200k/j" },
    { v: "banniere_haut", l: "Bannière Haut",    p: "20k/j"  },
    { v: "banniere_bas",  l: "Bannière Bas",     p: "10k/j"  },
    { v: "sponsorise",    l: "Sponsorisé",       p: "5k/j"   },
    { v: "ticker",        l: "Ticker",           p: "2k/j"   },
    { v: "wayzmag",       l: "Wayz'Mag",         p: "devis"  },
  ];

  return (
    <div style={{ ...S.card, borderRadius: 18, padding: 20, marginBottom: 16, border: "0.5px solid rgba(200,146,10,0.3)" }}>
      <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 14 }}>
        {initial ? "MODIFIER LA PUB" : "NOUVELLE PUB"}
      </p>

      {/* Annonceur ? */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[{ val: false, l: "🏠 Spot WAYZA" }, { val: true, l: "🌐 Annonceur Ext." }].map(opt => (
          <button key={String(opt.val)} onClick={() => setForm({ ...form, annonceur_ext: opt.val })} style={{
            flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", fontSize: 10, fontWeight: 700,
            background: form.annonceur_ext === opt.val ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: form.annonceur_ext === opt.val ? "#0D2B30" : "rgba(244,247,247,0.5)",
            border: form.annonceur_ext === opt.val ? "none" : "0.5px solid rgba(255,255,255,0.1)",
          }}>{opt.l}</button>
        ))}
      </div>

      {form.annonceur_ext && (
        <>
          <input placeholder="Nom annonceur / marque" value={form.annonceur_nom} onChange={e => setForm({ ...form, annonceur_nom: e.target.value, titre: e.target.value })} style={S.input} />
          <input placeholder="Contact annonceur (+261... ou email)" value={form.annonceur_contact} onChange={e => setForm({ ...form, annonceur_contact: e.target.value })} style={S.input} />
        </>
      )}

      {/* Format */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        {TYPES.map(t => (
          <button key={t.v} onClick={() => setForm({ ...form, type: t.v })} style={{
            padding: "8px 6px", borderRadius: 10, cursor: "pointer", fontFamily: "Arial",
            background: form.type === t.v ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: form.type === t.v ? "#0D2B30" : "rgba(244,247,247,0.5)",
            border: form.type === t.v ? "none" : "0.5px solid rgba(255,255,255,0.1)",
            fontSize: 10, fontWeight: 700,
          }}>{t.l}<br /><span style={{ fontSize: 9, fontWeight: 400 }}>{t.p}</span></button>
        ))}
      </div>

      <input placeholder="Titre / Nom du partenaire" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={S.input} />
      <textarea placeholder="Texte / slogan" value={form.texte} onChange={e => setForm({ ...form, texte: e.target.value })} style={{ ...S.input, height: 60, resize: "none" }} />
      <input placeholder="Numéro WhatsApp (+261...)" value={form.lien_wa} onChange={e => setForm({ ...form, lien_wa: e.target.value })} style={S.input} />
      <input placeholder='Texte bouton' value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} style={S.input} />

      {form.type !== "ticker" && form.type !== "sponsorise" && (
        <ImageUploader
          onUploaded={url => setForm({ ...form, image_url: url })}
          bucket="wayza-ads"
          label={form.type === "popup" ? "Créa Pop up (plein écran)" : form.type === "wayzmag" ? "Visuel Wayz'Mag" : "Créa Bannière"}
          initialUrl={form.image_url || null}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={S.label}>DATE DÉBUT</label>
          <input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} style={{ ...S.input, marginBottom: 0, colorScheme: "dark" }} />
        </div>
        <div>
          <label style={S.label}>DATE FIN</label>
          <input type="date" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} style={{ ...S.input, marginBottom: 0, colorScheme: "dark" }} />
        </div>
      </div>

      {/* Actif / Statut */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <label style={{ ...S.label, marginBottom: 0 }}>ACTIVER IMMÉDIATEMENT</label>
        <button onClick={() => setForm({ ...form, actif: !form.actif, statut_demande: !form.actif ? "actif" : "en_production" })} style={{
          padding: "4px 14px", borderRadius: 20, cursor: "pointer", fontSize: 10, fontWeight: 700,
          background: form.actif ? "rgba(46,204,138,0.15)" : "rgba(231,76,60,0.1)",
          color: form.actif ? "#2ECC8A" : "#E74C3C",
          border: `0.5px solid ${form.actif ? "rgba(46,204,138,0.3)" : "rgba(231,76,60,0.3)"}`,
        }}>{form.actif ? "OUI — ACTIF" : "NON — EN ATTENTE"}</button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onSave(form)} style={{ ...S.btnGold, flex: 1, padding: "12px 0" }}>ENREGISTRER</button>
        <button onClick={onCancel} style={{ ...S.btnGhost, flex: 1, padding: "12px 0" }}>ANNULER</button>
      </div>
    </div>
  );
};

// ─── SECTION RÉGIE ────────────────────────────────────────────
const RegieSection = () => {
  const [ads,      setAds]      = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editAd,   setEditAd]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("tous"); // tous | actif | inactif | annonceur

  const loadAds = async () => {
    setLoading(true);
    const { data } = await supabase.from("ads_regie").select("*").order("created_at", { ascending: false });
    setAds(data || []);
    setLoading(false);
  };
  useEffect(() => { loadAds(); }, []);

  const saveAd      = async (form) => {
    const payload = { ...form, statut_demande: form.actif ? "actif" : "en_production" };
    editAd
      ? await supabase.from("ads_regie").update(payload).eq("id", editAd.id)
      : await supabase.from("ads_regie").insert(payload);
    setShowForm(false); setEditAd(null); loadAds();
  };
  const toggleActif = async (ad)  => {
    await supabase.from("ads_regie").update({ actif: !ad.actif, statut_demande: !ad.actif ? "actif" : "en_production" }).eq("id", ad.id);
    loadAds();
  };
  const deleteAd    = async (id)  => { if (!window.confirm("Supprimer cette pub ?")) return; await supabase.from("ads_regie").delete().eq("id", id); loadAds(); };

  const typeLabel = { popup: "Pop up", banniere_haut: "Bannière Haut", banniere_bas: "Bannière Bas", sponsorise: "Sponsorisé", ticker: "Ticker", wayzmag: "Wayz'Mag" };
  const typeColor = { popup: "#C8920A", banniere_haut: "#1A4A6B", banniere_bas: "#1A4A6B", sponsorise: "#1B6B4A", ticker: "#6B3A1A", wayzmag: "#6B1A6B" };

  const filtered = ads.filter(a => {
    if (filter === "actif") return a.actif;
    if (filter === "inactif") return !a.actif;
    if (filter === "annonceur") return a.annonceur_ext;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>PANNEAU</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Régie Publicitaire</h2>
        </div>
        <button onClick={() => { setShowForm(true); setEditAd(null); }} style={S.btnGold}>+ NOUVELLE PUB</button>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[["tous", "Tout"], ["actif", "● Actives"], ["inactif", "● Inactives"], ["annonceur", "🌐 Annonceurs"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontSize: 10, fontWeight: 700,
            background: filter === v ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: filter === v ? "#0D2B30" : "rgba(244,247,247,0.4)",
            border: filter === v ? "none" : "0.5px solid rgba(255,255,255,0.1)",
          }}>{l} {v === "tous" ? `(${ads.length})` : `(${ads.filter(a => v === "actif" ? a.actif : v === "inactif" ? !a.actif : a.annonceur_ext).length})`}</button>
        ))}
      </div>

      {showForm && <AdForm initial={editAd} onSave={saveAd} onCancel={() => { setShowForm(false); setEditAd(null); }} />}

      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : filtered.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucune pub.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(ad => (
              <div key={ad.id} style={{ ...S.card, borderLeft: `3px solid ${typeColor[ad.type] || "#C8920A"}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: typeColor[ad.type], letterSpacing: "0.1em", background: `${typeColor[ad.type]}20`, padding: "2px 8px", borderRadius: 10 }}>{typeLabel[ad.type]}</span>
                    <span style={{ fontSize: 9, color: ad.actif ? "#2ECC8A" : "rgba(244,247,247,0.25)", fontWeight: 700 }}>{ad.actif ? "● ACTIF" : "● INACTIF"}</span>
                    {ad.annonceur_ext && <span style={{ fontSize: 9, color: "#6BAED6", fontWeight: 700 }}>🌐 EXT.</span>}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#F4F7F7", marginBottom: 2 }}>{ad.titre}</p>
                  {ad.annonceur_contact && <p style={{ fontSize: 10, color: "#C8920A", marginBottom: 2 }}>📞 {ad.annonceur_contact}</p>}
                  <p style={{ fontSize: 11, color: "rgba(244,247,247,0.4)" }}>{ad.date_debut} → {ad.date_fin}</p>
                  {ad.image_url && <p style={{ fontSize: 9, color: "rgba(46,204,138,0.7)", marginTop: 2 }}>✓ Créa uploadée</p>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <button onClick={() => toggleActif(ad)} style={{ background: ad.actif ? "rgba(231,76,60,0.15)" : "rgba(46,204,138,0.15)", color: ad.actif ? "#E74C3C" : "#2ECC8A", border: `0.5px solid ${ad.actif ? "rgba(231,76,60,0.3)" : "rgba(46,204,138,0.3)"}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>{ad.actif ? "PAUSE" : "ACTIVER"}</button>
                  <button onClick={() => { setEditAd(ad); setShowForm(true); }} style={{ background: "rgba(200,146,10,0.1)", color: "#C8920A", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 10 }}>ÉDITER</button>
                  <button onClick={() => deleteAd(ad.id)} style={{ background: "rgba(231,76,60,0.1)", color: "#E74C3C", border: "0.5px solid rgba(231,76,60,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 10 }}>SUPPR.</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

// ─── SECTION DEMANDES (nouvelles) ────────────────────────────
// Pubs soumises par les gérants (spots + annonceurs extérieurs)
// En attente de créa + activation par l'admin
const DemandesSection = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [treating, setTreating] = useState(null); // id de la demande en traitement
  const [uploadUrl, setUploadUrl] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ads_regie")
      .select("*")
      .eq("actif", false)
      .order("created_at", { ascending: false });
    setDemandes(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Activer une demande (après avoir uploadé la créa)
  const activerDemande = async (d) => {
    if (!uploadUrl && !d.image_url && d.type !== "ticker" && d.type !== "sponsorise") {
      return alert("Uploadez d'abord une image pour cette pub.");
    }
    await supabase.from("ads_regie").update({
      actif: true,
      statut_demande: "actif",
      image_url: uploadUrl || d.image_url || null,
    }).eq("id", d.id);
    setTreating(null);
    setUploadUrl("");
    load();
  };

  const refuserDemande = async (id) => {
    await supabase.from("ads_regie").update({ statut_demande: "refuse" }).eq("id", id);
    load();
  };

  const marquerEnProduction = async (id) => {
    await supabase.from("ads_regie").update({ statut_demande: "en_production" }).eq("id", id);
    load();
  };

  const typeColor = { popup: "#C8920A", banniere_haut: "#1A4A6B", banniere_bas: "#1A4A6B", sponsorise: "#1B6B4A", ticker: "#6B3A1A", wayzmag: "#6B1A6B" };
  const typeLabel = { popup: "Pop up", banniere_haut: "Bannière Haut", banniere_bas: "Bannière Bas", sponsorise: "Sponsorisé", ticker: "Ticker", wayzmag: "Wayz'Mag" };

  const statutBadge = (s) => {
    const map = {
      en_attente:    { color: "#C8920A", label: "EN ATTENTE" },
      en_production: { color: "#6BAED6", label: "EN PRODUCTION" },
      actif:         { color: "#2ECC8A", label: "ACTIF" },
      refuse:        { color: "#E74C3C", label: "REFUSÉ" },
    };
    return map[s] || map["en_attente"];
  };

  const enAttente = demandes.filter(d => d.statut_demande === "en_attente" || d.statut_demande === "en_production");
  const traitees  = demandes.filter(d => d.statut_demande === "actif" || d.statut_demande === "refuse");

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>TRAITEMENT</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Demandes de Pub</h2>
        <p style={{ fontSize: 11, color: "rgba(244,247,247,0.35)", marginTop: 4 }}>
          Pubs soumises par les gérants et annonceurs extérieurs — à traiter / activer.
        </p>
      </div>

      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p> : (
        <>
          {/* En attente */}
          {enAttente.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>
                À TRAITER ({enAttente.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {enAttente.map(d => {
                  const sb = statutBadge(d.statut_demande);
                  const isTreating = treating === d.id;
                  return (
                    <div key={d.id} style={{ ...S.card, borderLeft: `3px solid ${d.annonceur_ext ? "#6BAED6" : "#C8920A"}`, borderColor: d.annonceur_ext ? "rgba(107,174,214,0.3)" : "rgba(200,146,10,0.3)" }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: typeColor[d.type], background: `${typeColor[d.type]}20`, padding: "2px 8px", borderRadius: 10 }}>{typeLabel[d.type]}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: sb.color, background: `${sb.color}20`, padding: "2px 8px", borderRadius: 10 }}>{sb.label}</span>
                            {d.annonceur_ext && <span style={{ fontSize: 9, fontWeight: 700, color: "#6BAED6" }}>🌐 ANNONCEUR EXT.</span>}
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#F4F7F7" }}>{d.titre}</p>
                          {d.texte && <p style={{ fontSize: 11, color: "rgba(244,247,247,0.45)", marginTop: 2, fontStyle: "italic" }}>{d.texte}</p>}
                        </div>
                      </div>

                      {/* Infos */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        {[
                          ["Période", `${d.date_debut} → ${d.date_fin}`],
                          ["WhatsApp", d.lien_wa || "—"],
                          ...(d.annonceur_ext ? [
                            ["Annonceur", d.annonceur_nom || "—"],
                            ["Contact", d.annonceur_contact || "—"],
                          ] : []),
                        ].map(([l, v]) => (
                          <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px" }}>
                            <p style={{ fontSize: 9, color: "rgba(244,247,247,0.3)", marginBottom: 2 }}>{l.toUpperCase()}</p>
                            <p style={{ fontSize: 11, color: "#F4F7F7" }}>{v}</p>
                          </div>
                        ))}
                      </div>

                      {/* Image fournie par le gérant ? */}
                      {d.image_url && (
                        <div style={{ marginBottom: 10 }}>
                          <p style={{ fontSize: 9, color: "#2ECC8A", marginBottom: 6 }}>✓ Image fournie par le gérant :</p>
                          <img src={d.image_url} alt="créa gérant" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8 }} />
                        </div>
                      )}

                      {/* Panel de traitement */}
                      {isTreating ? (
                        <div style={{ background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                          <p style={{ fontSize: 10, color: "#C8920A", fontWeight: 700, marginBottom: 10 }}>🎨 CRÉA & ACTIVATION</p>
                          {d.type !== "ticker" && d.type !== "sponsorise" && (
                            <ImageUploader
                              onUploaded={url => setUploadUrl(url)}
                              bucket="wayza-ads"
                              label={d.annonceur_ext ? "Créa pour l'annonceur" : "Créa pub (remplace image gérant si présente)"}
                              initialUrl={d.image_url || null}
                            />
                          )}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => activerDemande(d)} style={{ ...S.btnGold, flex: 1, padding: "10px 0", fontSize: 11 }}>
                              ✓ ACTIVER
                            </button>
                            <button onClick={() => { setTreating(null); setUploadUrl(""); }} style={{ ...S.btnGhost, padding: "10px 14px", fontSize: 11 }}>
                              ANNULER
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={() => { setTreating(d.id); setUploadUrl(""); }} style={{ ...S.btnGold, padding: "8px 14px", fontSize: 10 }}>
                            🎨 TRAITER
                          </button>
                          <button onClick={() => marquerEnProduction(d.id)} style={{ background: "rgba(107,174,214,0.15)", color: "#6BAED6", border: "0.5px solid rgba(107,174,214,0.3)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                            EN PRODUCTION
                          </button>
                          <button onClick={() => refuserDemande(d.id)} style={{ background: "rgba(231,76,60,0.1)", color: "#E74C3C", border: "0.5px solid rgba(231,76,60,0.2)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 10 }}>
                            REFUSER
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Traitées récentes */}
          {traitees.length > 0 && (
            <div>
              <p style={{ fontSize: 9, color: "rgba(244,247,247,0.3)", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>
                TRAITÉES ({traitees.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {traitees.slice(0, 10).map(d => {
                  const sb = statutBadge(d.statut_demande);
                  return (
                    <div key={d.id} style={{ ...S.card, opacity: 0.6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#F4F7F7" }}>{d.titre}</p>
                        <p style={{ fontSize: 10, color: "rgba(244,247,247,0.35)" }}>{d.type} · {d.date_debut} → {d.date_fin}</p>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: sb.color, background: `${sb.color}20`, padding: "3px 8px", borderRadius: 10 }}>{sb.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {enAttente.length === 0 && traitees.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: 30, marginBottom: 12 }}>✓</p>
              <p style={{ fontSize: 13, color: "rgba(244,247,247,0.3)", fontStyle: "italic" }}>Aucune demande en attente.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── SECTION SPOTS ────────────────────────────────────────────
const ComptesSection = () => {
  const [spots,    setSpots]    = useState([]);
  const [loading,  setLoad]     = useState(true);
  const [editSpot, setEditSpot] = useState(null);
  const [offForm,  setOffForm]  = useState({ debut: "", duree: 27 });

  const loadSpots = async () => {
    setLoad(true);
    const { data } = await supabase.from("spots").select("*").order("nom");
    setSpots(data || []);
    setLoad(false);
  };
  useEffect(() => { loadSpots(); }, []);

  const togglePass   = async (s) => { await supabase.from("spots").update({ pass: s.pass === "Premium" ? "Tongasoa" : "Premium" }).eq("id", s.id); loadSpots(); };
  const toggleStatut = async (s) => { await supabase.from("spots").update({ statut: s.statut === "libre" ? "complet" : "libre" }).eq("id", s.id); loadSpots(); };
  const toggleActif  = async (s) => { await supabase.from("spots").update({ actif: !s.actif }).eq("id", s.id); loadSpots(); };

  const saveOffre = async (s) => {
    if (!offForm.debut) return alert("Date de début requise.");
    const fin = addDays(offForm.debut, parseInt(offForm.duree));
    await supabase.from("spots").update({
      offre_debut: offForm.debut,
      offre_fin: fin,
      offre_duree: parseInt(offForm.duree),
    }).eq("id", s.id);
    setEditSpot(null);
    loadSpots();
  };

  // Calcule si l'abonnement est actif / expiré
  const today = new Date().toISOString().split("T")[0];
  const offreStatut = (s) => {
    if (!s.offre_fin) return null;
    const daysLeft = Math.ceil((new Date(s.offre_fin) - new Date()) / 86400000);
    if (daysLeft < 0) return { label: "EXPIRÉ", color: "#E74C3C" };
    if (daysLeft <= 5) return { label: `${daysLeft}j restants`, color: "#E08820" };
    return { label: `${daysLeft}j restants`, color: "#2ECC8A" };
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>PANNEAU</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Gestion des Spots</h2>
      </div>
      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : spots.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucun spot en base.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {spots.map(s => {
              const off = offreStatut(s);
              return (
                <div key={s.id} style={{ ...S.card, borderLeft: `3px solid ${s.actif ? (s.pass === "Premium" ? "#C8920A" : "rgba(200,146,10,0.4)") : "rgba(255,255,255,0.1)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.nom}</p>
                      <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.1em" }}>{s.ville}</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, color: s.actif ? "#2ECC8A" : "rgba(244,247,247,0.25)" }}>{s.actif ? "● Validé" : "● En attente"}</span>
                        {off && <span style={{ fontSize: 9, color: off.color, fontWeight: 700 }}>{off.label}</span>}
                        {s.photos?.length > 0 && <span style={{ fontSize: 9, color: "#6BAED6" }}>📸 {s.photos.length} photo{s.photos.length > 1 ? "s" : ""}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button onClick={() => togglePass(s)} style={{ padding: "4px 8px", borderRadius: 8, cursor: "pointer", fontSize: 9, fontWeight: 700, background: s.pass === "Premium" ? "rgba(200,146,10,0.2)" : "rgba(255,255,255,0.05)", color: s.pass === "Premium" ? "#C8920A" : "rgba(244,247,247,0.4)", border: s.pass === "Premium" ? "0.5px solid rgba(200,146,10,0.4)" : "0.5px solid rgba(255,255,255,0.1)" }}>{s.pass}</button>
                      <button onClick={() => toggleStatut(s)} style={{ padding: "4px 8px", borderRadius: 8, cursor: "pointer", fontSize: 9, fontWeight: 700, background: s.statut === "libre" ? "rgba(46,204,138,0.15)" : "rgba(231,76,60,0.15)", color: s.statut === "libre" ? "#2ECC8A" : "#E74C3C", border: s.statut === "libre" ? "0.5px solid rgba(46,204,138,0.3)" : "0.5px solid rgba(231,76,60,0.3)" }}>{s.statut || "libre"}</button>
                      <button onClick={() => toggleActif(s)} style={{ padding: "4px 8px", borderRadius: 8, cursor: "pointer", fontSize: 9, fontWeight: 700, background: s.actif ? "rgba(231,76,60,0.08)" : "rgba(46,204,138,0.08)", color: s.actif ? "#E74C3C" : "#2ECC8A", border: `0.5px solid ${s.actif ? "rgba(231,76,60,0.3)" : "rgba(46,204,138,0.3)"}` }}>{s.actif ? "Désactiver" : "Valider"}</button>
                      <button onClick={() => { setEditSpot(editSpot === s.id ? null : s.id); setOffForm({ debut: s.offre_debut || today, duree: s.offre_duree || 27 }); }} style={{ padding: "4px 8px", borderRadius: 8, cursor: "pointer", fontSize: 9, background: "rgba(200,146,10,0.1)", color: "#C8920A", border: "0.5px solid rgba(200,146,10,0.3)" }}>📅 OFFRE</button>
                    </div>
                  </div>

                  {/* Panneau offre */}
                  {editSpot === s.id && (
                    <div style={{ background: "rgba(200,146,10,0.07)", border: "0.5px solid rgba(200,146,10,0.25)", borderRadius: 10, padding: 12, marginTop: 10 }}>
                      <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.2em", marginBottom: 8, fontWeight: 700 }}>CONFIGURER L'OFFRE</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ ...S.label, marginBottom: 3 }}>DÉBUT</label>
                          <input type="date" value={offForm.debut} onChange={e => setOffForm({ ...offForm, debut: e.target.value })} style={{ ...S.input, marginBottom: 0, colorScheme: "dark", fontSize: 11 }} />
                        </div>
                        <div>
                          <label style={{ ...S.label, marginBottom: 3 }}>DURÉE (jours)</label>
                          <select value={offForm.duree} onChange={e => setOffForm({ ...offForm, duree: e.target.value })} style={{ ...S.input, marginBottom: 0, fontSize: 11 }}>
                            <option value={27}>27 jours (standard)</option>
                            <option value={7}>7 jours</option>
                            <option value={3}>3 jours</option>
                            <option value={30}>30 jours</option>
                            <option value={60}>60 jours</option>
                          </select>
                        </div>
                      </div>
                      {offForm.debut && (
                        <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", marginBottom: 8 }}>
                          → Fin le {addDays(offForm.debut, parseInt(offForm.duree))}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => saveOffre(s)} style={{ ...S.btnGold, flex: 1, padding: "8px 0", fontSize: 10 }}>ENREGISTRER</button>
                        <button onClick={() => setEditSpot(null)} style={{ ...S.btnGhost, padding: "8px 14px", fontSize: 10 }}>ANNULER</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};

// ─── SECTION GÉRANTS ──────────────────────────────────────────
const GerantsSection = () => {
  const [gerants,     setGerants]     = useState([]);
  const [spots,       setSpots]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [newGerant,   setNewGerant]   = useState({ nom: "", spot_id: "" });
  const [codeVisible, setCodeVisible] = useState(null);
  const [saving,      setSaving]      = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from("gerants").select("*, spots(nom, ville)").order("created_at", { ascending: false }),
      supabase.from("spots").select("id, nom, ville").order("nom"),
    ]);
    setGerants(g || []);
    setSpots(s || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const creerGerant = async () => {
    if (!newGerant.nom || !newGerant.spot_id) return alert("Nom et spot requis.");
    setSaving(true);
    const code = genCode();
    const { data, error } = await supabase.from("gerants").insert({
      nom: newGerant.nom, spot_id: newGerant.spot_id, code_acces: code, actif: true,
    }).select().single();
    if (error) { alert("Erreur : " + error.message); setSaving(false); return; }
    setNewGerant({ nom: "", spot_id: "" });
    setShowForm(false);
    await load();
    if (data?.id) setCodeVisible(data.id);
    setSaving(false);
  };

  const toggleActif     = async (g) => { await supabase.from("gerants").update({ actif: !g.actif }).eq("id", g.id); load(); };
  const supprimerGerant = async (id) => { if (!window.confirm("Révoquer l'accès de ce gérant ?")) return; await supabase.from("gerants").delete().eq("id", id); load(); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>PANNEAU</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Accès Gérants</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={S.btnGold}>+ NOUVEAU</button>
      </div>

      {showForm && (
        <div style={{ ...S.card, borderRadius: 18, padding: 20, marginBottom: 20, border: "0.5px solid rgba(200,146,10,0.35)" }}>
          <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 14 }}>CRÉER UN ACCÈS GÉRANT</p>
          <label style={S.label}>NOM DU GÉRANT</label>
          <input placeholder="Ex : Rakoto Jean" value={newGerant.nom} onChange={e => setNewGerant({ ...newGerant, nom: e.target.value })} style={S.input} />
          <label style={S.label}>SPOT ASSOCIÉ</label>
          <select value={newGerant.spot_id} onChange={e => setNewGerant({ ...newGerant, spot_id: e.target.value })} style={{ ...S.input, appearance: "none" }}>
            <option value="">Sélectionner un spot...</option>
            {spots.map(s => <option key={s.id} value={s.id}>{s.nom} — {s.ville}</option>)}
          </select>
          <div style={{ background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: "#C8920A", lineHeight: 1.5 }}>
              🔑 Code WAYZA-XXXX-XXXX généré automatiquement.<br />
              Accès console gérant : 27 jours standard.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={creerGerant} disabled={saving} style={{ ...S.btnGold, flex: 1, padding: "12px 0", opacity: saving ? 0.6 : 1 }}>
              {saving ? "CRÉATION..." : "✓ GÉNÉRER L'ACCÈS"}
            </button>
            <button onClick={() => setShowForm(false)} style={{ ...S.btnGhost, flex: 1, padding: "12px 0" }}>ANNULER</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : gerants.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucun gérant créé.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {gerants.map(g => (
              <div key={g.id} style={{ ...S.card, borderLeft: `3px solid ${g.actif ? "#C8920A" : "rgba(255,255,255,0.1)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{g.nom}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, color: g.actif ? "#2ECC8A" : "rgba(244,247,247,0.25)" }}>{g.actif ? "● ACTIF" : "● RÉVOQUÉ"}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#C8920A" }}>📍 {g.spots?.nom} — {g.spots?.ville}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <button onClick={() => setCodeVisible(codeVisible === g.id ? null : g.id)} style={{ background: "rgba(200,146,10,0.12)", color: "#C8920A", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                      {codeVisible === g.id ? "CACHER" : "VOIR CODE"}
                    </button>
                    <button onClick={() => toggleActif(g)} style={{ background: g.actif ? "rgba(231,76,60,0.1)" : "rgba(46,204,138,0.1)", color: g.actif ? "#E74C3C" : "#2ECC8A", border: `0.5px solid ${g.actif ? "rgba(231,76,60,0.3)" : "rgba(46,204,138,0.3)"}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                      {g.actif ? "RÉVOQUER" : "RÉACTIVER"}
                    </button>
                    <button onClick={() => supprimerGerant(g.id)} style={{ background: "rgba(231,76,60,0.08)", color: "#E74C3C", border: "0.5px solid rgba(231,76,60,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 10 }}>SUPPR.</button>
                  </div>
                </div>
                {codeVisible === g.id && (
                  <div style={{ background: "rgba(200,146,10,0.1)", border: "0.5px solid rgba(200,146,10,0.4)", borderRadius: 10, padding: "10px 14px", marginTop: 10 }}>
                    <p style={{ fontSize: 9, color: "rgba(200,146,10,0.7)", letterSpacing: "0.2em", marginBottom: 4 }}>CODE D'ACCÈS GÉRANT</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#E8B840", letterSpacing: "0.15em", fontFamily: "monospace" }}>{g.code_acces}</p>
                    <p style={{ fontSize: 9, color: "rgba(244,247,247,0.35)", marginTop: 4 }}>À transmettre au gérant uniquement — ne pas partager.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

// ─── SECTION RÉSERVATIONS ─────────────────────────────────────
const ResasSection = () => {
  const [resas,   setResas] = useState([]);
  const [loading, setLoad]  = useState(true);

  const loadResas = async () => {
    setLoad(true);
    const { data } = await supabase.from("reservations").select("*").order("created_at", { ascending: false }).limit(50);
    setResas(data || []);
    setLoad(false);
  };
  useEffect(() => { loadResas(); }, []);

  const updateStatut = async (id, statut) => { await supabase.from("reservations").update({ statut }).eq("id", id); loadResas(); };
  const statutColor  = { en_attente: "#C8920A", confirmee: "#2ECC8A", annulee: "#E74C3C" };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>PANNEAU</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Réservations</h2>
      </div>
      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : resas.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucune réservation.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {resas.map(r => (
              <div key={r.id} style={{ ...S.card, borderLeft: `3px solid ${statutColor[r.statut] || "#C8920A"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{r.client_nom}</p>
                    <p style={{ fontSize: 11, color: "#C8920A" }}>{r.spot_nom}</p>
                    <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", marginTop: 2 }}>{r.date_reservation} à {r.heure} · {r.personnes} pers.</p>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: statutColor[r.statut], letterSpacing: "0.1em", background: `${statutColor[r.statut]}20`, padding: "3px 8px", borderRadius: 10 }}>
                    {r.statut?.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                {r.statut === "en_attente" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => updateStatut(r.id, "confirmee")} style={{ flex: 1, background: "rgba(46,204,138,0.15)", color: "#2ECC8A", border: "0.5px solid rgba(46,204,138,0.3)", borderRadius: 8, padding: "6px 0", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>CONFIRMER</button>
                    <button onClick={() => updateStatut(r.id, "annulee")}  style={{ flex: 1, background: "rgba(231,76,60,0.15)",  color: "#E74C3C", border: "0.5px solid rgba(231,76,60,0.3)",  borderRadius: 8, padding: "6px 0", cursor: "pointer", fontSize: 11 }}>ANNULER</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

// ─── CONSOLE ADMIN PRINCIPALE ─────────────────────────────────
export default function AdminConsole() {
  const [logged,  setLogged]  = useState(false);
  const [section, setSection] = useState("demandes");
  const [nbDemandes, setNbDemandes] = useState(0);

  // Badge compteur demandes en attente
  useEffect(() => {
    if (!logged) return;
    const check = async () => {
      const { count } = await supabase
        .from("ads_regie")
        .select("*", { count: "exact", head: true })
        .eq("actif", false)
        .in("statut_demande", ["en_attente", "en_production"]);
      setNbDemandes(count || 0);
    };
    check();
  }, [logged, section]);

  if (!logged) return <AdminLogin onLogin={() => setLogged(true)} />;

  const sections = [
    { id: "demandes", label: "Demandes",     icon: "🔔", badge: nbDemandes },
    { id: "regie",    label: "Régie",         icon: "📢" },
    { id: "comptes",  label: "Spots",          icon: "📍" },
    { id: "gerants",  label: "Gérants",        icon: "🔑" },
    { id: "resas",    label: "Réservations",   icon: "📅" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0D2B30", color: "#F4F7F7", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { display: none; }`}</style>

      <div style={{ background: "#000", borderBottom: "0.5px solid rgba(200,146,10,0.3)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 8, color: "#C8920A", letterSpacing: "0.4em", fontFamily: "Arial" }}>ACCÈS ADMIN</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>WAYZA <span style={{ color: "#C8920A" }}>ADMIN</span></h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: "#C8920A", fontWeight: 700 }}>Mandimbimanana</p>
          <button onClick={() => setLogged(false)} style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", background: "none", border: "none", cursor: "pointer" }}>Se déconnecter</button>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "0.5px solid rgba(200,146,10,0.15)", overflowX: "auto", background: "rgba(0,0,0,0.3)" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            flex: 1, minWidth: 64, padding: "12px 6px", background: "none", border: "none",
            borderBottom: section === s.id ? "2px solid #C8920A" : "2px solid transparent",
            color: section === s.id ? "#C8920A" : "rgba(244,247,247,0.4)",
            cursor: "pointer", fontFamily: "Arial", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.06em", whiteSpace: "nowrap", position: "relative",
          }}>
            {s.icon} {s.label}
            {s.badge > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 6,
                background: "#E74C3C", color: "#fff",
                fontSize: 8, fontWeight: 800,
                width: 14, height: 14, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{s.badge > 9 ? "9+" : s.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 640, margin: "0 auto" }}>
        {section === "demandes" && <DemandesSection />}
        {section === "regie"    && <RegieSection />}
        {section === "comptes"  && <ComptesSection />}
        {section === "gerants"  && <GerantsSection />}
        {section === "resas"    && <ResasSection />}
      </div>
    </div>
  );
}
