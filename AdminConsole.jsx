// ============================================================
//  WAYZA 2026 — Console Admin Mandimbimanana
//  Gestion Régie Pub + Validation Comptes + Upload Images
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { compressToWebP } from "./WayzaApp";

const SUPABASE_URL  = "https://qmoesstuwetdugjgqbyl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtb2Vzc3R1d2V0ZHVnamdxYnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTEyODMsImV4cCI6MjA5MjA2NzI4M30.yUMqnecvSjz3w8Ug1_dek7HR7kZILq4VeSgiZga_bn0";
const ADMIN_PASSWORD = "WAYZA_ADMIN_2026"; // À remplacer par auth Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── AUTH SIMPLE ──────────────────────────────────────────────
const AdminLogin = ({ onLogin }) => {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => {
    if (pwd === ADMIN_PASSWORD) onLogin();
    else setErr(true);
  };
  return (
    <div style={{ minHeight: "100vh", background: "#0D2B30", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 24, padding: 32 }}>
        <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.4em", fontFamily: "Arial", marginBottom: 6 }}>ACCÈS RESTREINT</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7", marginBottom: 8 }}>Console <span style={{ color: "#C8920A" }}>Admin</span></h1>
        <p style={{ fontSize: 12, color: "rgba(244,247,247,0.4)", marginBottom: 24 }}>Réservé à Mandimbimanana</p>
        <input
          type="password"
          placeholder="Mot de passe admin"
          value={pwd}
          onChange={e => { setPwd(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `0.5px solid ${err ? "#E74C3C" : "rgba(200,146,10,0.3)"}`, borderRadius: 12, padding: "12px 16px", color: "#F4F7F7", fontSize: 14, outline: "none", fontFamily: "Arial", marginBottom: 8 }}
        />
        {err && <p style={{ fontSize: 11, color: "#E74C3C", marginBottom: 8 }}>Mot de passe incorrect</p>}
        <button onClick={submit} style={{ width: "100%", background: "#C8920A", color: "#0D2B30", border: "none", borderRadius: 12, padding: "14px 0", fontWeight: 800, fontSize: 13, cursor: "pointer", letterSpacing: "0.12em" }}>
          ENTRER
        </button>
      </div>
    </div>
  );
};

