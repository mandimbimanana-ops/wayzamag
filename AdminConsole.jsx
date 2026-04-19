// ============================================================
//  WAYZA 2026 — Console Admin Mandimbimanana
//  v8 — Complet : Paramètres, Articles, Urgences,
//       Spots (validation + Premium), Gérants,
//       Régie, Demandes, Réservations
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://qmoesstuwetdugjgqbyl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtb2Vzc3R1d2V0ZHVnamdxYnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTEyODMsImV4cCI6MjA5MjA2NzI4M30.yUMqnecvSjz3w8Ug1_dek7HR7kZILq4VeSgiZga_bn0";
const ADMIN_PASSWORD    = "WAYZA_ADMIN_2026";
const supabase          = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── HELPERS ─────────────────────────────────────────────────
function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `WAYZA-${seg(4)}-${seg(4)}`;
}
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
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

// ─── STYLES ───────────────────────────────────────────────────
const S = {
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 10,
    padding: "10px 14px", color: "#F4F7F7", fontSize: 13,
    fontFamily: "Georgia, serif", outline: "none", marginBottom: 10,
    boxSizing: "border-box",
  },
  label: {
    fontSize: 9, color: "#C8920A", letterSpacing: "0.25em",
    fontWeight: 700, display: "block", marginBottom: 5, fontFamily: "Arial",
  },
  btnGold: {
    background: "#C8920A", color: "#0D2B30", border: "none",
    borderRadius: 10, padding: "10px 18px", fontWeight: 800,
    cursor: "pointer", fontSize: 11, letterSpacing: "0.08em", fontFamily: "Arial",
  },
  btnGhost: {
    background: "rgba(255,255,255,0.05)", color: "rgba(244,247,247,0.5)",
    border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 10,
    padding: "10px 18px", cursor: "pointer", fontSize: 11, fontFamily: "Arial",
  },
  btnDanger: {
    background: "rgba(231,76,60,0.1)", color: "#E74C3C",
    border: "0.5px solid rgba(231,76,60,0.3)", borderRadius: 8,
    padding: "6px 12px", cursor: "pointer", fontSize: 10, fontFamily: "Arial",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(200,146,10,0.15)",
    borderRadius: 14, padding: "14px 16px",
  },
  toggle: (on) => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    background: on ? "rgba(46,204,138,0.15)" : "rgba(231,76,60,0.1)",
    color: on ? "#2ECC8A" : "#E74C3C",
    border: `0.5px solid ${on ? "rgba(46,204,138,0.3)" : "rgba(231,76,60,0.3)"}`,
    borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "Arial",
  }),
};

