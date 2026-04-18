// ============================================================
//  WAYZA 2026 — Formulaire Commercial (Terrain)
//  Saisie texte uniquement — Images uploadées par Admin seul
// ============================================================

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://qmoesstuwetdugjgqbyl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtb2Vzc3R1d2V0ZHVnamdxYnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTEyODMsImV4cCI6MjA5MjA2NzI4M30.yUMqnecvSjz3w8Ug1_dek7HR7kZILq4VeSgiZga_bn0";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 12,
  padding: "12px 14px", color: "#F4F7F7", fontSize: 13,
  fontFamily: "Arial, sans-serif", outline: "none", marginBottom: 12,
};

const labelStyle = {
  fontSize: 9, color: "#C8920A", letterSpacing: "0.25em",
  fontWeight: 700, display: "block", marginBottom: 6, fontFamily: "Arial",
};

export default function FormulaireCommercial() {
  const [step, setStep]       = useState(1); // 1: type, 2: details, 3: confirm
  const [type, setType]       = useState("");
  const [form, setForm]       = useState({
    // Spot
    nom: "", ville: "", region: "", cat: "", pass: "Standard",
    slogan: "", description: "", wa: "", gps: "",
    social_wa: "", social_fb: "", social_ig: "", social_msg: "",
    // Pub
    pub_type: "force_frappe", pub_titre: "", pub_texte: "",
    pub_lien_wa: "", pub_cta: "RÉSERVER SUR WHATSAPP",
    pub_date_debut: "", pub_date_fin: "",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [commercial, setCommercial] = useState({ nom: "", code: "" });

  const VILLES = ["Antananarivo", "Nosy Be", "Sainte Marie", "Taolagnaro", "Mahajanga", "Toamasina", "Fianarantsoa"];
  const CATS   = ["Fast, Grill & Resto", "Lounge-K & Night Club", "Fit, Body & Sport", "Window Shopper", "Services", "Pass & Glow"];

  const submit = async () => {
    if (!commercial.nom || !commercial.code) return;
    setSending(true);
    try {
      if (type === "spot") {
        await supabase.from("spots").insert({
          nom:     form.nom,
          ville:   form.ville,
          region:  form.region,
          cat:     form.cat,
          pass:    form.pass,
          slogan:  form.slogan,
          description: form.description,
          wa:      form.wa,
          gps:     form.gps,
          social:  {
            whatsapp:  form.social_wa,
            facebook:  form.social_fb,
            instagram: form.social_ig,
            messenger: form.social_msg,
          },
          statut:        "libre",
          actif:         false, // Doit être validé par Mandimbimanana
          commercial_nom:  commercial.nom,
          commercial_code: commercial.code,
        });
      } else if (type === "pub") {
        await supabase.from("ads_regie").insert({
          type:        form.pub_type,
          titre:       form.pub_titre,
          texte:       form.pub_texte,
          lien_wa:     form.pub_lien_wa,
          cta:         form.pub_cta,
          date_debut:  form.pub_date_debut,
          date_fin:    form.pub_date_fin,
          actif:       false, // Activation par admin uniquement (image uploadée par Mandimbimanana)
          image_url:   null,  // IMAGE = ADMIN SEULEMENT
          commercial_nom:  commercial.nom,
          commercial_code: commercial.code,
        });
      }
      setDone(true);
    } catch (e) {
      alert("Erreur : " + e.message);
    }
    setSending(false);
  };

  if (done) return (
    <div style={{ minHeight: "100vh", background: "#0D2B30", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, flexDirection: "column", gap: 16, textAlign: "center" }}>
      <div style={{ fontSize: 52 }}>✅</div>
      <p style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7" }}>Saisie envoyée !</p>
      <p style={{ fontSize: 13, color: "rgba(244,247,247,0.5)", lineHeight: 1.6 }}>
        {type === "spot"
          ? "Le spot a été soumis. Mandimbimanana le validera et ajoutera les photos."
          : "La pub a été soumise. Mandimbimanana l'activera après upload de la créa."}
      </p>
      <button onClick={() => { setDone(false); setStep(1); setType(""); }} style={{ background: "#C8920A", color: "#0D2B30", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>
        NOUVELLE SAISIE
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0D2B30", color: "#F4F7F7", fontFamily: "Arial, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { display: none; }`}</style>

      {/* Header */}
      <div style={{ background: "#000", padding: "14px 20px", borderBottom: "0.5px solid rgba(200,146,10,0.3)" }}>
        <p style={{ fontSize: 8, color: "#C8920A", letterSpacing: "0.4em", marginBottom: 2 }}>AGENT COMMERCIAL</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7", fontFamily: "Georgia, serif" }}>
          WAYZA <span style={{ color: "#C8920A" }}>TERRAIN</span>
        </h1>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 480, margin: "0 auto" }}>

        {/* Info commercial */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(200,146,10,0.2)", borderRadius: 16, padding: "16px", marginBottom: 20 }}>
          <p style={labelStyle}>VOTRE IDENTITÉ</p>
          <input placeholder="Votre nom complet" value={commercial.nom} onChange={e => setCommercial({ ...commercial, nom: e.target.value })} style={{ ...inputStyle, marginBottom: 8 }} />
          <input placeholder="Code commercial (ex: COM-001)" value={commercial.code} onChange={e => setCommercial({ ...commercial, code: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} />
        </div>

        {/* Étape 1 : choisir le type */}
        {step === 1 && (
          <div>
            <p style={{ ...labelStyle, marginBottom: 14 }}>TYPE DE SAISIE</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { v: "spot", label: "Nouveau Spot", sub: "Restaurant, club, spa...", icon: "📍" },
                { v: "pub",  label: "Nouvelle Pub",  sub: "Régie Force Frappe / Bannière", icon: "📢" },
              ].map(t => (
                <button key={t.v} onClick={() => { setType(t.v); setStep(2); }} style={{
                  background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(200,146,10,0.2)",
                  borderRadius: 16, padding: "20px 14px", cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s",
                }}>
                  <p style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#F4F7F7", marginBottom: 4 }}>{t.label}</p>
                  <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", lineHeight: 1.4 }}>{t.sub}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 2 : formulaire spot */}
        {step === 2 && type === "spot" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#C8920A", cursor: "pointer", fontSize: 18 }}>←</button>
              <p style={{ ...labelStyle, marginBottom: 0 }}>INFORMATIONS DU SPOT</p>
            </div>

            <label style={labelStyle}>NOM DU SPOT</label>
            <input placeholder="Ex : Le Jardin Bleu" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inputStyle} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>VILLE</label>
                <select value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="">Sélectionner...</option>
                  {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>RÉGION</label>
                <input placeholder="Ex: Diana" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <label style={labelStyle}>CATÉGORIE</label>
            <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
              <option value="">Sélectionner...</option>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={labelStyle}>PASS</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {["Gold", "Standard"].map(p => (
                <button key={p} onClick={() => setForm({ ...form, pass: p })} style={{
                  padding: "10px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
                  background: form.pass === p ? "#C8920A" : "rgba(255,255,255,0.05)",
                  color: form.pass === p ? "#0D2B30" : "rgba(244,247,247,0.5)",
                  border: form.pass === p ? "none" : "0.5px solid rgba(255,255,255,0.1)",
                }}>{p === "Gold" ? "✦ GOLD — 20k Ar/m" : "STANDARD"}</button>
              ))}
            </div>

            <label style={labelStyle}>SLOGAN</label>
            <input placeholder="Ex : La table de l'archipel" value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} style={inputStyle} />

            <label style={labelStyle}>DESCRIPTION</label>
            <textarea placeholder="Description détaillée du spot (2-4 phrases)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, height: 80, resize: "none" }} />

            <label style={labelStyle}>NUMÉRO WHATSAPP</label>
            <input placeholder="+261 32..." value={form.wa} onChange={e => setForm({ ...form, wa: e.target.value })} style={inputStyle} />

            <label style={labelStyle}>COORDONNÉES GPS (optionnel)</label>
            <input placeholder="Ex : -13.3167, 48.2667" value={form.gps} onChange={e => setForm({ ...form, gps: e.target.value })} style={inputStyle} />

            {form.pass === "Gold" && (
              <>
                <p style={{ ...labelStyle, marginTop: 4 }}>RÉSEAUX SOCIAUX (PASS GOLD)</p>
                <input placeholder="WhatsApp Business (+261...)" value={form.social_wa} onChange={e => setForm({ ...form, social_wa: e.target.value })} style={inputStyle} />
                <input placeholder="Page Facebook (URL)" value={form.social_fb} onChange={e => setForm({ ...form, social_fb: e.target.value })} style={inputStyle} />
                <input placeholder="Instagram (URL ou @pseudo)" value={form.social_ig} onChange={e => setForm({ ...form, social_ig: e.target.value })} style={inputStyle} />
                <input placeholder="Messenger (URL)" value={form.social_msg} onChange={e => setForm({ ...form, social_msg: e.target.value })} style={inputStyle} />
              </>
            )}

            <div style={{ background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.25)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: "#C8920A", lineHeight: 1.5 }}>
                📸 <strong>Photos :</strong> Mandimbimanana les ajoutera après validation. Vous pouvez indiquer ici les photos à utiliser (messages WhatsApp au propriétaire).
              </p>
            </div>

            <button onClick={() => setStep(3)} style={{ width: "100%", background: "#C8920A", color: "#0D2B30", border: "none", borderRadius: 12, padding: "14px 0", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              CONTINUER →
            </button>
          </div>
        )}

        {/* Étape 2 : formulaire pub */}
        {step === 2 && type === "pub" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#C8920A", cursor: "pointer", fontSize: 18 }}>←</button>
              <p style={{ ...labelStyle, marginBottom: 0 }}>SAISIE PUBLICITAIRE</p>
            </div>

            <label style={labelStyle}>FORMAT</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { v: "force_frappe", l: "Force Frappe", p: "200k/j" },
                { v: "banniere",     l: "Bannière",     p: "50k/m" },
                { v: "ticker",       l: "Ticker Or",    p: "2k/j" },
              ].map(t => (
                <button key={t.v} onClick={() => setForm({ ...form, pub_type: t.v })} style={{
                  padding: "8px 4px", borderRadius: 10, cursor: "pointer", fontWeight: 700,
                  background: form.pub_type === t.v ? "#C8920A" : "rgba(255,255,255,0.05)",
                  color: form.pub_type === t.v ? "#0D2B30" : "rgba(244,247,247,0.5)",
                  border: form.pub_type === t.v ? "none" : "0.5px solid rgba(255,255,255,0.1)",
                  fontSize: 10,
                }}>
                  {t.l}<br /><span style={{ fontSize: 9, fontWeight: 400 }}>{t.p} Ar</span>
                </button>
              ))}
            </div>

            <label style={labelStyle}>NOM DU CLIENT / PARTENAIRE</label>
            <input placeholder="Ex : Orchidea Club" value={form.pub_titre} onChange={e => setForm({ ...form, pub_titre: e.target.value })} style={inputStyle} />

            <label style={labelStyle}>MESSAGE / SLOGAN</label>
            <textarea placeholder="Ex : La nuit commence ici — Réservez votre table VIP" value={form.pub_texte} onChange={e => setForm({ ...form, pub_texte: e.target.value })} style={{ ...inputStyle, height: 70, resize: "none" }} />

            <label style={labelStyle}>NUMÉRO WHATSAPP DU CLIENT</label>
            <input placeholder="+261 32..." value={form.pub_lien_wa} onChange={e => setForm({ ...form, pub_lien_wa: e.target.value })} style={inputStyle} />

            <label style={labelStyle}>TEXTE DU BOUTON</label>
            <input placeholder='Ex: "RÉSERVER SUR WHATSAPP"' value={form.pub_cta} onChange={e => setForm({ ...form, pub_cta: e.target.value })} style={inputStyle} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>DATE DÉBUT</label>
                <input type="date" value={form.pub_date_debut} onChange={e => setForm({ ...form, pub_date_debut: e.target.value })} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
              <div>
                <label style={labelStyle}>DATE FIN</label>
                <input type="date" value={form.pub_date_fin} onChange={e => setForm({ ...form, pub_date_fin: e.target.value })} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
            </div>

            <div style={{ background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.25)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: "#C8920A", lineHeight: 1.6 }}>
                🔒 <strong>Image publicitaire :</strong> Les créatifs sont uploadés exclusivement par <strong>Mandimbimanana</strong> via la console Admin. Votre saisie sera en attente jusqu'à l'ajout de la créa.
              </p>
            </div>

            <button onClick={() => setStep(3)} style={{ width: "100%", background: "#C8920A", color: "#0D2B30", border: "none", borderRadius: 12, padding: "14px 0", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              CONTINUER →
            </button>
          </div>
        )}

        {/* Étape 3 : récapitulatif + envoi */}
        {step === 3 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#C8920A", cursor: "pointer", fontSize: 18 }}>←</button>
              <p style={{ ...labelStyle, marginBottom: 0 }}>RÉCAPITULATIF</p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(200,146,10,0.2)", borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "#C8920A", fontWeight: 700, marginBottom: 12 }}>
                {type === "spot" ? `📍 SPOT — ${form.pass}` : `📢 PUB — ${form.pub_type?.replace("_", " ").toUpperCase()}`}
              </p>

              {type === "spot" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[["Nom", form.nom], ["Ville", form.ville], ["Catégorie", form.cat], ["WhatsApp", form.wa], ["Slogan", form.slogan]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "rgba(244,247,247,0.4)" }}>{l}</span>
                      <span style={{ fontSize: 11, color: "#F4F7F7", fontWeight: 600, textAlign: "right", flex: 1 }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>
              )}

              {type === "pub" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[["Client", form.pub_titre], ["Message", form.pub_texte], ["WhatsApp", form.pub_lien_wa], ["Période", `${form.pub_date_debut} → ${form.pub_date_fin}`]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "rgba(244,247,247,0.4)" }}>{l}</span>
                      <span style={{ fontSize: 11, color: "#F4F7F7", fontWeight: 600, textAlign: "right", flex: 1 }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "0.5px solid rgba(200,146,10,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "rgba(244,247,247,0.4)" }}>Commercial</span>
                  <span style={{ fontSize: 11, color: "#C8920A", fontWeight: 700 }}>{commercial.nom} ({commercial.code})</span>
                </div>
              </div>
            </div>

            <button onClick={submit} disabled={sending} style={{
              width: "100%", background: "#C8920A", color: "#0D2B30", border: "none",
              borderRadius: 12, padding: "14px 0", fontWeight: 800, fontSize: 13, cursor: "pointer",
              opacity: sending ? 0.6 : 1,
            }}>
              {sending ? "ENVOI EN COURS..." : "✓ SOUMETTRE À MANDIMBIMANANA"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