// ─── UPLOAD IMAGE AVEC COMPRESSION ───────────────────────────
const ImageUploader = ({ onUploaded, bucket = "wayza-ads", label = "Image publicitaire" }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [info, setInfo]   = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setInfo("Compression en cours...");
    try {
      const compressed = await compressToWebP(file, 100);
      const kb = Math.round(compressed.size / 1024);
      setInfo(`✓ Compressé : ${kb} Ko (WebP)`);
      setPreview(URL.createObjectURL(compressed));

      const path = `${Date.now()}_${compressed.name}`;
      const { data, error } = await supabase.storage.from(bucket).upload(path, compressed, { contentType: "image/webp" });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
      onUploaded(publicUrl);
      setInfo(`✓ Uploadé (${kb} Ko) — prêt`);
    } catch (err) {
      setInfo("Erreur upload : " + err.message);
    }
    setUploading(false);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.2em", display: "block", marginBottom: 6 }}>{label.toUpperCase()}</label>
      <div
        onClick={() => inputRef.current.click()}
        style={{ border: "1px dashed rgba(200,146,10,0.4)", borderRadius: 12, overflow: "hidden", cursor: "pointer", minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
      >
        {preview ? (
          <img src={preview} style={{ width: "100%", height: 120, objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", padding: 16 }}>
            <p style={{ fontSize: 20, marginBottom: 4 }}>📁</p>
            <p style={{ fontSize: 11, color: "rgba(244,247,247,0.4)" }}>Cliquez pour sélectionner</p>
            <p style={{ fontSize: 10, color: "rgba(244,247,247,0.25)" }}>Auto-compression WebP &lt; 100 Ko</p>
          </div>
        )}
        {uploading && <div style={{ position: "absolute", inset: 0, background: "rgba(13,43,48,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      {info && <p style={{ fontSize: 10, color: "#C8920A", marginTop: 4 }}>{info}</p>}
    </div>
  );
};

// ─── FORMULAIRE PUB ───────────────────────────────────────────
const AdForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || {
    type: "force_frappe", titre: "", texte: "", lien_wa: "", cta: "RÉSERVER SUR WHATSAPP",
    image_url: "", date_debut: "", date_fin: "", actif: true,
  });

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(200,146,10,0.3)",
    borderRadius: 10, padding: "10px 14px", color: "#F4F7F7", fontSize: 13,
    fontFamily: "Arial", outline: "none", marginBottom: 10,
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(200,146,10,0.2)", borderRadius: 18, padding: 20, marginBottom: 16 }}>
      <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 14 }}>
        {initial ? "MODIFIER LA PUB" : "NOUVELLE PUB"}
      </p>

      {/* Type */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        {[
          { v: "force_frappe", l: "Force Frappe", p: "200k Ar/j" },
          { v: "banniere",     l: "Bannière",     p: "50k Ar/m" },
          { v: "ticker",       l: "Ticker Or",    p: "2k Ar/j" },
        ].map(t => (
          <button key={t.v} onClick={() => setForm({ ...form, type: t.v })} style={{
            padding: "8px 6px", borderRadius: 10, cursor: "pointer", fontFamily: "Arial",
            background: form.type === t.v ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: form.type === t.v ? "#0D2B30" : "rgba(244,247,247,0.5)",
            border: form.type === t.v ? "none" : "0.5px solid rgba(255,255,255,0.1)",
            fontSize: 10, fontWeight: 700,
          }}>
            {t.l}<br /><span style={{ fontSize: 9, fontWeight: 400 }}>{t.p}</span>
          </button>
        ))}
      </div>

      <input placeholder="Titre / Nom du partenaire" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={inputStyle} />
      <textarea placeholder="Texte (slogan, message...)" value={form.texte} onChange={e => setForm({ ...form, texte: e.target.value })} style={{ ...inputStyle, height: 60, resize: "none" }} />
      <input placeholder="Numéro WhatsApp (+261...)" value={form.lien_wa} onChange={e => setForm({ ...form, lien_wa: e.target.value })} style={inputStyle} />
      <input placeholder='Texte bouton (ex: "RÉSERVER")' value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} style={inputStyle} />

      {/* Upload image — réservé à Mandimbimanana */}
      {form.type !== "ticker" && (
        <ImageUploader
          onUploaded={url => setForm({ ...form, image_url: url })}
          bucket="wayza-ads"
          label={form.type === "force_frappe" ? "Créa Force Frappe (plein écran)" : "Créa Bannière"}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", display: "block", marginBottom: 4 }}>DATE DÉBUT</label>
          <input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} style={{ ...inputStyle, marginBottom: 0, colorScheme: "dark" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", display: "block", marginBottom: 4 }}>DATE FIN</label>
          <input type="date" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} style={{ ...inputStyle, marginBottom: 0, colorScheme: "dark" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onSave(form)} style={{ flex: 1, background: "#C8920A", color: "#0D2B30", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>ENREGISTRER</button>
        <button onClick={onCancel} style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "rgba(244,247,247,0.5)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 0", cursor: "pointer", fontSize: 12 }}>ANNULER</button>
      </div>
    </div>
  );
};

// ─── SECTION RÉGIE ────────────────────────────────────────────
const RegieSection = () => {
  const [ads, setAds]           = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editAd, setEditAd]     = useState(null);
  const [loading, setLoading]   = useState(true);

  const loadAds = async () => {
    setLoading(true);
    const { data } = await supabase.from("ads_regie").select("*").order("created_at", { ascending: false });
    setAds(data || []);
    setLoading(false);
  };

  useEffect(() => { loadAds(); }, []);

  const saveAd = async (form) => {
    if (editAd) {
      await supabase.from("ads_regie").update(form).eq("id", editAd.id);
    } else {
      await supabase.from("ads_regie").insert(form);
    }
    setShowForm(false); setEditAd(null);
    loadAds();
  };

  const toggleActif = async (ad) => {
    await supabase.from("ads_regie").update({ actif: !ad.actif }).eq("id", ad.id);
    loadAds();
  };

  const deleteAd = async (id) => {
    if (!window.confirm("Supprimer cette pub ?")) return;
    await supabase.from("ads_regie").delete().eq("id", id);
    loadAds();
  };

  const typeLabel = { force_frappe: "Force Frappe", banniere: "Bannière", ticker: "Ticker Or" };
  const typeColor = { force_frappe: "#C8920A", banniere: "#1A4A6B", ticker: "#1B6B4A" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>PANNEAU</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Régie Publicitaire</h2>
        </div>
        <button onClick={() => { setShowForm(true); setEditAd(null); }} style={{ background: "#C8920A", color: "#0D2B30", border: "none", borderRadius: 10, padding: "8px 16px", fontWeight: 800, cursor: "pointer", fontSize: 11 }}>+ NOUVELLE PUB</button>
      </div>

      {showForm && <AdForm initial={editAd} onSave={saveAd} onCancel={() => { setShowForm(false); setEditAd(null); }} />}

      {loading ? (
        <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
      ) : ads.length === 0 ? (
        <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucune pub créée.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ads.map(ad => (
            <div key={ad.id} style={{
              background: "rgba(255,255,255,0.03)",
              border: `0.5px solid ${typeColor[ad.type] || "#C8920A"}40`,
              borderLeft: `3px solid ${typeColor[ad.type] || "#C8920A"}`,
              borderRadius: 14, padding: "14px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: typeColor[ad.type], letterSpacing: "0.1em", background: `${typeColor[ad.type]}20`, padding: "2px 8px", borderRadius: 10 }}>
                    {typeLabel[ad.type]}
                  </span>
                  <span style={{ fontSize: 9, color: ad.actif ? "#2ECC8A" : "rgba(244,247,247,0.25)", fontWeight: 700 }}>
                    {ad.actif ? "● ACTIF" : "● INACTIF"}
                  </span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#F4F7F7", marginBottom: 2 }}>{ad.titre}</p>
                <p style={{ fontSize: 11, color: "rgba(244,247,247,0.4)" }}>{ad.date_debut} → {ad.date_fin}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => toggleActif(ad)} style={{
                  background: ad.actif ? "rgba(231,76,60,0.15)" : "rgba(46,204,138,0.15)",
                  color: ad.actif ? "#E74C3C" : "#2ECC8A",
                  border: `0.5px solid ${ad.actif ? "rgba(231,76,60,0.3)" : "rgba(46,204,138,0.3)"}`,
                  borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 700,
                }}>{ad.actif ? "PAUSE" : "ACTIVER"}</button>
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

// ─── SECTION COMPTES ──────────────────────────────────────────
const ComptesSection = () => {
  const [spots, setSpots]   = useState([]);
  const [loading, setLoad]  = useState(true);

  const loadSpots = async () => {
    setLoad(true);
    const { data } = await supabase.from("spots").select("*").order("nom");
    setSpots(data || []);
    setLoad(false);
  };

  useEffect(() => { loadSpots(); }, []);

  const togglePass = async (spot) => {
    const newPass = spot.pass === "Gold" ? "Standard" : "Gold";
    await supabase.from("spots").update({ pass: newPass }).eq("id", spot.id);
    loadSpots();
  };

  const toggleStatut = async (spot) => {
    const newStatut = spot.statut === "libre" ? "complet" : "libre";
    await supabase.from("spots").update({ statut: newStatut }).eq("id", spot.id);
    loadSpots();
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>PANNEAU</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Gestion des Comptes</h2>
      </div>
      {loading ? (
        <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
      ) : spots.length === 0 ? (
        <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucun spot en base. Les données statiques sont affichées dans l'app.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {spots.map(s => (
            <div key={s.id} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(200,146,10,0.15)", borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{s.nom}</p>
                <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.1em" }}>{s.ville}</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => togglePass(s)} style={{
                  padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700,
                  background: s.pass === "Gold" ? "rgba(200,146,10,0.2)" : "rgba(255,255,255,0.05)",
                  color: s.pass === "Gold" ? "#C8920A" : "rgba(244,247,247,0.4)",
                  border: s.pass === "Gold" ? "0.5px solid rgba(200,146,10,0.4)" : "0.5px solid rgba(255,255,255,0.1)",
                }}>{s.pass}</button>
                <button onClick={() => toggleStatut(s)} style={{
                  padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700,
                  background: s.statut === "libre" ? "rgba(46,204,138,0.15)" : "rgba(231,76,60,0.15)",
                  color: s.statut === "libre" ? "#2ECC8A" : "#E74C3C",
                  border: s.statut === "libre" ? "0.5px solid rgba(46,204,138,0.3)" : "0.5px solid rgba(231,76,60,0.3)",
                }}>{s.statut || "libre"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SECTION RÉSERVATIONS ─────────────────────────────────────
const ResasSection = () => {
  const [resas, setResas] = useState([]);
  const [loading, setLoad] = useState(true);

  const loadResas = async () => {
    setLoad(true);
    const { data } = await supabase.from("reservations").select("*").order("created_at", { ascending: false }).limit(50);
    setResas(data || []);
    setLoad(false);
  };

  useEffect(() => { loadResas(); }, []);

  const updateStatut = async (id, statut) => {
    await supabase.from("reservations").update({ statut }).eq("id", id);
    loadResas();
  };

  const statutColor = { en_attente: "#C8920A", confirmee: "#2ECC8A", annulee: "#E74C3C" };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2 }}>PANNEAU</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Réservations</h2>
      </div>
      {loading ? (
        <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
      ) : resas.length === 0 ? (
        <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucune réservation.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {resas.map(r => (
            <div key={r.id} style={{ background: "rgba(255,255,255,0.03)", border: `0.5px solid ${statutColor[r.statut] || "#C8920A"}30`, borderLeft: `3px solid ${statutColor[r.statut] || "#C8920A"}`, borderRadius: 14, padding: "12px 16px" }}>
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
                  <button onClick={() => updateStatut(r.id, "annulee")} style={{ flex: 1, background: "rgba(231,76,60,0.15)", color: "#E74C3C", border: "0.5px solid rgba(231,76,60,0.3)", borderRadius: 8, padding: "6px 0", cursor: "pointer", fontSize: 11 }}>ANNULER</button>
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
  const [logged, setLogged] = useState(false);
  const [section, setSection] = useState("regie");

  if (!logged) return <AdminLogin onLogin={() => setLogged(true)} />;

  const sections = [
    { id: "regie",    label: "Régie",         icon: "📢" },
    { id: "comptes",  label: "Comptes",        icon: "👥" },
    { id: "resas",    label: "Réservations",   icon: "📅" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0D2B30", color: "#F4F7F7", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { display: none; }`}</style>

      {/* Header admin */}
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

      {/* Nav sections */}
      <div style={{ display: "flex", gap: 0, borderBottom: "0.5px solid rgba(200,146,10,0.15)", overflowX: "auto", background: "rgba(0,0,0,0.3)" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            flex: 1, padding: "12px 16px", background: "none", border: "none",
            borderBottom: section === s.id ? "2px solid #C8920A" : "2px solid transparent",
            color: section === s.id ? "#C8920A" : "rgba(244,247,247,0.4)",
            cursor: "pointer", fontFamily: "Arial", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", whiteSpace: "nowrap",
          }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
        {section === "regie"   && <RegieSection />}
        {section === "comptes" && <ComptesSection />}
        {section === "resas"   && <ResasSection />}
      </div>
    </div>
  );
}