// ─── IMAGE UPLOADER ───────────────────────────────────────────
const ImageUploader = ({ onUploaded, bucket = "wayza-ads", label = "Image", initialUrl = null, multiple = false, onMultiUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(initialUrl);
  const [info,      setInfo]      = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setInfo("Compression...");
    try {
      const urls = [];
      for (const file of files) {
        const compressed = await compressToWebP(file, 100);
        const kb = Math.round(compressed.size / 1024);
        const path = `${Date.now()}_${Math.random().toString(36).slice(2)}_${compressed.name}`;
        const { data, error } = await supabase.storage.from(bucket).upload(path, compressed, { contentType: "image/webp" });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
        urls.push(publicUrl);
        if (!multiple) { setPreview(publicUrl); onUploaded && onUploaded(publicUrl); }
      }
      if (multiple && onMultiUploaded) onMultiUploaded(urls);
      setInfo(`✓ ${files.length > 1 ? files.length + " images" : "1 image"} uploadée(s)`);
    } catch (err) { setInfo("Erreur : " + err.message); }
    setUploading(false);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label.toUpperCase()}</label>
      <div onClick={() => inputRef.current.click()} style={{
        border: "1px dashed rgba(200,146,10,0.4)", borderRadius: 12,
        overflow: "hidden", cursor: "pointer", minHeight: 72,
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
      }}>
        {preview
          ? <img src={preview} style={{ width: "100%", height: 120, objectFit: "cover" }} alt="preview" />
          : <div style={{ textAlign: "center", padding: 16 }}>
              <p style={{ fontSize: 20, marginBottom: 4 }}>📁</p>
              <p style={{ fontSize: 11, color: "rgba(244,247,247,0.4)" }}>{multiple ? "Cliquez pour sélectionner (plusieurs possibles)" : "Cliquez pour sélectionner"}</p>
              <p style={{ fontSize: 10, color: "rgba(244,247,247,0.25)" }}>Auto-compression WebP &lt; 100 Ko</p>
            </div>
        }
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(13,43,48,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#C8920A", fontSize: 12 }}>Upload...</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} onChange={handleFile} style={{ display: "none" }} />
      {info && <p style={{ fontSize: 10, color: "#C8920A", marginTop: 4 }}>{info}</p>}
    </div>
  );
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
        <h1 style={{ fontSize: 26, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7", marginBottom: 8 }}>
          Console <span style={{ color: "#C8920A" }}>Admin</span>
        </h1>
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

// ─── SECTION PARAMÈTRES ───────────────────────────────────────
const ParametresSection = () => {
  const [params,  setParams]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [pdfInfo, setPdfInfo] = useState(null);
  const pdfRef = useRef();

  const CHAMPS = [
    { cle: "telephone",   label: "Téléphone",   placeholder: "+261 XX XX XXX XX", icon: "📞" },
    { cle: "whatsapp",    label: "WhatsApp",    placeholder: "+261 XX XX XXX XX", icon: "💬" },
    { cle: "email",       label: "Email",        placeholder: "contact@wayza.mg",  icon: "📧" },
    { cle: "facebook",    label: "Facebook",     placeholder: "https://facebook.com/wayza", icon: "📘" },
    { cle: "instagram",   label: "Instagram",    placeholder: "@wayza_madagascar", icon: "📸" },
    { cle: "site_web",    label: "Site Web",     placeholder: "https://wayza.mg",  icon: "🌐" },
  ];

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("parametres").select("*");
      const map = {};
      (data || []).forEach(p => { map[p.cle] = p.valeur; });
      setParams(map);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    for (const [cle, valeur] of Object.entries(params)) {
      await supabase.from("parametres").upsert({ cle, valeur, updated_at: new Date().toISOString() }, { onConflict: "cle" });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfInfo("Upload PDF...");
    const path = `offres_annonceurs_${Date.now()}.pdf`;
    const { data, error } = await supabase.storage.from("wayza-ads").upload(path, file, { contentType: "application/pdf", upsert: true });
    if (error) { setPdfInfo("Erreur : " + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("wayza-ads").getPublicUrl(data.path);
    setParams(p => ({ ...p, pdf_annonceurs: publicUrl }));
    await supabase.from("parametres").upsert({ cle: "pdf_annonceurs", valeur: publicUrl, updated_at: new Date().toISOString() }, { onConflict: "cle" });
    setPdfInfo("✓ PDF uploadé et enregistré");
  };

  if (loading) return <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2, fontFamily: "Arial" }}>PANNEAU</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Paramètres WAYZA</h2>
        <p style={{ fontSize: 11, color: "rgba(244,247,247,0.35)", marginTop: 4 }}>Ces infos s'affichent dans la page Contacts de l'app.</p>
      </div>

      {CHAMPS.map(({ cle, label, placeholder, icon }) => (
        <div key={cle}>
          <label style={S.label}>{icon} {label.toUpperCase()}</label>
          <input
            placeholder={placeholder}
            value={params[cle] || ""}
            onChange={e => setParams(p => ({ ...p, [cle]: e.target.value }))}
            style={S.input}
          />
        </div>
      ))}

      <div style={{ ...S.card, marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.2em", marginBottom: 8, fontFamily: "Arial", fontWeight: 700 }}>📄 PDF OFFRES ANNONCEURS</p>
        {params.pdf_annonceurs && (
          <a href={params.pdf_annonceurs} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#C8920A", display: "block", marginBottom: 8 }}>
            → Voir le PDF actuel
          </a>
        )}
        <button onClick={() => pdfRef.current.click()} style={{ ...S.btnGhost, fontSize: 11, padding: "8px 14px" }}>
          📁 Uploader un nouveau PDF
        </button>
        <input ref={pdfRef} type="file" accept="application/pdf" onChange={handlePdf} style={{ display: "none" }} />
        {pdfInfo && <p style={{ fontSize: 10, color: "#C8920A", marginTop: 6 }}>{pdfInfo}</p>}
      </div>

      <button onClick={save} disabled={saving} style={{ ...S.btnGold, width: "100%", padding: "14px 0", fontSize: 13 }}>
        {saving ? "ENREGISTREMENT..." : saved ? "✓ ENREGISTRÉ !" : "ENREGISTRER LES PARAMÈTRES"}
      </button>
    </div>
  );
};

// ─── SECTION ARTICLES WAYZ'MAG ────────────────────────────────
const ArticlesSection = () => {
  const [articles, setArticles] = useState([]);
  const [spots,    setSpots]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editArt,  setEditArt]  = useState(null);

  const EMPTY = {
    titre: "", sous_titre: "", contenu: "", categorie: "Lifestyle",
    region: "", spot_id: "", spot_nom: "", image_url: "", photos: [],
    date_parution: new Date().toISOString().split("T")[0], actif: false,
  };
  const [form, setForm] = useState(EMPTY);

  const CATS = ["Nature", "Nightlife", "Sport", "Culture", "Food", "Lifestyle", "Voyage", "Beauté"];

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from("articles").select("*").order("created_at", { ascending: false }),
      supabase.from("spots").select("id, nom, ville").order("nom"),
    ]);
    setArticles(a || []);
    setSpots(s || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(EMPTY); setEditArt(null); setShowForm(true); };
  const openEdit = (a) => { setForm({ ...a, photos: a.photos || [] }); setEditArt(a); setShowForm(true); };

  const save = async () => {
    const spotObj = spots.find(s => s.id === form.spot_id);
    const payload = { ...form, spot_nom: spotObj ? `${spotObj.nom} — ${spotObj.ville}` : "" };
    if (editArt) {
      await supabase.from("articles").update(payload).eq("id", editArt.id);
    } else {
      await supabase.from("articles").insert(payload);
    }
    setShowForm(false); load();
  };

  const toggleActif = async (a) => { await supabase.from("articles").update({ actif: !a.actif }).eq("id", a.id); load(); };
  const deleteArt   = async (id) => { if (!window.confirm("Supprimer cet article ?")) return; await supabase.from("articles").delete().eq("id", id); load(); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2, fontFamily: "Arial" }}>PANNEAU</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Wayz'Mag</h2>
        </div>
        <button onClick={openNew} style={S.btnGold}>+ ARTICLE</button>
      </div>

      {showForm && (
        <div style={{ ...S.card, border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 18, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 16, fontFamily: "Arial" }}>
            {editArt ? "MODIFIER L'ARTICLE" : "NOUVEL ARTICLE"}
          </p>

          <label style={S.label}>TITRE</label>
          <input placeholder="Titre de l'article" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={S.input} />

          <label style={S.label}>SOUS-TITRE</label>
          <input placeholder="Accroche ou sous-titre" value={form.sous_titre} onChange={e => setForm({ ...form, sous_titre: e.target.value })} style={S.input} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={S.label}>CATÉGORIE</label>
              <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} style={{ ...S.input, appearance: "none" }}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>RÉGION</label>
              <input placeholder="Ex: Nosy Be" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} style={S.input} />
            </div>
          </div>

          <label style={S.label}>SPOT LIÉ (optionnel)</label>
          <select value={form.spot_id} onChange={e => setForm({ ...form, spot_id: e.target.value })} style={{ ...S.input, appearance: "none" }}>
            <option value="">Aucun spot lié</option>
            {spots.map(s => <option key={s.id} value={s.id}>{s.nom} — {s.ville}</option>)}
          </select>

          <label style={S.label}>CONTENU</label>
          <textarea
            placeholder="Texte de l'article..."
            value={form.contenu}
            onChange={e => setForm({ ...form, contenu: e.target.value })}
            style={{ ...S.input, height: 160, resize: "vertical" }}
          />

          <label style={S.label}>DATE DE PARUTION</label>
          <input type="date" value={form.date_parution} onChange={e => setForm({ ...form, date_parution: e.target.value })} style={{ ...S.input, colorScheme: "dark" }} />

          <ImageUploader
            bucket="wayza-mag"
            label="Photo principale"
            initialUrl={form.image_url || null}
            onUploaded={url => setForm({ ...form, image_url: url })}
          />

          <ImageUploader
            bucket="wayza-mag"
            label="Galerie photos (plusieurs)"
            multiple={true}
            onMultiUploaded={urls => setForm({ ...form, photos: [...(form.photos || []), ...urls] })}
          />

          {form.photos?.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {form.photos.map((p, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={p} style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} alt="" />
                  <button onClick={() => setForm({ ...form, photos: form.photos.filter((_, j) => j !== i) })}
                    style={{ position: "absolute", top: -4, right: -4, background: "#E74C3C", color: "#fff", border: "none", borderRadius: "50%", width: 16, height: 16, fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <label style={{ ...S.label, marginBottom: 0 }}>STATUT</label>
            <button onClick={() => setForm({ ...form, actif: !form.actif })} style={S.toggle(form.actif)}>
              {form.actif ? "● PUBLIÉ" : "● BROUILLON"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} style={{ ...S.btnGold, flex: 1, padding: "12px 0" }}>ENREGISTRER</button>
            <button onClick={() => setShowForm(false)} style={{ ...S.btnGhost, flex: 1, padding: "12px 0" }}>ANNULER</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : articles.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucun article.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {articles.map(a => (
              <div key={a.id} style={{ ...S.card, borderLeft: `3px solid ${a.actif ? "#C8920A" : "rgba(255,255,255,0.1)"}` }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {a.image_url && <img src={a.image_url} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} alt="" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7", marginBottom: 2 }}>{a.titre}</p>
                        <p style={{ fontSize: 10, color: "#C8920A" }}>{a.categorie} · {a.region}</p>
                        <p style={{ fontSize: 10, color: "rgba(244,247,247,0.35)", marginTop: 2 }}>{a.date_parution}</p>
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                        color: a.actif ? "#2ECC8A" : "rgba(244,247,247,0.3)",
                        background: a.actif ? "rgba(46,204,138,0.15)" : "rgba(255,255,255,0.05)",
                        padding: "3px 8px", borderRadius: 10,
                      }}>{a.actif ? "PUBLIÉ" : "BROUILLON"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <button onClick={() => openEdit(a)} style={{ ...S.btnGhost, fontSize: 10, padding: "5px 12px" }}>✏️ MODIFIER</button>
                      <button onClick={() => toggleActif(a)} style={{ ...S.toggle(a.actif), fontSize: 10, padding: "5px 12px" }}>
                        {a.actif ? "DÉPUBLIER" : "PUBLIER"}
                      </button>
                      <button onClick={() => deleteArt(a.id)} style={{ ...S.btnDanger, padding: "5px 10px" }}>🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

// ─── SECTION URGENCES ─────────────────────────────────────────
const UrgencesSection = () => {
  const [urgences, setUrgences] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUrg,  setEditUrg]  = useState(null);
  const [filtre,   setFiltre]   = useState("tous");

  const EMPTY = { nom: "", categorie: "sante", telephone: "", adresse: "", ville: "", region: "", disponible_24h: false, actif: true };
  const [form, setForm] = useState(EMPTY);

  const CATS = [
    { v: "sante",     l: "🏥 Santé",       desc: "Hôpitaux, cliniques, SAMU, pharmacies" },
    { v: "securite",  l: "🚔 Sécurité",    desc: "Police, gendarmerie, pompiers" },
    { v: "ambassade", l: "🏛️ Ambassades",  desc: "Représentations diplomatiques" },
    { v: "autre",     l: "⚡ Autre",        desc: "Autres contacts d'urgence" },
  ];

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("urgences").select("*").order("categorie").order("nom");
    setUrgences(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(EMPTY); setEditUrg(null); setShowForm(true); };
  const openEdit = (u) => { setForm(u); setEditUrg(u); setShowForm(true); };

  const save = async () => {
    if (editUrg) { await supabase.from("urgences").update(form).eq("id", editUrg.id); }
    else { await supabase.from("urgences").insert(form); }
    setShowForm(false); load();
  };

  const toggleActif = async (u) => { await supabase.from("urgences").update({ actif: !u.actif }).eq("id", u.id); load(); };
  const deleteUrg   = async (id) => { if (!window.confirm("Supprimer ?")) return; await supabase.from("urgences").delete().eq("id", id); load(); };

  const catColor = { sante: "#2ECC8A", securite: "#3498DB", ambassade: "#C8920A", autre: "#E74C3C" };
  const filtered = filtre === "tous" ? urgences : urgences.filter(u => u.categorie === filtre);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2, fontFamily: "Arial" }}>PANNEAU</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Urgences</h2>
        </div>
        <button onClick={openNew} style={S.btnGold}>+ AJOUTER</button>
      </div>

      {/* Filtre catégories */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ v: "tous", l: "Tous" }, ...CATS].map(c => (
          <button key={c.v} onClick={() => setFiltre(c.v)} style={{
            padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 10, fontFamily: "Arial", fontWeight: 700,
            background: filtre === c.v ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: filtre === c.v ? "#0D2B30" : "rgba(244,247,247,0.5)",
            border: filtre === c.v ? "none" : "0.5px solid rgba(255,255,255,0.1)",
          }}>{c.l}</button>
        ))}
      </div>

      {showForm && (
        <div style={{ ...S.card, border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 18, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 16, fontFamily: "Arial" }}>
            {editUrg ? "MODIFIER" : "NOUVELLE FICHE URGENCE"}
          </p>

          <label style={S.label}>CATÉGORIE</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {CATS.map(c => (
              <button key={c.v} onClick={() => setForm({ ...form, categorie: c.v })} style={{
                padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                background: form.categorie === c.v ? `${catColor[c.v]}20` : "rgba(255,255,255,0.03)",
                border: `0.5px solid ${form.categorie === c.v ? catColor[c.v] : "rgba(255,255,255,0.08)"}`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: form.categorie === c.v ? catColor[c.v] : "rgba(244,247,247,0.6)", marginBottom: 2 }}>{c.l}</p>
                <p style={{ fontSize: 9, color: "rgba(244,247,247,0.3)" }}>{c.desc}</p>
              </button>
            ))}
          </div>

          <label style={S.label}>NOM</label>
          <input placeholder="Ex: CHU Joseph Ravoahangy Andrianavalona" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={S.input} />

          <label style={S.label}>TÉLÉPHONE</label>
          <input placeholder="+261 XX XX XXX XX" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={S.input} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={S.label}>VILLE</label>
              <input placeholder="Ex: Antananarivo" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} style={S.input} />
            </div>
            <div>
              <label style={S.label}>RÉGION</label>
              <input placeholder="Ex: Analamanga" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} style={S.input} />
            </div>
          </div>

          <label style={S.label}>ADRESSE</label>
          <input placeholder="Adresse complète" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} style={S.input} />

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>DISPONIBLE 24H/24</label>
              <button onClick={() => setForm({ ...form, disponible_24h: !form.disponible_24h })} style={S.toggle(form.disponible_24h)}>
                {form.disponible_24h ? "OUI" : "NON"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>ACTIF</label>
              <button onClick={() => setForm({ ...form, actif: !form.actif })} style={S.toggle(form.actif)}>
                {form.actif ? "OUI" : "NON"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} style={{ ...S.btnGold, flex: 1, padding: "12px 0" }}>ENREGISTRER</button>
            <button onClick={() => setShowForm(false)} style={{ ...S.btnGhost, flex: 1, padding: "12px 0" }}>ANNULER</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : filtered.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucune fiche.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(u => (
              <div key={u.id} style={{ ...S.card, borderLeft: `3px solid ${catColor[u.categorie] || "#C8920A"}`, opacity: u.actif ? 1 : 0.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7", marginBottom: 2 }}>{u.nom}</p>
                    <p style={{ fontSize: 10, color: catColor[u.categorie] }}>{CATS.find(c => c.v === u.categorie)?.l} · {u.ville}</p>
                    {u.telephone && <p style={{ fontSize: 11, color: "rgba(244,247,247,0.5)", marginTop: 2 }}>📞 {u.telephone}</p>}
                    {u.disponible_24h && <span style={{ fontSize: 9, fontWeight: 700, color: "#2ECC8A", background: "rgba(46,204,138,0.15)", padding: "2px 8px", borderRadius: 10, display: "inline-block", marginTop: 4 }}>24H/24</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <button onClick={() => openEdit(u)} style={{ ...S.btnGhost, fontSize: 10, padding: "4px 10px" }}>✏️</button>
                    <button onClick={() => toggleActif(u)} style={{ ...S.toggle(u.actif), fontSize: 10, padding: "4px 10px" }}>{u.actif ? "ON" : "OFF"}</button>
                    <button onClick={() => deleteUrg(u.id)} style={{ ...S.btnDanger, padding: "4px 8px" }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

// ─── SECTION SPOTS ────────────────────────────────────────────
const SpotsSection = () => {
  const [spots,    setSpots]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filtre,   setFiltre]   = useState("tous");
  const [editSpot, setEditSpot] = useState(null);
  const [offForm,  setOffForm]  = useState({ debut: "", duree: 27 });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("spots").select("*").order("created_at", { ascending: false });
    setSpots(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const valider    = async (s) => { await supabase.from("spots").update({ actif: true }).eq("id", s.id); load(); };
  const desactiver = async (s) => { await supabase.from("spots").update({ actif: false }).eq("id", s.id); load(); };
  const supprimer  = async (id) => { if (!window.confirm("Supprimer ce spot ?")) return; await supabase.from("spots").delete().eq("id", id); load(); };

  const activerPremium = async (s) => {
    if (!offForm.debut) return alert("Indiquez une date de début.");
    const fin = addDays(offForm.debut, parseInt(offForm.duree));
    await supabase.from("spots").update({ pass: "premium", date_debut: offForm.debut, date_fin: fin, actif: true }).eq("id", s.id);
    setEditSpot(null);
    load();
  };

  const passColor = { premium: "#C8920A", presence: "rgba(244,247,247,0.3)" };

  const filtered = filtre === "tous" ? spots
    : filtre === "attente" ? spots.filter(s => !s.actif)
    : filtre === "premium" ? spots.filter(s => s.pass === "premium" && s.actif)
    : spots.filter(s => s.pass === "presence" && s.actif);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2, fontFamily: "Arial" }}>PANNEAU</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Spots</h2>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { v: "tous",     l: `Tous (${spots.length})` },
          { v: "attente",  l: `En attente (${spots.filter(s => !s.actif).length})` },
          { v: "premium",  l: "Premium" },
          { v: "presence", l: "Présence" },
        ].map(f => (
          <button key={f.v} onClick={() => setFiltre(f.v)} style={{
            padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 10, fontFamily: "Arial", fontWeight: 700,
            background: filtre === f.v ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: filtre === f.v ? "#0D2B30" : "rgba(244,247,247,0.5)",
            border: filtre === f.v ? "none" : "0.5px solid rgba(255,255,255,0.1)",
          }}>{f.l}</button>
        ))}
      </div>

      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : filtered.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucun spot.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(s => (
              <div key={s.id} style={{ ...S.card, borderLeft: `3px solid ${s.actif ? passColor[s.pass] || "#C8920A" : "rgba(231,76,60,0.5)"}` }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {s.img && <img src={s.img} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} alt="" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{s.nom}</p>
                        <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)" }}>{s.cat} · {s.ville}, {s.region}</p>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: passColor[s.pass], background: `${passColor[s.pass]}20`, padding: "2px 8px", borderRadius: 10 }}>
                          {s.pass?.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: s.actif ? "#2ECC8A" : "#E74C3C", background: s.actif ? "rgba(46,204,138,0.15)" : "rgba(231,76,60,0.1)", padding: "2px 8px", borderRadius: 10 }}>
                          {s.actif ? "ACTIF" : "EN ATTENTE"}
                        </span>
                      </div>
                    </div>

                    {s.date_debut && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.35)", marginTop: 4 }}>📅 {s.date_debut} → {s.date_fin}</p>}
                    {s.wa && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.35)" }}>💬 {s.wa}</p>}

                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      {!s.actif && (
                        <button onClick={() => valider(s)} style={{ background: "rgba(46,204,138,0.15)", color: "#2ECC8A", border: "0.5px solid rgba(46,204,138,0.3)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "Arial" }}>
                          ✓ VALIDER
                        </button>
                      )}
                      {s.actif && s.pass !== "premium" && (
                        <button onClick={() => setEditSpot(editSpot === s.id ? null : s.id)} style={{ background: "rgba(200,146,10,0.15)", color: "#C8920A", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "Arial" }}>
                          ★ ACTIVER PREMIUM
                        </button>
                      )}
                      {s.actif && (
                        <button onClick={() => desactiver(s)} style={{ ...S.btnGhost, fontSize: 10, padding: "5px 10px" }}>DÉSACTIVER</button>
                      )}
                      <button onClick={() => supprimer(s.id)} style={{ ...S.btnDanger, padding: "5px 10px" }}>🗑</button>
                    </div>

                    {editSpot === s.id && (
                      <div style={{ background: "rgba(200,146,10,0.07)", border: "0.5px solid rgba(200,146,10,0.25)", borderRadius: 10, padding: 12, marginTop: 10 }}>
                        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.2em", marginBottom: 8, fontFamily: "Arial", fontWeight: 700 }}>ACTIVER PREMIUM — 20 000 Ar</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <div>
                            <label style={{ ...S.label, marginBottom: 3 }}>DÉBUT</label>
                            <input type="date" value={offForm.debut} onChange={e => setOffForm({ ...offForm, debut: e.target.value })} style={{ ...S.input, marginBottom: 0, colorScheme: "dark", fontSize: 11 }} />
                          </div>
                          <div>
                            <label style={{ ...S.label, marginBottom: 3 }}>DURÉE</label>
                            <select value={offForm.duree} onChange={e => setOffForm({ ...offForm, duree: e.target.value })} style={{ ...S.input, marginBottom: 0, fontSize: 11, appearance: "none" }}>
                              <option value={27}>27 jours</option>
                              <option value={7}>7 jours</option>
                              <option value={30}>30 jours</option>
                              <option value={60}>60 jours</option>
                            </select>
                          </div>
                        </div>
                        {offForm.debut && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", marginBottom: 8 }}>→ Fin le {addDays(offForm.debut, parseInt(offForm.duree))}</p>}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => activerPremium(s)} style={{ ...S.btnGold, flex: 1, padding: "8px 0", fontSize: 10 }}>✓ ACTIVER</button>
                          <button onClick={() => setEditSpot(null)} style={{ ...S.btnGhost, padding: "8px 14px", fontSize: 10 }}>ANNULER</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

// ─── SECTION DEMANDES ─────────────────────────────────────────
const DemandesSection = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("ads_regie")
      .select("*, spots(nom, ville)")
      .in("statut_demande", ["en_attente", "en_production"])
      .order("created_at", { ascending: false });
    setDemandes(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatut = async (id, statut) => {
    await supabase.from("ads_regie").update({
      statut_demande: statut,
      actif: statut === "actif",
    }).eq("id", id);
    load();
  };

  const typeLabel = { popup: "Pop up", banniere_haut: "Bannière Haut", banniere_bas: "Bannière Bas", sponsorise: "Sponsorisé", ticker: "Ticker", wayzmag: "Wayz'Mag" };
  const typeColor = { popup: "#C8920A", banniere_haut: "#1A4A6B", banniere_bas: "#1B6B4A", sponsorise: "#6B3A1A", ticker: "#2B2B6B", wayzmag: "#6B1A6B" };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2, fontFamily: "Arial" }}>PANNEAU</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Demandes en attente</h2>
      </div>

      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : demandes.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>✓</p>
            <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Aucune demande en attente.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {demandes.map(d => (
              <div key={d.id} style={{ ...S.card, borderLeft: `3px solid ${typeColor[d.type] || "#C8920A"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: typeColor[d.type] || "#C8920A", background: `${typeColor[d.type]}20`, padding: "2px 8px", borderRadius: 10 }}>
                        {typeLabel[d.type] || d.type}
                      </span>
                      {d.est_annonceur_ext && <span style={{ fontSize: 9, color: "#C8920A", background: "rgba(200,146,10,0.1)", padding: "2px 8px", borderRadius: 10 }}>EXT.</span>}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{d.est_annonceur_ext ? d.annonceur_nom : (d.spots?.nom || d.titre)}</p>
                    {d.est_annonceur_ext && d.annonceur_contact && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)" }}>Contact : {d.annonceur_contact}</p>}
                    {d.spots && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)" }}>📍 {d.spots.nom} — {d.spots.ville}</p>}
                    <p style={{ fontSize: 10, color: "rgba(244,247,247,0.35)", marginTop: 2 }}>{d.date_debut} → {d.date_fin}</p>
                    {d.texte && <p style={{ fontSize: 11, color: "rgba(244,247,247,0.5)", marginTop: 4, fontStyle: "italic" }}>"{d.texte}"</p>}
                  </div>
                  {d.image_url && <img src={d.image_url} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} alt="" />}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => updateStatut(d.id, "actif")} style={{ flex: 1, background: "rgba(46,204,138,0.15)", color: "#2ECC8A", border: "0.5px solid rgba(46,204,138,0.3)", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "Arial" }}>
                    ✓ ACTIVER
                  </button>
                  <button onClick={() => updateStatut(d.id, "en_production")} style={{ flex: 1, background: "rgba(200,146,10,0.1)", color: "#C8920A", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "Arial" }}>
                    🎨 EN PRODUCTION
                  </button>
                  <button onClick={() => updateStatut(d.id, "refuse")} style={{ ...S.btnDanger, flex: 1, padding: "8px 0", textAlign: "center" }}>
                    ✕ REFUSER
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

// ─── SECTION RÉGIE ────────────────────────────────────────────
const RegieSection = () => {
  const [ads,      setAds]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAd,   setEditAd]   = useState(null);
  const [filter,   setFilter]   = useState("tous");
  const [spots,    setSpots]    = useState([]);

  const TYPES = [
    { v: "popup",         l: "Pop up",       p: "200k/j" },
    { v: "banniere_haut", l: "Bann. Haut",   p: "20k/j"  },
    { v: "banniere_bas",  l: "Bann. Bas",    p: "10k/j"  },
    { v: "sponsorise",    l: "Sponsorisé",   p: "5k/j"   },
    { v: "ticker",        l: "Ticker",       p: "2k/j"   },
    { v: "wayzmag",       l: "Wayz'Mag",     p: "devis"  },
  ];
  const typeColor = { popup: "#C8920A", banniere_haut: "#1A4A6B", banniere_bas: "#1B6B4A", sponsorise: "#6B3A1A", ticker: "#2B2B6B", wayzmag: "#6B1A6B" };

  const EMPTY_FORM = { type: "popup", titre: "", texte: "", lien_wa: "", cta: "RÉSERVER SUR WHATSAPP", image_url: "", date_debut: "", date_fin: "", actif: true, est_annonceur_ext: false, annonceur_nom: "", annonceur_contact: "", statut_demande: "actif", spot_id: "" };
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from("ads_regie").select("*, spots(nom, ville)").order("created_at", { ascending: false }),
      supabase.from("spots").select("id, nom, ville").order("nom"),
    ]);
    setAds(a || []); setSpots(s || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(EMPTY_FORM); setEditAd(null); setShowForm(true); };
  const openEdit = (ad) => { setForm(ad); setEditAd(ad); setShowForm(true); };

  const save = async () => {
    const payload = { ...form, statut_demande: form.actif ? "actif" : "en_production" };
    if (editAd) { await supabase.from("ads_regie").update(payload).eq("id", editAd.id); }
    else { await supabase.from("ads_regie").insert(payload); }
    setShowForm(false); load();
  };

  const toggleActif = async (ad) => {
    await supabase.from("ads_regie").update({ actif: !ad.actif, statut_demande: !ad.actif ? "actif" : "en_production" }).eq("id", ad.id);
    load();
  };
  const deleteAd = async (id) => { if (!window.confirm("Supprimer ?")) return; await supabase.from("ads_regie").delete().eq("id", id); load(); };

  const filtered = ads.filter(a => {
    if (filter === "actif") return a.actif;
    if (filter === "inactif") return !a.actif;
    if (filter === "ext") return a.est_annonceur_ext;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2, fontFamily: "Arial" }}>PANNEAU</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Régie Pub</h2>
        </div>
        <button onClick={openNew} style={S.btnGold}>+ PUB</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ v: "tous", l: "Toutes" }, { v: "actif", l: "Actives" }, { v: "inactif", l: "Inactives" }, { v: "ext", l: "Annonceurs ext." }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} style={{
            padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 10, fontFamily: "Arial", fontWeight: 700,
            background: filter === f.v ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: filter === f.v ? "#0D2B30" : "rgba(244,247,247,0.5)",
            border: filter === f.v ? "none" : "0.5px solid rgba(255,255,255,0.1)",
          }}>{f.l}</button>
        ))}
      </div>

      {showForm && (
        <div style={{ ...S.card, border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 18, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 14, fontFamily: "Arial" }}>
            {editAd ? "MODIFIER LA PUB" : "NOUVELLE PUB"}
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[{ val: false, l: "🏠 Spot WAYZA" }, { val: true, l: "🌐 Annonceur Ext." }].map(opt => (
              <button key={String(opt.val)} onClick={() => setForm({ ...form, est_annonceur_ext: opt.val })} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "Arial",
                background: form.est_annonceur_ext === opt.val ? "#C8920A" : "rgba(255,255,255,0.05)",
                color: form.est_annonceur_ext === opt.val ? "#0D2B30" : "rgba(244,247,247,0.5)",
                border: form.est_annonceur_ext === opt.val ? "none" : "0.5px solid rgba(255,255,255,0.1)",
              }}>{opt.l}</button>
            ))}
          </div>

          {!form.est_annonceur_ext && (
            <>
              <label style={S.label}>SPOT</label>
              <select value={form.spot_id} onChange={e => setForm({ ...form, spot_id: e.target.value })} style={{ ...S.input, appearance: "none" }}>
                <option value="">Sélectionner un spot...</option>
                {spots.map(s => <option key={s.id} value={s.id}>{s.nom} — {s.ville}</option>)}
              </select>
            </>
          )}

          {form.est_annonceur_ext && (
            <>
              <input placeholder="Nom annonceur / marque" value={form.annonceur_nom} onChange={e => setForm({ ...form, annonceur_nom: e.target.value, titre: e.target.value })} style={S.input} />
              <input placeholder="Contact (+261... ou email)" value={form.annonceur_contact} onChange={e => setForm({ ...form, annonceur_contact: e.target.value })} style={S.input} />
            </>
          )}

          <label style={S.label}>FORMAT</label>
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

          <input placeholder="Titre" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={S.input} />
          <textarea placeholder="Texte / slogan" value={form.texte} onChange={e => setForm({ ...form, texte: e.target.value })} style={{ ...S.input, height: 60, resize: "none" }} />
          <input placeholder="+261..." value={form.lien_wa} onChange={e => setForm({ ...form, lien_wa: e.target.value })} style={S.input} />
          <input placeholder="Texte bouton" value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} style={S.input} />

          {form.type !== "ticker" && form.type !== "sponsorise" && (
            <ImageUploader onUploaded={url => setForm({ ...form, image_url: url })} bucket="wayza-ads"
              label={form.type === "popup" ? "Créa Pop up" : "Créa Bannière"} initialUrl={form.image_url || null} />
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

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <label style={{ ...S.label, marginBottom: 0 }}>STATUT</label>
            <button onClick={() => setForm({ ...form, actif: !form.actif })} style={S.toggle(form.actif)}>
              {form.actif ? "ACTIF" : "EN ATTENTE"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} style={{ ...S.btnGold, flex: 1, padding: "12px 0" }}>ENREGISTRER</button>
            <button onClick={() => setShowForm(false)} style={{ ...S.btnGhost, flex: 1, padding: "12px 0" }}>ANNULER</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : filtered.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucune pub.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(ad => (
              <div key={ad.id} style={{ ...S.card, borderLeft: `3px solid ${typeColor[ad.type] || "#C8920A"}`, opacity: ad.actif ? 1 : 0.6 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {ad.image_url && <img src={ad.image_url} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} alt="" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{ad.titre || ad.annonceur_nom || "—"}</p>
                        <p style={{ fontSize: 10, color: typeColor[ad.type] }}>{TYPES.find(t => t.v === ad.type)?.l} {ad.est_annonceur_ext ? "· EXT." : ""}</p>
                        <p style={{ fontSize: 10, color: "rgba(244,247,247,0.35)", marginTop: 2 }}>{ad.date_debut} → {ad.date_fin}</p>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: ad.actif ? "#2ECC8A" : "#C8920A", background: ad.actif ? "rgba(46,204,138,0.15)" : "rgba(200,146,10,0.1)", padding: "2px 8px", borderRadius: 10 }}>
                        {ad.actif ? "ACTIF" : ad.statut_demande?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button onClick={() => openEdit(ad)} style={{ ...S.btnGhost, fontSize: 10, padding: "4px 10px" }}>✏️</button>
                      <button onClick={() => toggleActif(ad)} style={{ ...S.toggle(ad.actif), fontSize: 10, padding: "4px 10px" }}>{ad.actif ? "DÉSACTIVER" : "ACTIVER"}</button>
                      <button onClick={() => deleteAd(ad.id)} style={{ ...S.btnDanger, padding: "4px 8px" }}>🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
    setGerants(g || []); setSpots(s || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const creerGerant = async () => {
    if (!newGerant.nom || !newGerant.spot_id) return alert("Nom et spot requis.");
    setSaving(true);
    const code = genCode();
    const { data, error } = await supabase.from("gerants").insert({ nom: newGerant.nom, spot_id: newGerant.spot_id, code_acces: code, actif: true }).select().single();
    if (error) { alert("Erreur : " + error.message); setSaving(false); return; }
    setNewGerant({ nom: "", spot_id: "" }); setShowForm(false);
    await load();
    if (data?.id) setCodeVisible(data.id);
    setSaving(false);
  };

  const toggleActif     = async (g)  => { await supabase.from("gerants").update({ actif: !g.actif }).eq("id", g.id); load(); };
  const supprimerGerant = async (id) => { if (!window.confirm("Révoquer ?")) return; await supabase.from("gerants").delete().eq("id", id); load(); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2, fontFamily: "Arial" }}>PANNEAU</p>
          <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Accès Gérants</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={S.btnGold}>+ NOUVEAU</button>
      </div>

      {showForm && (
        <div style={{ ...S.card, borderRadius: 18, padding: 20, marginBottom: 20, border: "0.5px solid rgba(200,146,10,0.35)" }}>
          <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 14, fontFamily: "Arial" }}>CRÉER UN ACCÈS GÉRANT</p>
          <label style={S.label}>NOM DU GÉRANT</label>
          <input placeholder="Ex: Rakoto Jean" value={newGerant.nom} onChange={e => setNewGerant({ ...newGerant, nom: e.target.value })} style={S.input} />
          <label style={S.label}>SPOT ASSOCIÉ</label>
          <select value={newGerant.spot_id} onChange={e => setNewGerant({ ...newGerant, spot_id: e.target.value })} style={{ ...S.input, appearance: "none" }}>
            <option value="">Sélectionner un spot...</option>
            {spots.map(s => <option key={s.id} value={s.id}>{s.nom} — {s.ville}</option>)}
          </select>
          <div style={{ background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: "#C8920A", lineHeight: 1.5 }}>🔑 Code WAYZA-XXXX-XXXX généré automatiquement.</p>
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
        : gerants.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucun gérant.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {gerants.map(g => (
              <div key={g.id} style={{ ...S.card, borderLeft: `3px solid ${g.actif ? "#C8920A" : "rgba(255,255,255,0.1)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{g.nom}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, color: g.actif ? "#2ECC8A" : "rgba(244,247,247,0.25)" }}>
                        {g.actif ? "● ACTIF" : "● RÉVOQUÉ"}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#C8920A" }}>📍 {g.spots?.nom} — {g.spots?.ville}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <button onClick={() => setCodeVisible(codeVisible === g.id ? null : g.id)} style={{ background: "rgba(200,146,10,0.12)", color: "#C8920A", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "Arial" }}>
                      {codeVisible === g.id ? "CACHER" : "VOIR CODE"}
                    </button>
                    <button onClick={() => toggleActif(g)} style={{ ...S.toggle(g.actif), fontSize: 10, padding: "4px 10px" }}>
                      {g.actif ? "RÉVOQUER" : "RÉACTIVER"}
                    </button>
                    <button onClick={() => supprimerGerant(g.id)} style={{ ...S.btnDanger, padding: "4px 8px" }}>SUPPR.</button>
                  </div>
                </div>
                {codeVisible === g.id && (
                  <div style={{ background: "rgba(200,146,10,0.1)", border: "0.5px solid rgba(200,146,10,0.4)", borderRadius: 10, padding: "10px 14px", marginTop: 10 }}>
                    <p style={{ fontSize: 9, color: "rgba(200,146,10,0.7)", letterSpacing: "0.2em", marginBottom: 4, fontFamily: "Arial" }}>CODE D'ACCÈS GÉRANT</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#E8B840", letterSpacing: "0.15em", fontFamily: "monospace" }}>{g.code_acces}</p>
                    <p style={{ fontSize: 9, color: "rgba(244,247,247,0.35)", marginTop: 4 }}>À transmettre au gérant uniquement.</p>
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
  const [resas,   setResas]  = useState([]);
  const [loading, setLoad]   = useState(true);
  const [filtre,  setFiltre] = useState("tous");

  const load = async () => {
    setLoad(true);
    const { data } = await supabase.from("reservations").select("*").order("created_at", { ascending: false }).limit(100);
    setResas(data || []);
    setLoad(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatut = async (id, statut) => { await supabase.from("reservations").update({ statut }).eq("id", id); load(); };
  const statutColor  = { en_attente: "#C8920A", confirmee: "#2ECC8A", annulee: "#E74C3C" };

  const filtered = filtre === "tous" ? resas : resas.filter(r => r.statut === filtre);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", marginBottom: 2, fontFamily: "Arial" }}>PANNEAU</p>
        <h2 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Réservations</h2>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ v: "tous", l: "Toutes" }, { v: "en_attente", l: "En attente" }, { v: "confirmee", l: "Confirmées" }, { v: "annulee", l: "Annulées" }].map(f => (
          <button key={f.v} onClick={() => setFiltre(f.v)} style={{
            padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 10, fontFamily: "Arial", fontWeight: 700,
            background: filtre === f.v ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: filtre === f.v ? "#0D2B30" : "rgba(244,247,247,0.5)",
            border: filtre === f.v ? "none" : "0.5px solid rgba(255,255,255,0.1)",
          }}>{f.l}</button>
        ))}
      </div>

      {loading ? <p style={{ color: "rgba(244,247,247,0.4)", fontSize: 13 }}>Chargement...</p>
        : filtered.length === 0 ? <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13 }}>Aucune réservation.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ ...S.card, borderLeft: `3px solid ${statutColor[r.statut] || "#C8920A"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{r.client_nom}</p>
                    <p style={{ fontSize: 11, color: "#C8920A" }}>{r.spot_nom}</p>
                    <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", marginTop: 2 }}>{r.date_reservation} à {r.heure} · {r.personnes} pers.</p>
                    {r.prestation_nom && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)" }}>✦ {r.prestation_nom}</p>}
                    {r.client_wa && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)" }}>💬 {r.client_wa}</p>}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: statutColor[r.statut], letterSpacing: "0.1em", background: `${statutColor[r.statut]}20`, padding: "3px 8px", borderRadius: 10 }}>
                    {r.statut?.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                {r.statut === "en_attente" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => updateStatut(r.id, "confirmee")} style={{ flex: 1, background: "rgba(46,204,138,0.15)", color: "#2ECC8A", border: "0.5px solid rgba(46,204,138,0.3)", borderRadius: 8, padding: "6px 0", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "Arial" }}>CONFIRMER</button>
                    <button onClick={() => updateStatut(r.id, "annulee")} style={{ flex: 1, background: "rgba(231,76,60,0.15)", color: "#E74C3C", border: "0.5px solid rgba(231,76,60,0.3)", borderRadius: 8, padding: "6px 0", cursor: "pointer", fontSize: 10, fontFamily: "Arial" }}>ANNULER</button>
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
  const [logged,     setLogged]     = useState(false);
  const [section,    setSection]    = useState("demandes");
  const [nbDemandes, setNbDemandes] = useState(0);

  useEffect(() => {
    if (!logged) return;
    const check = async () => {
      const { count } = await supabase.from("ads_regie").select("*", { count: "exact", head: true }).in("statut_demande", ["en_attente", "en_production"]);
      setNbDemandes(count || 0);
    };
    check();
  }, [logged, section]);

  if (!logged) return <AdminLogin onLogin={() => setLogged(true)} />;

  const sections = [
    { id: "demandes",   label: "Demandes",      icon: "🔔", badge: nbDemandes },
    { id: "spots",      label: "Spots",          icon: "📍" },
    { id: "articles",   label: "Wayz'Mag",       icon: "◈" },
    { id: "urgences",   label: "Urgences",       icon: "⊕" },
    { id: "regie",      label: "Régie",          icon: "📢" },
    { id: "gerants",    label: "Gérants",        icon: "🔑" },
    { id: "resas",      label: "Réservations",   icon: "📅" },
    { id: "parametres", label: "Paramètres",     icon: "⚙️" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0D2B30", color: "#F4F7F7", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { display: none; } textarea, input, select { box-sizing: border-box; }`}</style>

      {/* Header */}
      <div style={{ background: "#000", borderBottom: "0.5px solid rgba(200,146,10,0.3)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <p style={{ fontSize: 8, color: "#C8920A", letterSpacing: "0.4em", fontFamily: "Arial" }}>ACCÈS ADMIN</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>
            WAYZA <span style={{ color: "#C8920A" }}>ADMIN</span>
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: "#C8920A", fontWeight: 700, fontFamily: "Arial" }}>Mandimbimanana</p>
          <button onClick={() => setLogged(false)} style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "Arial" }}>
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", borderBottom: "0.5px solid rgba(200,146,10,0.15)", overflowX: "auto", background: "rgba(0,0,0,0.3)", position: "sticky", top: 56, zIndex: 99 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            flex: "0 0 auto", minWidth: 64, padding: "12px 10px", background: "none", border: "none",
            borderBottom: section === s.id ? "2px solid #C8920A" : "2px solid transparent",
            color: section === s.id ? "#C8920A" : "rgba(244,247,247,0.4)",
            cursor: "pointer", fontFamily: "Arial", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.04em", whiteSpace: "nowrap", position: "relative",
          }}>
            {s.icon} {s.label}
            {s.badge > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 4,
                background: "#E74C3C", color: "#fff", fontSize: 8, fontWeight: 800,
                width: 14, height: 14, borderRadius: "50%",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>{s.badge > 9 ? "9+" : s.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ padding: "20px 16px", maxWidth: 680, margin: "0 auto", paddingBottom: 60 }}>
        {section === "demandes"   && <DemandesSection />}
        {section === "spots"      && <SpotsSection />}
        {section === "articles"   && <ArticlesSection />}
        {section === "urgences"   && <UrgencesSection />}
        {section === "regie"      && <RegieSection />}
        {section === "gerants"    && <GerantsSection />}
        {section === "resas"      && <ResasSection />}
        {section === "parametres" && <ParametresSection />}
      </div>
    </div>
  );
}
