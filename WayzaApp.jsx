// ============================================================
//  WAYZA 2026 — Application Principale
//  React + Supabase | Design Noir & Or
//  Admin : Mandimbimanana
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIG SUPABASE ─────────────────────────────────────────
// Remplacez par vos vraies clés Supabase
const SUPABASE_URL = "https://qmoesstuwetdugjgqbyl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtb2Vzc3R1d2V0ZHVnamdxYnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTEyODMsImV4cCI6MjA5MjA2NzI4M30.yUMqnecvSjz3w8Ug1_dek7HR7kZILq4VeSgiZga_bn0";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── UTILITAIRE : COMPRESSION WEBP < 100 Ko ─────────────────
export async function compressToWebP(file, maxKb = 100) {
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
        canvas.toBlob(
          (blob) => {
            if (blob.size / 1024 > maxKb && quality > 0.2) {
              quality -= 0.1;
              tryCompress();
            } else {
              URL.revokeObjectURL(url);
              const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                type: "image/webp",
              });
              resolve(compressed);
            }
          },
          "image/webp",
          quality
        );
      };
      tryCompress();
    };
    img.src = url;
  });
}

// ─── DONNÉES STATIQUES (fallback si Supabase indisponible) ───
const CATEGORIES = [
  { id: 1, name: "Fast, Grill & Resto",   icon: "🍽", glow: "#C8920A", sub: "Tables d'exception" },
  { id: 2, name: "Lounge-K & Night Club", icon: "🥂", glow: "#1A4A6B", sub: "Vibration nocturne" },
  { id: 3, name: "Pass & Glow",           icon: "✦",  glow: "#C8920A", sub: "Accès privilégié" },
  { id: 4, name: "WAYZA MAG",             icon: "◈",  glow: "#C8920A", sub: "Édition prestige" },
  { id: 5, name: "Fit, Body & Sport",     icon: "◉",  glow: "#1B6B4A", sub: "Luxe actif" },
  { id: 6, name: "Window Shopper",        icon: "◇",  glow: "#6B3A1A", sub: "Créateurs rares" },
  { id: 7, name: "Services",              icon: "⬡",  glow: "#2B2B6B", sub: "Conciergerie" },
  { id: 8, name: "Urgences",              icon: "⊕",  glow: "#8B1A1A", sub: "Contacts essentiels" },
];

const SPOTS_FALLBACK = [
  { id:1,  nom:"L'Écrin Vanille",         ville:"Sainte Marie",  region:"Analanjirofo", cat:"Fast, Grill & Resto",   pass:"Gold",     slogan:"L'île en bouche",                wa:"+261320011001", description:"Dans un jardin de palétuviers suspendus sur l'océan Indien, L'Écrin Vanille sublime la cuisine créole avec une précision gastronomique absolue.", gps:"-17.0833, 49.8500", img:"https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80", photos:[], social:{} },
  { id:2,  nom:"Baie des Baleines Lodge", ville:"Sainte Marie",  region:"Analanjirofo", cat:"Lounge-K & Night Club", pass:"Gold",     slogan:"Quand la nuit rejoint l'horizon", wa:"+261320011002", description:"Niché en surplomb de la baie la plus célèbre de l'île, ce lounge intimiste transforme chaque coucher de soleil en cérémonie privée.", gps:"-17.1200, 49.8700", img:"https://images.unsplash.com/photo-1566417713040-d7384c63051b?w=600&q=80", photos:[], social:{} },
  { id:3,  nom:"Villa Pandanus",          ville:"Sainte Marie",  region:"Analanjirofo", cat:"Fast, Grill & Resto",   pass:"Standard", slogan:"La douceur comme art de vivre",   wa:"+261320011003", description:"La Villa Pandanus incarne le raffinement discret des adresses qui n'ont rien à prouver.", gps:"-17.0500, 49.8200", img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80", photos:[], social:{} },
  { id:4,  nom:"Sakamanga Nosy Be",       ville:"Nosy Be",       region:"Diana",        cat:"Fast, Grill & Resto",   pass:"Gold",     slogan:"La table de l'archipel",          wa:"+261320022001", description:"Face à l'Ile Ronde, la maison Sakamanga est un sanctuaire gastronomique.", gps:"-13.3167, 48.2667", img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80", photos:[], social:{} },
  { id:5,  nom:"Orchidea Club",           ville:"Nosy Be",       region:"Diana",        cat:"Lounge-K & Night Club", pass:"Gold",     slogan:"La nuit commence ici",            wa:"+261320022002", description:"L'Orchidea Club est l'épicentre de la vie nocturne premium de Nosy Be.", gps:"-13.3200, 48.2700", img:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80", photos:[], social:{} },
  { id:6,  nom:"Le Ylang Lounge",         ville:"Nosy Be",       region:"Diana",        cat:"Lounge-K & Night Club", pass:"Standard", slogan:"Parfum de nuit, éclat d'or",      wa:"+261320022003", description:"Inspiré du fleuron floral de Nosy Be, le Ylang Lounge distille une atmosphère envoûtante.", gps:"-13.3100, 48.2500", img:"https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80", photos:[], social:{} },
  { id:7,  nom:"Fort Dauphin Sands",      ville:"Taolagnaro",    region:"Anosy",        cat:"Fast, Grill & Resto",   pass:"Gold",     slogan:"Le bout du monde à table",        wa:"+261320033001", description:"Au pied des massifs de l'Anosy, Fort Dauphin Sands propose une expérience culinaire sauvage et sophistiquée.", gps:"-25.0333, 46.9833", img:"https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&q=80", photos:[], social:{} },
  { id:8,  nom:"Waves & Grace",           ville:"Taolagnaro",    region:"Anosy",        cat:"Fit, Body & Sport",     pass:"Gold",     slogan:"Surfer l'excellence",             wa:"+261320033002", description:"Waves & Grace est l'unique surf lodge premium du Grand Sud malgache.", gps:"-25.0500, 46.9700", img:"https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&q=80", photos:[], social:{} },
  { id:9,  nom:"L'Anosy Club",            ville:"Taolagnaro",    region:"Anosy",        cat:"Lounge-K & Night Club", pass:"Standard", slogan:"Là où l'Inde rencontre la nuit",  wa:"+261320033003", description:"L'Anosy Club incarne la renaissance culturelle de Taolagnaro.", gps:"-25.0200, 46.9900", img:"https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&q=80", photos:[], social:{} },
  { id:10, nom:"Le Jardin des Délices",   ville:"Antananarivo",  region:"Analamanga",   cat:"Fast, Grill & Resto",   pass:"Gold",     slogan:"La capitale en saveurs",          wa:"+261320044001", description:"Caché derrière les hauts murs d'un riad d'Ambatonakanga, Le Jardin des Délices est la table de référence des Hautes Terres.", gps:"-18.9167, 47.5167", img:"https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&q=80", photos:[], social:{} },
  { id:11, nom:"Sky Bar Zoma",            ville:"Antananarivo",  region:"Analamanga",   cat:"Lounge-K & Night Club", pass:"Gold",     slogan:"La ville à vos pieds",            wa:"+261320044002", description:"Au vingtième étage surplombant Analakely, le Sky Bar Zoma offre le panorama le plus envoûtant de la capitale.", gps:"-18.9100, 47.5300", img:"https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&q=80", photos:[], social:{} },
  { id:12, nom:"Roots Spa & Wellness",    ville:"Antananarivo",  region:"Analamanga",   cat:"Fit, Body & Sport",     pass:"Gold",     slogan:"Régénérez l'essentiel",           wa:"+261320044003", description:"Premier institut holistique de Madagascar intégrant la phytothérapie malgache dans des protocoles internationaux.", gps:"-18.9300, 47.5100", img:"https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80", photos:[], social:{} },
  { id:13, nom:"Maison Boutique Isoraka", ville:"Antananarivo",  region:"Analamanga",   cat:"Window Shopper",        pass:"Standard", slogan:"Le goût de la rareté",            wa:"+261320044004", description:"La Maison Boutique Isoraka rassemble les créateurs du design malgache contemporain.", gps:"-18.9250, 47.5200", img:"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80", photos:[], social:{} },
  { id:14, nom:"Le Refuge du Tampoketsa", ville:"Antananarivo",  region:"Analamanga",   cat:"Fast, Grill & Resto",   pass:"Standard", slogan:"L'âme de la terre malgache",     wa:"+261320044005", description:"À trente minutes du centre, Le Refuge du Tampoketsa transporte ses hôtes dans un paysage de collines dorées.", gps:"-18.8800, 47.4900", img:"https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80", photos:[], social:{} },
  { id:15, nom:"Azur Spa Tana",           ville:"Antananarivo",  region:"Analamanga",   cat:"Fit, Body & Sport",     pass:"Standard", slogan:"Votre écrin de sérénité",        wa:"+261320044006", description:"Le rendez-vous des citadins en quête d'une pause hors du temps à Faravohitra.", gps:"-18.9050, 47.5350", img:"https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80", photos:[], social:{} },
];

const MAG = [
  { id:1, titre:"Le Grand Souffle", soustitre:"Le ballet des baleines à Sainte Marie", tag:"NATURE · SAINTE MARIE", date:"Juillet 2026", spot:"Baie des Baleines Lodge", corps:"Chaque année, entre juillet et septembre, quelque chose d'extraordinaire se produit au large de Sainte Marie. Les eaux chaudes et profondes du canal de Mozambique deviennent la scène d'un ballet naturel d'une ampleur mystique : des dizaines de baleines à bosse choisissent cette île pour donner naissance à leurs petits. Du pont d'une embarcation pneumatique discrète, la rencontre est totale.", img:"https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80" },
  { id:2, titre:"Nosy Be After Dark", soustitre:"Anatomie d'une nuit parfaite dans l'archipel", tag:"NIGHTLIFE · NOSY BE", date:"Août 2026", spot:"Orchidea Club", corps:"Dès que le soleil plonge dans les eaux turquoise du canal de Mozambique, l'île aux parfums revêt ses atours les plus séducteurs. Les bougainvillées s'illuminent, les odeurs d'ylang-ylang deviennent plus intenses.", img:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80" },
  { id:3, titre:"Taolagnaro", soustitre:"Nouvelle frontière du surf-luxe mondial", tag:"SPORT & LUXE · ANOSY", date:"Juin 2026", spot:"Waves & Grace", corps:"Le Grand Sud malgache s'impose comme l'une des destinations les plus excitantes pour les voyageurs qui refusent de choisir entre l'exigence du confort et l'appel de la nature brute.", img:"https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80" },
  { id:4, titre:"Hautes Terres", soustitre:"L'âme gustative d'Antananarivo", tag:"GASTRONOMIE · TANA", date:"Mai 2026", spot:"Le Jardin des Délices", corps:"La gastronomie des Hautes Terres malgaches est l'une des grandes cuisines méconnues du monde. Héritière de siècles de traditions merina.", img:"https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80" },
];

const URGENCES = [
  { service:"SAMU",        nom:"SAMU Tana",                    contact:"+261 20 22 353 13", quartier:"Ambohidahy",    ville:"Antananarivo", type:"med" },
  { service:"Hôpital",     nom:"HJRA — Hôpital Ravoahangy",   contact:"+261 20 22 238 41", quartier:"Ampefiloha",    ville:"Antananarivo", type:"med" },
  { service:"Police",      nom:"Commissariat Central",         contact:"+261 20 22 353 09", quartier:"Analakely",     ville:"Antananarivo", type:"pol" },
  { service:"Pompiers",    nom:"Brigade des Sapeurs-Pompiers", contact:"+261 20 22 211 11", quartier:"Tsaralalàna",   ville:"Antananarivo", type:"pol" },
  { service:"Urgences",    nom:"Hôpital de Nosy Be",           contact:"+261 20 86 613 48", quartier:"Hell-Ville",    ville:"Nosy Be",      type:"med" },
  { service:"Police",      nom:"Commissariat Hell-Ville",      contact:"+261 20 86 613 17", quartier:"Hell-Ville",    ville:"Nosy Be",      type:"pol" },
  { service:"Pharmacie",   nom:"Pharmacie de la Mer",          contact:"+261 32 05 600 01", quartier:"Ambondrona",    ville:"Nosy Be",      type:"pharm" },
  { service:"Urgences",    nom:"CHD Sainte Marie",             contact:"+261 20 57 004 12", quartier:"Ambodifotatra", ville:"Sainte Marie", type:"med" },
  { service:"Gendarmerie", nom:"Brigade Ambodifotatra",        contact:"+261 20 57 004 07", quartier:"Ambodifotatra", ville:"Sainte Marie", type:"pol" },
  { service:"Urgences",    nom:"Hôpital de Taolagnaro",        contact:"+261 20 92 211 52", quartier:"Centre-ville",  ville:"Taolagnaro",   type:"med" },
  { service:"Pharmacie",   nom:"Pharmacie de l'Anosy",         contact:"+261 34 17 330 02", quartier:"Libanona",      ville:"Taolagnaro",   type:"pharm" },
  { service:"Ambassade",   nom:"Ambassade de France",          contact:"+261 20 23 398 98", quartier:"Ambatobe",      ville:"Antananarivo", type:"amb" },
];

const VILLES = ["Toute l'île", "Nosy Be", "Sainte Marie", "Taolagnaro", "Tana"];

// ─── ICÔNES SVG ──────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor", strokeWidth = 1.5 }) => {
  const paths = {
    home:      <><path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M8 20v-7h6v7"/></>,
    book:      <><rect x="3" y="3" width="16" height="16" rx="2"/><path d="M7 8h8M7 12h6M7 16h4"/></>,
    shield:    <><path d="M11 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z"/><path d="M9 11l2 2 4-4"/></>,
    x:         <path d="M6 6l10 10M16 6L6 16"/>,
    chevron:   <path d="M9 5l7 7-7 7"/>,
    back:      <path d="M15 5l-7 7 7 7"/>,
    phone:     <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A17 17 0 014 5a1 1 0 011-1z"/>,
    map:       <><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    whatsapp:  <><circle cx="12" cy="12" r="9"/><path d="M8 12s1 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></>,
    sparkles:  <><path d="M12 3v1M12 20v1M4.2 4.2l.7.7M19.1 19.1l.7.7M3 12H2M22 12h-1M4.9 19.1l-.7.7M19.8 4.9l-.7-.7"/><circle cx="12" cy="12" r="4"/></>,
    calendar:  <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    users:     <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    check:     <path d="M20 6L9 17l-5-5"/>,
    clock:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>,
    fb:        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>,
    ig:        <><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></>,
    messenger: <path d="M12 2C6.48 2 2 6.14 2 11.25c0 3.12 1.6 5.9 4.1 7.71V22l3.74-2.06A10.88 10.88 0 0012 20.5c5.52 0 10-4.14 10-9.25S17.52 2 12 2zm1 12.44l-2.54-2.71L5.5 14.44l5.52-5.88 2.6 2.71 4.88-2.71L13 14.44z"/>,
    star:      <path d="M12 2l3 6.5H22l-5.5 4 2 6.5L12 15l-6.5 4 2-6.5L2 8.5h7z"/>,
    upload:    <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// ─── COMPOSANTS DE BASE ───────────────────────────────────────

const PassBadge = ({ type }) => (
  <span style={{
    background: type === "Gold" ? "#C8920A" : "rgba(255,255,255,0.07)",
    color: type === "Gold" ? "#0D2B30" : "rgba(255,255,255,0.4)",
    border: type === "Gold" ? "none" : "1px solid rgba(255,255,255,0.12)",
    fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
    padding: "3px 10px", borderRadius: 20, display: "inline-block",
  }}>
    {type === "Gold" ? "✦ GOLD" : "STANDARD"}
  </span>
);

const StatusBadge = ({ statut }) => {
  const isLibre = statut === "libre";
  return (
    <span style={{
      background: isLibre ? "rgba(27,107,74,0.25)" : "rgba(139,26,26,0.25)",
      color: isLibre ? "#2ECC8A" : "#E74C3C",
      border: `1px solid ${isLibre ? "rgba(46,204,138,0.4)" : "rgba(231,76,60,0.4)"}`,
      fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
      padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: isLibre ? "#2ECC8A" : "#E74C3C", display: "inline-block" }} />
      {isLibre ? "LIBRE" : "COMPLET"}
    </span>
  );
};

// ─── FORMULAIRE DE RÉSERVATION ────────────────────────────────
const ReservationForm = ({ spot, onClose }) => {
  const [form, setForm] = useState({ nom: "", date: "", heure: "", personnes: 1 });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!form.nom || !form.date || !form.heure) return;
    setSending(true);
    try {
      const { error } = await supabase.from("reservations").insert({
        spot_id: spot.id,
        spot_nom: spot.nom,
        client_nom: form.nom,
        date_reservation: form.date,
        heure: form.heure,
        personnes: form.personnes,
        statut: "en_attente",
      });
      if (!error) {
        // Envoi WhatsApp automatique
        const msg = encodeURIComponent(
          `🟡 *NOUVELLE RÉSERVATION WAYZA*\n\n` +
          `📍 *${spot.nom}*\n` +
          `👤 Client : ${form.nom}\n` +
          `📅 Date : ${form.date} à ${form.heure}\n` +
          `👥 Personnes : ${form.personnes}\n\n` +
          `_Réservation via WAYZA 2026_`
        );
        window.open(`https://wa.me/${spot.wa.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
        setSent(true);
      }
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  if (sent) return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <p style={{ color: "#C8920A", fontWeight: 700, marginBottom: 6 }}>Réservation envoyée !</p>
      <p style={{ fontSize: 12, color: "rgba(244,247,247,0.5)" }}>WhatsApp ouvert avec le récapitulatif</p>
      <button onClick={onClose} style={{ marginTop: 16, background: "#C8920A", color: "#0D2B30", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Fermer</button>
    </div>
  );

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(200,146,10,0.3)",
    borderRadius: 10, padding: "10px 14px", color: "#F4F7F7", fontSize: 13,
    fontFamily: "inherit", outline: "none", marginBottom: 10,
  };

  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 14 }}>RÉSERVATION</p>
      <input placeholder="Votre nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} />
        <input type="time" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }} />
      </div>
      <div style={{ marginTop: 10, marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: "rgba(244,247,247,0.5)", display: "block", marginBottom: 6 }}>Nombre de personnes</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[1,2,3,4,"5+"].map(n => (
            <button key={n} onClick={() => setForm({ ...form, personnes: n })} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12,
              background: form.personnes === n ? "#C8920A" : "rgba(255,255,255,0.05)",
              color: form.personnes === n ? "#0D2B30" : "rgba(244,247,247,0.5)",
              border: form.personnes === n ? "none" : "0.5px solid rgba(255,255,255,0.1)",
            }}>{n}</button>
          ))}
        </div>
      </div>
      <button onClick={handleSubmit} disabled={sending} style={{
        width: "100%", padding: "14px 0", background: "#C8920A", color: "#0D2B30",
        border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13,
        letterSpacing: "0.12em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        opacity: sending ? 0.6 : 1,
      }}>
        <Icon name="whatsapp" size={17} color="#0D2B30" />
        {sending ? "ENVOI..." : "CONFIRMER VIA WHATSAPP"}
      </button>
    </div>
  );
};

// ─── FICHE SPOT DÉTAILLÉE ─────────────────────────────────────
const SpotDetailScreen = ({ spot, onBack }) => {
  const [showResaForm, setShowResaForm] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const allPhotos = [spot.img, ...(spot.photos || [])].filter(Boolean);

  const socialLinks = spot.social || {};

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
      {/* Galerie photos */}
      <div style={{ position: "relative", height: 260 }}>
        <img src={allPhotos[photoIdx] || spot.img} alt={spot.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {spot.pass === "Gold" && (
          <div style={{
            position: "absolute", inset: 0,
            boxShadow: "inset 0 0 0 2px rgba(200,146,10,0.6), inset 0 0 30px rgba(200,146,10,0.15)",
            pointerEvents: "none", borderRadius: 0,
          }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, transparent 50%)" }} />

        {/* Thumbnails si plusieurs photos */}
        {allPhotos.length > 1 && (
          <div style={{ position: "absolute", bottom: 80, left: 16, display: "flex", gap: 6 }}>
            {allPhotos.map((p, i) => (
              <div key={i} onClick={() => setPhotoIdx(i)} style={{
                width: 36, height: 36, borderRadius: 6, overflow: "hidden", cursor: "pointer",
                border: `2px solid ${i === photoIdx ? "#C8920A" : "rgba(255,255,255,0.2)"}`,
              }}>
                <img src={p} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}

        <button onClick={onBack} style={{
          position: "absolute", top: 52, left: 16,
          background: "rgba(0,0,0,0.5)", border: "0.5px solid rgba(255,255,255,0.15)",
          borderRadius: 20, padding: "8px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, color: "#F4F7F7", fontSize: 12, fontFamily: "inherit",
        }}>
          <Icon name="back" size={14} color="#F4F7F7" /> Retour
        </button>

        {/* Statut dispo en live */}
        {spot.pass === "Gold" && spot.statut && (
          <div style={{ position: "absolute", top: 52, right: 16 }}>
            <StatusBadge statut={spot.statut} />
          </div>
        )}
      </div>

      <div style={{ padding: "0 20px", marginTop: -30, position: "relative" }}>
        <div style={{ marginBottom: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <PassBadge type={spot.pass} />
          <span style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", letterSpacing: "0.15em" }}>{spot.cat.toUpperCase()}</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F4F7F7", lineHeight: 1.2, marginBottom: 4, fontStyle: "italic" }}>{spot.nom}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          <Icon name="map" size={13} color="#C8920A" />
          <span style={{ fontSize: 11, color: "#C8920A", letterSpacing: "0.1em" }}>{spot.ville} · {spot.region}</span>
        </div>
        <p style={{ fontSize: 14, color: "rgba(244,247,247,0.5)", fontStyle: "italic", marginBottom: 16, lineHeight: 1.6, borderLeft: "2px solid #C8920A", paddingLeft: 14 }}>
          {spot.slogan}
        </p>
        <p style={{ fontSize: 13, color: "rgba(244,247,247,0.7)", lineHeight: 1.8, marginBottom: 24 }}>{spot.description}</p>

        {/* Infos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[["Catégorie", spot.cat], ["Pass", spot.pass], ["Région", spot.region], ["GPS", spot.gps]].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px" }}>
              <p style={{ fontSize: 9, color: "rgba(244,247,247,0.35)", letterSpacing: "0.15em", marginBottom: 3 }}>{l.toUpperCase()}</p>
              <p style={{ fontSize: 12, color: "#F4F7F7", fontWeight: 600 }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Réseaux sociaux Gold */}
        {spot.pass === "Gold" && (socialLinks.whatsapp || socialLinks.facebook || socialLinks.instagram || socialLinks.messenger) && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 10 }}>NOUS SUIVRE</p>
            <div style={{ display: "flex", gap: 10 }}>
              {socialLinks.whatsapp && (
                <a href={`https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" style={{ ...socialBtnStyle, background: "rgba(37,211,102,0.15)", borderColor: "rgba(37,211,102,0.3)" }}>
                  <Icon name="whatsapp" size={18} color="#25D166" />
                </a>
              )}
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noreferrer" style={{ ...socialBtnStyle, background: "rgba(24,119,242,0.15)", borderColor: "rgba(24,119,242,0.3)" }}>
                  <Icon name="fb" size={18} color="#1877F2" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noreferrer" style={{ ...socialBtnStyle, background: "rgba(228,64,95,0.15)", borderColor: "rgba(228,64,95,0.3)" }}>
                  <Icon name="ig" size={18} color="#E4405F" />
                </a>
              )}
              {socialLinks.messenger && (
                <a href={socialLinks.messenger} target="_blank" rel="noreferrer" style={{ ...socialBtnStyle, background: "rgba(0,132,255,0.15)", borderColor: "rgba(0,132,255,0.3)" }}>
                  <Icon name="messenger" size={18} color="#0084FF" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Formulaire de réservation (Gold uniquement) */}
        {spot.pass === "Gold" && (
          <>
            {!showResaForm ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                <button onClick={() => setShowResaForm(true)} style={{
                  padding: "14px 0", background: "#C8920A", color: "#0D2B30",
                  border: "none", borderRadius: 12, fontWeight: 800, fontSize: 12,
                  letterSpacing: "0.1em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <Icon name="calendar" size={16} color="#0D2B30" /> RÉSERVER
                </button>
                <a href={`https://wa.me/${spot.wa.replace(/[^0-9]/g, "")}`} style={{
                  padding: "14px 0", background: "rgba(37,211,102,0.15)", color: "#25D166",
                  border: "1px solid rgba(37,211,102,0.3)", borderRadius: 12, fontWeight: 800, fontSize: 12,
                  letterSpacing: "0.1em", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <Icon name="whatsapp" size={16} color="#25D166" /> WHATSAPP
                </a>
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 18, marginBottom: 24, overflow: "hidden", border: "0.5px solid rgba(200,146,10,0.2)" }}>
                <ReservationForm spot={spot} onClose={() => setShowResaForm(false)} />
              </div>
            )}
          </>
        )}

        {/* Standard : WhatsApp seulement */}
        {spot.pass !== "Gold" && (
          <a href={`https://wa.me/${spot.wa.replace(/[^0-9]/g, "")}`} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#C8920A", color: "#0D2B30", borderRadius: 16, padding: "16px",
            fontWeight: 800, fontSize: 13, letterSpacing: "0.15em", textDecoration: "none",
          }}>
            <Icon name="whatsapp" size={18} color="#0D2B30" /> CONTACTER SUR WHATSAPP
          </a>
        )}
      </div>
    </div>
  );
};

const socialBtnStyle = {
  width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
  border: "1px solid", textDecoration: "none",
};

// ─── SPOT CARD ────────────────────────────────────────────────
const SpotCard = ({ spot, onClick }) => {
  const [hov, setHov] = useState(false);
  const isGold = spot.pass === "Gold";
  return (
    <div
      onClick={() => onClick(spot)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: isGold
          ? `0.5px solid ${hov ? "rgba(200,146,10,0.7)" : "rgba(200,146,10,0.25)"}`
          : `0.5px solid ${hov ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 18, overflow: "hidden", cursor: "pointer",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.15s, border-color 0.15s",
        boxShadow: isGold && hov ? "0 4px 24px rgba(200,146,10,0.12)" : "none",
      }}
    >
      <div style={{ position: "relative", height: 140 }}>
        <img src={spot.img} alt={spot.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {isGold && (
          <div style={{
            position: "absolute", inset: 0,
            boxShadow: "inset 0 0 0 1.5px rgba(200,146,10,0.5)",
            pointerEvents: "none",
          }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
          <PassBadge type={spot.pass} />
        </div>
        {spot.statut && (
          <div style={{ position: "absolute", bottom: 10, left: 10 }}>
            <StatusBadge statut={spot.statut} />
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.2em", marginBottom: 4, fontWeight: 600 }}>{spot.ville.toUpperCase()}</p>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F4F7F7", marginBottom: 4, lineHeight: 1.3 }}>{spot.nom}</h3>
        <p style={{ fontSize: 11, color: "rgba(244,247,247,0.45)", fontStyle: "italic" }}>{spot.slogan}</p>
      </div>
    </div>
  );
};

// ─── BANNIÈRE PUBLICITAIRE ────────────────────────────────────
const BannerAd = ({ ad }) => {
  if (!ad) return null;
  return (
    <div style={{
      margin: "0 0 20px", borderRadius: 16, overflow: "hidden",
      border: "0.5px solid rgba(200,146,10,0.3)",
      position: "relative", height: 80,
      background: "rgba(200,146,10,0.05)",
    }}>
      {ad.image_url && <img src={ad.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={ad.titre} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,43,48,0.9) 0%, transparent 60%)", display: "flex", alignItems: "center", padding: "0 16px" }}>
        <div>
          <p style={{ fontSize: 8, color: "#C8920A", letterSpacing: "0.2em", fontWeight: 700 }}>PUB</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{ad.titre}</p>
          <p style={{ fontSize: 10, color: "rgba(244,247,247,0.5)" }}>{ad.texte}</p>
        </div>
      </div>
    </div>
  );
};

// ─── ÉCRAN ACCUEIL ────────────────────────────────────────────
const HomeScreen = ({ city, setCity, onSpot, onMag, ads }) => {
  const filteredSpots = city === "Toute l'île" ? SPOTS_FALLBACK
    : city === "Tana" ? SPOTS_FALLBACK.filter(s => s.ville === "Antananarivo")
    : SPOTS_FALLBACK.filter(s => s.ville === city);

  const bannerAds = (ads || []).filter(a => a.type === "banniere" && a.actif);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
      {/* Hero mag */}
      <div style={{ margin: "0 16px 24px", position: "relative", height: 300, borderRadius: 24, overflow: "hidden", cursor: "pointer" }} onClick={() => onMag(MAG[0])}>
        <img src={MAG[0].img} alt="hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, rgba(13,43,48,0.3) 50%, transparent 100%)" }} />
        <div style={{ position: "absolute", inset: 0, padding: "24px 22px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4em", color: "#C8920A", marginBottom: 6 }}>À LA UNE DU MAG</span>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F4F7F7", lineHeight: 1.25, marginBottom: 8, fontStyle: "italic" }}>{MAG[0].titre} — {MAG[0].soustitre}</h2>
          <div style={{ width: 36, height: 1, background: "#C8920A", marginBottom: 10 }} />
          <span style={{ fontSize: 10, color: "rgba(244,247,247,0.6)", letterSpacing: "0.2em", display: "flex", alignItems: "center", gap: 6 }}>
            LIRE L'EXPÉRIENCE <Icon name="chevron" size={12} color="rgba(244,247,247,0.6)" />
          </span>
        </div>
      </div>

      {/* Filtre villes */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 20px", scrollbarWidth: "none" }}>
        {VILLES.map(v => (
          <button key={v} onClick={() => setCity(v)} style={{
            flexShrink: 0, padding: "8px 18px", borderRadius: 30,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
            background: city === v ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: city === v ? "#0D2B30" : "rgba(244,247,247,0.5)",
            border: city === v ? "none" : "0.5px solid rgba(255,255,255,0.1)",
          }}>{v.toUpperCase()}</button>
        ))}
      </div>

      {/* Catégories */}
      <div style={{ padding: "0 16px 8px" }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 12 }}>CATÉGORIES</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.id} style={{
              background: "rgba(255,255,255,0.03)",
              border: `0.5px solid ${cat.glow}25`,
              borderLeft: `2px solid ${cat.glow}`,
              borderRadius: 14, padding: "14px 14px", cursor: "pointer",
            }}>
              <div style={{ fontSize: 20, marginBottom: 6, color: cat.glow }}>{cat.icon}</div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#F4F7F7", lineHeight: 1.3, marginBottom: 2 }}>{cat.name}</p>
              <p style={{ fontSize: 9, color: "rgba(244,247,247,0.3)", letterSpacing: "0.1em" }}>{cat.sub}</p>
            </div>
          ))}
        </div>

        {/* Bannière pub après catégories */}
        {bannerAds[0] && <BannerAd ad={bannerAds[0]} />}
      </div>

      {/* Spots */}
      <div style={{ padding: "0 16px" }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 12 }}>
          SPOTS SÉLECTIONNÉS — {filteredSpots.length} ADRESSES
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {filteredSpots.map((s, idx) => (
            <div key={s.id}>
              <SpotCard spot={s} onClick={onSpot} />
              {/* Bannière toutes les 5 cartes */}
              {(idx + 1) % 5 === 0 && bannerAds[1] && <div style={{ marginTop: 12 }}><BannerAd ad={bannerAds[1]} /></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── ÉCRAN MAG ────────────────────────────────────────────────
const MagScreen = ({ onArticle }) => (
  <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100, padding: "0 16px 100px" }}>
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 4 }}>ÉDITION PREMIUM</p>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F4F7F7", fontStyle: "italic" }}>WAYZA MAG</h2>
    </div>
    <div onClick={() => onArticle(MAG[0])} style={{
      position: "relative", height: 320, borderRadius: 20, overflow: "hidden",
      cursor: "pointer", marginBottom: 16, border: "0.5px solid rgba(200,146,10,0.2)",
    }}>
      <img src={MAG[0].img} alt={MAG[0].titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", inset: 0, padding: 22, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 6 }}>{MAG[0].tag}</span>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#F4F7F7", lineHeight: 1.25, fontStyle: "italic", marginBottom: 10 }}>
          {MAG[0].titre}<br /><span style={{ fontSize: 15, fontWeight: 600 }}>{MAG[0].soustitre}</span>
        </h3>
        <span style={{ fontSize: 10, color: "rgba(244,247,247,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
          {MAG[0].date} · {MAG[0].spot} <Icon name="chevron" size={11} color="rgba(244,247,247,0.4)" />
        </span>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {MAG.slice(1).map(a => (
        <div key={a.id} onClick={() => onArticle(a)} style={{
          position: "relative", height: 200, borderRadius: 16, overflow: "hidden",
          cursor: "pointer", border: "0.5px solid rgba(200,146,10,0.15)",
        }}>
          <img src={a.img} alt={a.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 12px" }}>
            <p style={{ fontSize: 8, color: "#C8920A", letterSpacing: "0.2em", fontWeight: 700, marginBottom: 3 }}>{a.tag}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#F4F7F7", lineHeight: 1.25, fontStyle: "italic" }}>{a.titre}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── ÉCRAN ARTICLE ────────────────────────────────────────────
const ArticleScreen = ({ article, onBack }) => (
  <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
    <div style={{ position: "relative", height: 280 }}>
      <img src={article.img} alt={article.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, transparent 50%)" }} />
      <button onClick={onBack} style={{
        position: "absolute", top: 52, left: 16,
        background: "rgba(0,0,0,0.5)", border: "0.5px solid rgba(255,255,255,0.15)",
        borderRadius: 20, padding: "8px 14px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6, color: "#F4F7F7", fontSize: 12, fontFamily: "inherit",
      }}>
        <Icon name="back" size={14} color="#F4F7F7" /> Mag
      </button>
    </div>
    <div style={{ padding: "20px 20px 0" }}>
      <span style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700 }}>{article.tag}</span>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F4F7F7", fontStyle: "italic", lineHeight: 1.2, margin: "8px 0 4px" }}>{article.titre}</h1>
      <p style={{ fontSize: 16, color: "rgba(244,247,247,0.6)", marginBottom: 16, fontStyle: "italic" }}>{article.soustitre}</p>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <span style={{ fontSize: 10, color: "rgba(244,247,247,0.35)" }}>{article.date}</span>
        <span style={{ fontSize: 10, color: "#C8920A" }}>✦ {article.spot}</span>
      </div>
      <div style={{ width: 40, height: 1, background: "#C8920A", marginBottom: 20 }} />
      <p style={{ fontSize: 14, color: "rgba(244,247,247,0.75)", lineHeight: 1.9 }}>{article.corps}</p>
    </div>
  </div>
);

// ─── ÉCRAN URGENCES ───────────────────────────────────────────
const UrgencesScreen = () => {
  const villes = [...new Set(URGENCES.map(u => u.ville))];
  const tc = { med: "#c0392b", pol: "#2980b9", pharm: "#27ae60", amb: "#C8920A" };
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100, padding: "0 16px 100px" }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 4 }}>CONTACTS ESSENTIELS</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F4F7F7" }}>Urgences</h2>
      </div>
      <div style={{ background: "rgba(139,26,26,0.15)", border: "0.5px solid rgba(139,26,26,0.4)", borderRadius: 12, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>⊕</span>
        <p style={{ fontSize: 12, color: "rgba(244,200,200,0.8)", lineHeight: 1.5 }}>En cas d'urgence vitale, composez le 15 (SAMU) ou rendez-vous aux urgences les plus proches.</p>
      </div>
      {villes.map(v => (
        <div key={v} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>{v.toUpperCase()}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {URGENCES.filter(u => u.ville === v).map((u, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: `0.5px solid ${tc[u.type]}40`,
                borderLeft: `2.5px solid ${tc[u.type]}`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#F4F7F7" }}>{u.nom}</p>
                  <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", marginTop: 2 }}>{u.service} · {u.quartier}</p>
                </div>
                <a href={`tel:${u.contact.replace(/\s/g, "")}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#C8920A22", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="phone" size={13} color="#C8920A" />
                    <span style={{ fontSize: 11, color: "#C8920A", fontWeight: 700 }}>{u.contact}</span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── POPUP FORCE FRAPPE ───────────────────────────────────────
const ForceFrappePopup = ({ ad, onClose }) => {
  const [canClose, setCanClose] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!ad) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(8px)",
    }}>
      <div style={{
        width: "100%", maxWidth: 340,
        borderRadius: 32, overflow: "hidden",
        border: "0.5px solid rgba(200,146,10,0.4)",
        position: "relative",
      }}>
        {canClose ? (
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14, zIndex: 10,
            background: "rgba(0,0,0,0.6)", border: "0.5px solid rgba(255,255,255,0.15)",
            borderRadius: "50%", width: 34, height: 34, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="x" size={16} color="#F4F7F7" />
          </button>
        ) : (
          <div style={{
            position: "absolute", top: 14, right: 14, zIndex: 10,
            background: "rgba(0,0,0,0.6)", border: "0.5px solid rgba(200,146,10,0.4)",
            borderRadius: "50%", width: 34, height: 34,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CountdownRing />
          </div>
        )}
        <div style={{ height: 440, position: "relative" }}>
          {ad.image_url
            ? <img src={ad.image_url} alt={ad.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0D2B30, #1A4A6B)" }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0, padding: "0 28px 32px", display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "center", alignItems: "center" }}>
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.35em", fontWeight: 700, marginBottom: 8 }}>PARTENAIRE GOLD</p>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: "#F4F7F7", fontStyle: "italic", lineHeight: 1.25, marginBottom: 12 }}>{ad.titre}</h3>
            {ad.texte && <p style={{ fontSize: 13, color: "rgba(244,247,247,0.7)", marginBottom: 20 }}>{ad.texte}</p>}
            {ad.lien_wa && (
              <a href={`https://wa.me/${ad.lien_wa.replace(/[^0-9]/g, "")}`} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "#C8920A", color: "#0D2B30", borderRadius: 50,
                padding: "14px 28px", fontWeight: 800, fontSize: 12, letterSpacing: "0.12em",
                textDecoration: "none", width: "100%",
              }}>
                <Icon name="whatsapp" size={17} color="#0D2B30" />
                {ad.cta || "RÉSERVER SUR WHATSAPP"}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Cercle de compte à rebours 3s
const CountdownRing = () => {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setProg(p => Math.min(p + 1, 30)), 100);
    return () => clearInterval(interval);
  }, []);
  const r = 12, c = 2 * Math.PI * r;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      <circle cx="14" cy="14" r={r} fill="none" stroke="#C8920A" strokeWidth="2"
        strokeDasharray={c} strokeDashoffset={c - (prog / 30) * c}
        strokeLinecap="round" transform="rotate(-90 14 14)" />
      <text x="14" y="14" textAnchor="middle" dominantBaseline="central" fill="#F4F7F7" fontSize="9" fontWeight="bold">
        {3 - Math.floor(prog / 10)}
      </text>
    </svg>
  );
};

// ─── APPLICATION PRINCIPALE ───────────────────────────────────
export default function WayzaPrestigeApp() {
  const [tab, setTab] = useState("home");
  const [city, setCity] = useState("Nosy Be");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [activeAd, setActiveAd] = useState(null);
  const [ads, setAds] = useState([]);

  // Chargement des pubs depuis Supabase
  useEffect(() => {
    const loadAds = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase
          .from("ads_regie")
          .select("*")
          .eq("actif", true)
          .lte("date_debut", today)
          .gte("date_fin", today);
        if (data?.length) {
          setAds(data);
          const ff = data.find(a => a.type === "force_frappe");
          if (ff) {
            setTimeout(() => { setActiveAd(ff); setShowPopup(true); }, 2800);
          }
        } else {
          // Fallback : popup statique
          setTimeout(() => {
            setActiveAd({
              titre: "Sky Bar Zoma",
              texte: "La nuit vous appartient",
              image_url: "https://images.unsplash.com/photo-1566417713040-d7384c63051b?w=600&q=80",
              lien_wa: "+261320044002",
              cta: "RÉSERVER SUR WHATSAPP",
            });
            setShowPopup(true);
          }, 2800);
        }
      } catch {
        setTimeout(() => {
          setActiveAd({
            titre: "Sky Bar Zoma",
            texte: "La nuit vous appartient",
            image_url: "https://images.unsplash.com/photo-1566417713040-d7384c63051b?w=600&q=80",
            lien_wa: "+261320044002",
            cta: "RÉSERVER SUR WHATSAPP",
          });
          setShowPopup(true);
        }, 2800);
      }
    };
    loadAds();
  }, []);

  // Ticker dynamique
  const tickerText = ads.find(a => a.type === "ticker")?.texte
    || "✦ NOSY BE : Orchidea Club — VIP Gold ✦ SAINTE MARIE : Baie des Baleines Lodge ✦ TAOLAGNARO : Waves & Grace ✦ TANA : Sky Bar Zoma — La ville à vos pieds ✦";

  const navItems = [
    { id: "home", icon: "home", label: "ACCUEIL" },
    { id: "mag",  icon: "book", label: "MAG" },
    { id: "urg",  icon: "shield", label: "URGENCES" },
  ];

  const renderMain = () => {
    if (selectedSpot) return <SpotDetailScreen spot={selectedSpot} onBack={() => setSelectedSpot(null)} />;
    if (tab === "home") return <HomeScreen city={city} setCity={setCity} onSpot={setSelectedSpot} onMag={a => { setSelectedArticle(a); setTab("mag"); }} ads={ads} />;
    if (tab === "mag") {
      if (selectedArticle) return <ArticleScreen article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
      return <MagScreen onArticle={a => setSelectedArticle(a)} />;
    }
    if (tab === "urg") return <UrgencesScreen />;
  };

  return (
    <div style={{
      width: "100%", maxWidth: "var(--app-max)", margin: "0 auto",
      height: "100dvh",
      background: "#0D2B30", color: "#F4F7F7",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex", flexDirection: "column", position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        :root { --app-max: 100vw; }
        @media (min-width: 768px) { :root { --app-max: 430px; } }
        @media (orientation: landscape) and (max-width: 767px) { :root { --app-max: 100vw; } }
        @keyframes ticker { 0%{transform:translateX(100%)} 100%{transform:translateX(-200%)} }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; box-sizing: border-box; margin: 0; padding: 0; }
        input, button { font-family: 'Georgia', 'Times New Roman', serif; }
        input[type="date"], input[type="time"] { color-scheme: dark; }
        body { background: #0D2B30; }
      `}</style>

      {/* Ticker dynamique */}
      <div style={{ background: "#000", padding: "8px 0", borderBottom: "0.5px solid rgba(200,146,10,0.2)", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ animation: "ticker 28s linear infinite", whiteSpace: "nowrap", display: "inline-block" }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", color: "#C8920A", fontFamily: "Arial, sans-serif" }}>
            {tickerText}
          </span>
        </div>
      </div>

      {/* Header */}
      {!selectedSpot && (
        <div style={{ padding: "16px 20px 10px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: "0.4em", color: "rgba(244,247,247,0.4)", fontFamily: "Arial, sans-serif", marginBottom: 2 }}>MADAGASCAR</p>
            <h1 style={{ fontSize: 30, fontWeight: 800, fontStyle: "italic", lineHeight: 1, color: "#F4F7F7" }}>
              WAYZA <span style={{ color: "#C8920A" }}>2026</span>
            </h1>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="map" size={17} color="#C8920A" />
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {renderMain()}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 20px 20px", background: "linear-gradient(to top, #0D2B30 60%, transparent)", flexShrink: 0 }}>
        <div style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 50, padding: "10px 24px", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          {navItems.map(item => {
            const active = tab === item.id && !selectedSpot;
            return (
              <button key={item.id} onClick={() => { setTab(item.id); setSelectedSpot(null); setSelectedArticle(null); }} style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 12px",
              }}>
                {item.id === "mag" ? (
                  <div style={{ width: 50, height: 50, marginTop: -28, background: active ? "#C8920A" : "rgba(200,146,10,0.2)", border: `2px solid ${active ? "#C8920A" : "rgba(200,146,10,0.4)"}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="sparkles" size={20} color={active ? "#0D2B30" : "#C8920A"} />
                  </div>
                ) : (
                  <Icon name={item.icon} size={20} color={active ? "#C8920A" : "rgba(244,247,247,0.35)"} />
                )}
                {item.id !== "mag" && (
                  <span style={{ fontSize: 8, color: active ? "#C8920A" : "rgba(244,247,247,0.3)", letterSpacing: "0.15em", fontFamily: "Arial, sans-serif", fontWeight: 700 }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Popup Force Frappe */}
      {showPopup && <ForceFrappePopup ad={activeAd} onClose={() => setShowPopup(false)} />}
    </div>
  );
}
