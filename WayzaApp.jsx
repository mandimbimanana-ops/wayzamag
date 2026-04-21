// ============================================================
//  WAYZA 2026 — Application Principale
//  React + Supabase | Design Noir & Or
//  Admin : Mandimbimanana
//  v5 — Offres mises à jour : Tongasoa/Premium, Pop up,
//       Bannière Haut/Bas carrousel, Sponsorisé, Ticker,
//       Wayz'Mag, Boost Vendredi +30%
// ============================================================

import { useState, useEffect, useRef } from "react";

// ─── HOOK RESPONSIVE ─────────────────────────────────────────
function useLayout() {
  const getLayout = () => {
    if (typeof window === "undefined") return { isDesktop: false, isLandscape: false, isMobileLandscape: false };
    const w = window.innerWidth;
    const h = window.innerHeight;
    const landscape = w > h;
    const isDesktop = w >= 1024 || (w >= 768 && !landscape && h >= 600);
    const isMobileLandscape = landscape && !isDesktop;
    return { isDesktop, isLandscape: landscape, isMobileLandscape };
  };
  const [layout, setLayout] = useState(getLayout);
  useEffect(() => {
    const check = () => setLayout(getLayout());
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", () => setTimeout(check, 100));
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);
  return layout;
}

import { createClient } from "@supabase/supabase-js";

// ─── CONFIG SUPABASE ─────────────────────────────────────────
const SUPABASE_URL = "https://qmoesstuwetdugjgqbyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nDrqftliAC3EBFy4K7PuOQ_H7o2WOl_";
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

// ─── HELPER : EST-CE VENDREDI ? ──────────────────────────────
function isVendredi() {
  return new Date().getDay() === 5;
}

// Applique le boost vendredi +30% si applicable
function prixAvecBoost(prixBase) {
  return isVendredi() ? Math.round(prixBase * 1.3) : prixBase;
}

// ─── DONNÉES STATIQUES (fallback si Supabase indisponible) ───
const CATEGORIES = [
  { id: 1,  name: "Fast, Grill & Resto",    icon: "🔥",  glow: "#C8920A", sub: "Tables d'exception",    img: "/fast-grill-icon.png" },
  { id: 2,  name: "Lounge-K & Night Club",  icon: "🥂",  glow: "#1A4A6B", sub: "Vibration nocturne",     img: null },
  { id: 3,  name: "Pass & Glow",            icon: "✦",   glow: "#D4A0B0", sub: "Accès privilégié",       img: null },
  { id: 5,  name: "Fit, Body & Sport",      icon: "◉",   glow: "#1B6B4A", sub: "Luxe actif",              img: null },
  { id: 6,  name: "Window Shopper",         icon: "◇",   glow: "#6B1A2A", sub: "Créateurs rares",         img: null },
  { id: 7,  name: "Services",               icon: "⬡",   glow: "#2B2B6B", sub: "Conciergerie",            img: null },
  { id: 8,  name: "Wayz'Mag",               icon: "✦",   glow: "#C8920A", sub: "Le mag de Madagascar",    img: null },
  { id: 9,  name: "Automoto",               icon: "🚗",  glow: "#4A7A9A", sub: "Lavage, mécanique, ventes", img: null },
  { id: 10, name: "Voyager & découvrir",    icon: "🌍",  glow: "#1B6B4A", sub: "Destinations & évasion",  img: null },
  { id: 11, name: "Transport & transferts", icon: "🚌",  glow: "#6B4A1B", sub: "Mobilité & trajets",       img: null },
];

// pass : "Premium" (ex-Gold) | "Tongasoa" (ex-Standard)
const SPOTS_FALLBACK = [
  { id:1,  nom:"L'Écrin Vanille",         ville:"Sainte Marie",  region:"Analanjirofo", cat:"Fast, Grill & Resto",   pass:"Premium",  slogan:"L'île en bouche",                wa:"+261320011001", description:"Dans un jardin de palétuviers suspendus sur l'océan Indien, L'Écrin Vanille sublime la cuisine créole avec une précision gastronomique absolue.", gps:"-17.0833, 49.8500", img:"https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80", photos:[], social:{} },
  { id:2,  nom:"Baie des Baleines Lodge", ville:"Sainte Marie",  region:"Analanjirofo", cat:"Lounge-K & Night Club", pass:"Premium",  slogan:"Quand la nuit rejoint l'horizon", wa:"+261320011002", description:"Niché en surplomb de la baie la plus célèbre de l'île, ce lounge intimiste transforme chaque coucher de soleil en cérémonie privée.", gps:"-17.1200, 49.8700", img:"https://images.unsplash.com/photo-1566417713040-d7384c63051b?w=600&q=80", photos:[], social:{} },
  { id:3,  nom:"Villa Pandanus",          ville:"Sainte Marie",  region:"Analanjirofo", cat:"Fast, Grill & Resto",   pass:"Tongasoa", slogan:"La douceur comme art de vivre",   wa:"+261320011003", description:"La Villa Pandanus incarne le raffinement discret des adresses qui n'ont rien à prouver.", gps:"-17.0500, 49.8200", img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80", photos:[], social:{} },
  { id:4,  nom:"Sakamanga Nosy Be",       ville:"Nosy Be",       region:"Diana",        cat:"Fast, Grill & Resto",   pass:"Premium",  slogan:"La table de l'archipel",          wa:"+261320022001", description:"Face à l'Ile Ronde, la maison Sakamanga est un sanctuaire gastronomique.", gps:"-13.3167, 48.2667", img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80", photos:[], social:{} },
  { id:5,  nom:"Orchidea Club",           ville:"Nosy Be",       region:"Diana",        cat:"Lounge-K & Night Club", pass:"Premium",  slogan:"La nuit commence ici",            wa:"+261320022002", description:"L'Orchidea Club est l'épicentre de la vie nocturne premium de Nosy Be.", gps:"-13.3200, 48.2700", img:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80", photos:[], social:{} },
  { id:6,  nom:"Le Ylang Lounge",         ville:"Nosy Be",       region:"Diana",        cat:"Lounge-K & Night Club", pass:"Tongasoa", slogan:"Parfum de nuit, éclat d'or",      wa:"+261320022003", description:"Inspiré du fleuron floral de Nosy Be, le Ylang Lounge distille une atmosphère envoûtante.", gps:"-13.3100, 48.2500", img:"https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80", photos:[], social:{} },
  { id:7,  nom:"Fort Dauphin Sands",      ville:"Taolagnaro",    region:"Anosy",        cat:"Fast, Grill & Resto",   pass:"Premium",  slogan:"Le bout du monde à table",        wa:"+261320033001", description:"Au pied des massifs de l'Anosy, Fort Dauphin Sands propose une expérience culinaire sauvage et sophistiquée.", gps:"-25.0333, 46.9833", img:"https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&q=80", photos:[], social:{} },
  { id:8,  nom:"Waves & Grace",           ville:"Taolagnaro",    region:"Anosy",        cat:"Fit, Body & Sport",     pass:"Premium",  slogan:"Surfer l'excellence",             wa:"+261320033002", description:"Waves & Grace est l'unique surf lodge premium du Grand Sud malgache.", gps:"-25.0500, 46.9700", img:"https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&q=80", photos:[], social:{} },
  { id:9,  nom:"L'Anosy Club",            ville:"Taolagnaro",    region:"Anosy",        cat:"Lounge-K & Night Club", pass:"Tongasoa", slogan:"Là où l'Inde rencontre la nuit",  wa:"+261320033003", description:"L'Anosy Club incarne la renaissance culturelle de Taolagnaro.", gps:"-25.0200, 46.9900", img:"https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&q=80", photos:[], social:{} },
  { id:10, nom:"Le Jardin des Délices",   ville:"Antananarivo",  region:"Analamanga",   cat:"Fast, Grill & Resto",   pass:"Premium",  slogan:"La capitale en saveurs",          wa:"+261320044001", description:"Caché derrière les hauts murs d'un riad d'Ambatonakanga, Le Jardin des Délices est la table de référence des Hautes Terres.", gps:"-18.9167, 47.5167", img:"https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&q=80", photos:[], social:{} },
  { id:11, nom:"Sky Bar Zoma",            ville:"Antananarivo",  region:"Analamanga",   cat:"Lounge-K & Night Club", pass:"Premium",  slogan:"La ville à vos pieds",            wa:"+261320044002", description:"Au vingtième étage surplombant Analakely, le Sky Bar Zoma offre le panorama le plus envoûtant de la capitale.", gps:"-18.9100, 47.5300", img:"https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&q=80", photos:[], social:{} },
  { id:12, nom:"Roots Spa & Wellness",    ville:"Antananarivo",  region:"Analamanga",   cat:"Fit, Body & Sport",     pass:"Premium",  slogan:"Régénérez l'essentiel",           wa:"+261320044003", description:"Premier institut holistique de Madagascar intégrant la phytothérapie malgache dans des protocoles internationaux.", gps:"-18.9300, 47.5100", img:"https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80", photos:[], social:{} },
  { id:13, nom:"Maison Boutique Isoraka", ville:"Antananarivo",  region:"Analamanga",   cat:"Window Shopper",        pass:"Tongasoa", slogan:"Le goût de la rareté",            wa:"+261320044004", description:"La Maison Boutique Isoraka rassemble les créateurs du design malgache contemporain.", gps:"-18.9250, 47.5200", img:"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80", photos:[], social:{} },
  { id:14, nom:"Le Refuge du Tampoketsa", ville:"Antananarivo",  region:"Analamanga",   cat:"Fast, Grill & Resto",   pass:"Tongasoa", slogan:"L'âme de la terre malgache",     wa:"+261320044005", description:"À trente minutes du centre, Le Refuge du Tampoketsa transporte ses hôtes dans un paysage de collines dorées.", gps:"-18.8800, 47.4900", img:"https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80", photos:[], social:{} },
  { id:15, nom:"Azur Spa Tana",           ville:"Antananarivo",  region:"Analamanga",   cat:"Fit, Body & Sport",     pass:"Tongasoa", slogan:"Votre écrin de sérénité",        wa:"+261320044006", description:"Le rendez-vous des citadins en quête d'une pause hors du temps à Faravohitra.", gps:"-18.9050, 47.5350", img:"https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80", photos:[], social:{} },
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
    star_solid: <path d="M12 2l3 6.5H22l-5.5 4 2 6.5L12 15l-6.5 4 2-6.5L2 8.5h7z" fill="currentColor" stroke="none"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// ─── COMPOSANTS DE BASE ───────────────────────────────────────

// Pass Premium = badge or | Tongasoa = aucun badge
const PassBadge = ({ type }) => {
  if (type !== "Premium") return null;
  return (
    <span style={{
      background: "#C8920A",
      color: "#0D2B30",
      border: "none",
      fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
      padding: "3px 10px", borderRadius: 20, display: "inline-block",
    }}>
      ✦ PREMIUM
    </span>
  );
};

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

// ─── PASS & GLOW — CÔTÉ CLIENT ───────────────────────────────
const PassGlowClient = ({ spotId }) => {
  const [prestataires, setPrestataires] = useState([]);
  const [prestations,  setPrestations]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [onglet,       setOnglet]       = useState("equipe");

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: pr }, { data: ps }] = await Promise.all([
          supabase.from("prestataires").select("*").eq("spot_id", spotId).eq("actif", true).order("created_at"),
          supabase.from("prestations").select("*, prestataires(nom)").eq("spot_id", spotId).eq("actif", true).order("nom"),
        ]);
        setPrestataires(pr || []);
        setPrestations(ps || []);
      } catch { /* silencieux */ }
      setLoading(false);
    };
    load();
  }, [spotId]);

  if (loading) return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>✦ ÉQUIPE & PRESTATIONS</p>
      <p style={{ fontSize: 12, color: "rgba(244,247,247,0.35)", fontStyle: "italic" }}>Chargement…</p>
    </div>
  );

  if (prestataires.length === 0 && prestations.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 9, color: "#D4A0B0", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 14 }}>✦ ÉQUIPE & PRESTATIONS</p>

      {/* Onglets */}
      {prestataires.length > 0 && prestations.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[{ id: "equipe", l: "✦ Équipe" }, { id: "prestations", l: "◈ Soins & Services" }].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)} style={{
              flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit",
              background: onglet === o.id ? "#D4A0B0" : "rgba(212,160,176,0.06)",
              color: onglet === o.id ? "#0D2B30" : "rgba(212,160,176,0.7)",
              border: onglet === o.id ? "none" : "0.5px solid rgba(212,160,176,0.2)",
            }}>{o.l}</button>
          ))}
        </div>
      )}

      {/* Équipe */}
      {(onglet === "equipe" || prestations.length === 0) && prestataires.length > 0 && (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
          {prestataires.map(p => (
            <div key={p.id} style={{
              flexShrink: 0, textAlign: "center", width: 80,
              background: "rgba(212,160,176,0.06)", border: "0.5px solid rgba(212,160,176,0.2)",
              borderRadius: 14, padding: "12px 8px",
            }}>
              {p.photo_url
                ? <img src={p.photo_url} alt={p.nom} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", marginBottom: 8, border: "1.5px solid rgba(212,160,176,0.4)" }} />
                : <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(212,160,176,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 20 }}>👤</div>
              }
              <p style={{ fontSize: 11, fontWeight: 700, color: "#F4F7F7", lineHeight: 1.3, wordBreak: "break-word" }}>{p.nom}</p>
              {p.specialite && <p style={{ fontSize: 9, color: "rgba(212,160,176,0.7)", marginTop: 3, lineHeight: 1.3 }}>{p.specialite}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Prestations */}
      {(onglet === "prestations" || prestataires.length === 0) && prestations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {prestations.map(p => (
            <div key={p.id} style={{
              background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(212,160,176,0.2)",
              borderLeft: "3px solid rgba(212,160,176,0.5)", borderRadius: 12, padding: "12px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7", marginBottom: 3 }}>{p.nom}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "rgba(244,247,247,0.45)" }}>⏱ {p.duree_minutes < 60 ? `${p.duree_minutes}min` : `${p.duree_minutes / 60}h`}</span>
                  {p.prestataires && <span style={{ fontSize: 10, color: "rgba(212,160,176,0.6)" }}>✦ {p.prestataires.nom}</span>}
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#C8920A", marginLeft: 12, flexShrink: 0 }}>{p.prix}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── FIT, BODY & SPORT — CÔTÉ CLIENT ─────────────────────────
const FitSportClient = ({ spotId, spotWa }) => {
  const [seances,    setSeances]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [resaSeance, setResaSeance] = useState(null); // séance sélectionnée pour réserver
  const [form,       setForm]       = useState({ nom: "", wa: "" });
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(null); // id séance confirmée

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase
          .from("seances").select("*")
          .eq("spot_id", spotId).gte("date", today)
          .order("date").order("heure").limit(10);
        setSeances(data || []);
      } catch { /* silencieux */ }
      setLoading(false);
    };
    load();
  }, [spotId]);

  const handleReserver = async (s) => {
    if (!form.nom.trim()) return;
    setSending(true);
    try {
      // Incrémenter places_prises
      await supabase.from("seances")
        .update({ places_prises: (s.places_prises || 0) + 1 })
        .eq("id", s.id);

      // Enregistrer la réservation
      await supabase.from("reservations_seances").insert({
        seance_id:   s.id,
        spot_id:     spotId,
        client_nom:  form.nom.trim(),
        client_wa:   form.wa.trim() || null,
        seance_nom:  s.nom,
        date:        s.date,
        heure:       s.heure,
      });

      // WhatsApp au gérant
      if (spotWa) {
        const dateF = new Date(s.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
        const msg = encodeURIComponent(
          `🟢 *NOUVELLE RÉSERVATION SÉANCE — WAYZA*\n\n` +
          `🏋️ *${s.nom}*\n` +
          `📅 ${dateF} à ${s.heure}\n` +
          (s.coach ? `👤 Coach : ${s.coach}\n` : "") +
          `\n👤 Client : ${form.nom.trim()}\n` +
          (form.wa.trim() ? `📱 WhatsApp client : ${form.wa.trim()}\n` : "") +
          `\n_Via WAYZA 2026_`
        );
        window.open(`https://wa.me/${spotWa.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
      }

      // Mettre à jour localement
      setSeances(prev => prev.map(x => x.id === s.id ? { ...x, places_prises: (x.places_prises || 0) + 1 } : x));
      setSent(s.id);
      setResaSeance(null);
      setForm({ nom: "", wa: "" });
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  if (loading) return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 9, color: "#2ECC8A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>◉ SÉANCES À VENIR</p>
      <p style={{ fontSize: 12, color: "rgba(244,247,247,0.35)", fontStyle: "italic" }}>Chargement…</p>
    </div>
  );

  if (seances.length === 0) return null;

  const inputSt = {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(46,204,138,0.3)", borderRadius: 10,
    padding: "10px 14px", color: "#F4F7F7", fontSize: 13,
    fontFamily: "inherit", outline: "none", marginBottom: 10,
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 9, color: "#2ECC8A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 14 }}>◉ SÉANCES À VENIR</p>

      {/* Confirmation envoyée */}
      {sent && (
        <div style={{ background: "rgba(46,204,138,0.1)", border: "0.5px solid rgba(46,204,138,0.3)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#2ECC8A" }}>Réservation envoyée !</p>
            <p style={{ fontSize: 10, color: "rgba(244,247,247,0.45)" }}>Le gérant a reçu votre demande sur WhatsApp.</p>
          </div>
          <button onClick={() => setSent(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(244,247,247,0.3)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {seances.map(s => {
          const restantes = s.places_max - s.places_prises;
          const complet   = restantes <= 0;
          const pct       = Math.min(100, Math.round((s.places_prises / s.places_max) * 100));
          const dateF     = new Date(s.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
          const isOpen    = resaSeance === s.id;

          return (
            <div key={s.id} style={{
              background: "rgba(255,255,255,0.03)", borderRadius: 16, overflow: "hidden",
              border: `0.5px solid ${complet ? "rgba(231,76,60,0.2)" : isOpen ? "rgba(46,204,138,0.4)" : "rgba(46,204,138,0.15)"}`,
              borderLeft: `3px solid ${complet ? "#E74C3C" : "#2ECC8A"}`,
            }}>
              {/* Infos séance */}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#F4F7F7" }}>{s.nom}</p>
                      {s.snacking && (
                        <span style={{ fontSize: 9, background: "rgba(200,146,10,0.15)", color: "#C8920A", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 20, padding: "2px 8px", fontWeight: 700, flexShrink: 0 }}>🥤 Snacking</span>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: "rgba(244,247,247,0.5)", marginBottom: 3 }}>
                      📅 {dateF} à {s.heure}{"  "}·{"  "}⏱ {s.duree_min < 60 ? `${s.duree_min}min` : `${s.duree_min / 60}h`}
                    </p>
                    {s.coach && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.45)", marginBottom: 3 }}>🏋️ {s.coach}</p>}
                    {s.prix && <p style={{ fontSize: 11, color: "#C8920A", fontWeight: 700 }}>💰 {s.prix}</p>}
                  </div>
                  {/* Badge places */}
                  <span style={{
                    flexShrink: 0, marginLeft: 10, fontSize: 9, fontWeight: 800,
                    padding: "4px 10px", borderRadius: 20, letterSpacing: "0.08em",
                    background: complet ? "rgba(231,76,60,0.15)" : "rgba(46,204,138,0.12)",
                    color: complet ? "#E74C3C" : "#2ECC8A",
                    border: `1px solid ${complet ? "rgba(231,76,60,0.3)" : "rgba(46,204,138,0.3)"}`,
                  }}>
                    {complet ? "COMPLET" : `${restantes} place${restantes > 1 ? "s" : ""}`}
                  </span>
                </div>

                {/* Barre progression */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: complet ? 0 : 12 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: complet ? "#E74C3C" : pct > 75 ? "#C8920A" : "#2ECC8A", transition: "width 0.4s" }} />
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(244,247,247,0.35)", flexShrink: 0, fontFamily: "monospace" }}>{s.places_prises}/{s.places_max}</span>
                </div>

                {/* Bouton RÉSERVER */}
                {!complet && (
                  <button
                    onClick={() => setResaSeance(isOpen ? null : s.id)}
                    style={{
                      width: "100%", padding: "11px 0", borderRadius: 10, cursor: "pointer",
                      fontWeight: 800, fontSize: 12, letterSpacing: "0.1em", fontFamily: "inherit",
                      background: isOpen ? "rgba(46,204,138,0.08)" : "#2ECC8A",
                      color: isOpen ? "#2ECC8A" : "#0D2B30",
                      border: isOpen ? "1px solid rgba(46,204,138,0.4)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {isOpen ? "✕ ANNULER" : "◉ RÉSERVER CETTE SÉANCE"}
                  </button>
                )}
              </div>

              {/* Formulaire de réservation dépliable */}
              {isOpen && (
                <div style={{ borderTop: "0.5px solid rgba(46,204,138,0.2)", padding: "16px 16px 18px", background: "rgba(46,204,138,0.04)" }}>
                  <p style={{ fontSize: 9, color: "#2ECC8A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 14 }}>VOTRE INSCRIPTION</p>
                  <input
                    placeholder="Votre nom *"
                    value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    style={inputSt}
                  />
                  <input
                    placeholder="Votre WhatsApp (optionnel)"
                    value={form.wa}
                    onChange={e => setForm({ ...form, wa: e.target.value })}
                    style={{ ...inputSt, marginBottom: 14 }}
                  />
                  <button
                    onClick={() => handleReserver(s)}
                    disabled={sending || !form.nom.trim()}
                    style={{
                      width: "100%", padding: "13px 0", background: form.nom.trim() ? "#2ECC8A" : "rgba(46,204,138,0.2)",
                      color: form.nom.trim() ? "#0D2B30" : "rgba(244,247,247,0.3)",
                      border: "none", borderRadius: 10,
                      fontWeight: 800, fontSize: 13, letterSpacing: "0.1em",
                      cursor: form.nom.trim() ? "pointer" : "default",
                      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      opacity: sending ? 0.6 : 1,
                    }}
                  >
                    <Icon name="whatsapp" size={16} color={form.nom.trim() ? "#0D2B30" : "rgba(244,247,247,0.3)"} />
                    {sending ? "ENVOI…" : "CONFIRMER VIA WHATSAPP"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── FICHE SPOT DÉTAILLÉE ─────────────────────────────────────
const SpotDetailScreen = ({ spot, onBack }) => {
  const [showResaForm, setShowResaForm] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const allPhotos = [spot.img, ...(spot.photos || [])].filter(Boolean);
  const socialLinks = spot.social || {};
  const isPremium = spot.pass === "Premium";
  const isPresence = !isPremium;

  // Mode réservation selon catégorie
  const modeResa = spot.mode_resa || (() => {
    if (spot.cat === "Window Shopper" || spot.cat === "Services") return "whatsapp";
    if (spot.cat === "Urgences") return "tel";
    return "calendrier";
  })();

  // Contacts WhatsApp toujours dispo pour tout le monde
  const hasWA = spot.wa && spot.wa.length > 5;

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 20, minHeight: 0 }}>
      {/* Galerie photos */}
      <div style={{ position: "relative", height: 260 }}>
        {allPhotos.length > 0 ? (
          <img src={allPhotos[photoIdx] || spot.img} alt={spot.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #0D2B30 0%, #1a4a50 60%, #0D2B30 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 48, opacity: 0.25 }}>📍</span>
            <p style={{ fontSize: 10, color: "rgba(244,247,247,0.2)", letterSpacing: "0.2em" }}>PHOTO BIENTÔT DISPONIBLE</p>
          </div>
        )}
        {isPremium && (
          <div style={{
            position: "absolute", inset: 0,
            boxShadow: "inset 0 0 0 2px rgba(200,146,10,0.6), inset 0 0 30px rgba(200,146,10,0.15)",
            pointerEvents: "none",
          }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, transparent 50%)" }} />

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

        {isPremium && spot.statut && (
          <div style={{ position: "absolute", top: 52, right: 16 }}>
            <StatusBadge statut={spot.statut} />
          </div>
        )}

        {/* Badge Premium visible en haut à droite */}
        {isPremium && !spot.statut && (
          <div style={{ position: "absolute", top: 52, right: 16 }}>
            <PassBadge type="Premium" />
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
        {spot.slogan && (
          <p style={{ fontSize: 14, color: "rgba(244,247,247,0.5)", fontStyle: "italic", marginBottom: 16, lineHeight: 1.6, borderLeft: "2px solid #C8920A", paddingLeft: 14 }}>
            {spot.slogan}
          </p>
        )}
        <p style={{ fontSize: 13, color: "rgba(244,247,247,0.7)", lineHeight: 1.8, marginBottom: 24 }}>{spot.description}</p>

        {/* Contacts rapides */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {hasWA && (
            <a href={`https://wa.me/${spot.wa.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" style={{ ...socialBtnStyle, background: "rgba(37,211,102,0.12)", borderColor: "rgba(37,211,102,0.3)" }}>
              <Icon name="whatsapp" size={18} color="#25D166" />
            </a>
          )}
          {spot.telephone && (
            <a href={`tel:${spot.telephone.replace(/\s/g,"")}`} style={{ ...socialBtnStyle, background: "rgba(200,146,10,0.1)", borderColor: "rgba(200,146,10,0.3)" }}>
              <Icon name="phone" size={18} color="#C8920A" />
            </a>
          )}
          {(socialLinks.instagram || spot.instagram) && (
            <a href={socialLinks.instagram || spot.instagram} target="_blank" rel="noreferrer" style={{ ...socialBtnStyle, background: "rgba(228,64,95,0.12)", borderColor: "rgba(228,64,95,0.3)" }}>
              <Icon name="ig" size={18} color="#E4405F" />
            </a>
          )}
          {(socialLinks.facebook || spot.facebook) && (
            <a href={socialLinks.facebook || spot.facebook} target="_blank" rel="noreferrer" style={{ ...socialBtnStyle, background: "rgba(24,119,242,0.12)", borderColor: "rgba(24,119,242,0.3)" }}>
              <Icon name="fb" size={18} color="#1877F2" />
            </a>
          )}
        </div>

        {/* Horaires */}
        {spot.horaires && Object.keys(spot.horaires).length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "14px 16px", marginBottom: 20, border: "0.5px solid rgba(200,146,10,0.15)" }}>
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>HORAIRES</p>
            {["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"].map(jour => {
              const h = spot.horaires[jour];
              if (!h) return null;
              const ouvert = h.ouvert !== false;
              return (
                <div key={jour} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "rgba(244,247,247,0.5)", textTransform: "capitalize", width: 90 }}>{jour}</span>
                  <span style={{ fontSize: 11, color: ouvert ? "#F4F7F7" : "rgba(244,247,247,0.3)", fontWeight: ouvert ? 600 : 400 }}>
                    {ouvert ? `${h.ouverture || "?"} – ${h.fermeture || "?"}` : "Fermé"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tarifs */}
        {(spot.tarif_entree || spot.tarif_fourchette || spot.happy_hour || spot.menu_jour || spot.tarif_vip) && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "14px 16px", marginBottom: 20, border: "0.5px solid rgba(200,146,10,0.15)" }}>
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>TARIFS</p>
            {[["Entrée", spot.tarif_entree], ["Fourchette", spot.tarif_fourchette], ["Happy Hour", spot.happy_hour], ["Menu du jour", spot.menu_jour], ["VIP", spot.tarif_vip]].filter(([,v]) => v).map(([l,v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "rgba(244,247,247,0.4)" }}>{l}</span>
                <span style={{ fontSize: 11, color: "#F4F7F7", fontWeight: 600, maxWidth: 180, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Paiements */}
        {spot.paiements && Object.values(spot.paiements).some(Boolean) && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 8 }}>PAIEMENTS</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[["visa","💳 Visa"],["mastercard","💳 Mastercard"],["mvola","📱 MVola"],["orange_money","📱 Orange Money"],["airtel_money","📱 Airtel Money"],["especes","💵 Espèces"]].filter(([k]) => spot.paiements[k]).map(([k,l]) => (
                <span key={k} style={{ fontSize: 10, background: "rgba(200,146,10,0.1)", border: "0.5px solid rgba(200,146,10,0.25)", borderRadius: 20, padding: "4px 10px", color: "rgba(244,247,247,0.7)" }}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Équipements */}
        {spot.equipements && Object.values(spot.equipements).some(Boolean) && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 8 }}>ÉQUIPEMENTS</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[["wifi","📶 WiFi"],["clim","❄️ Clim"],["terrasse","🪴 Terrasse"],["vue_mer","🌊 Vue mer"],["musique","🎵 Live"],["dj","🎧 DJ"],["karaoke","🎤 Karaoké"],["ecran_sport","📺 Sport"],["livraison","🛵 Livraison"],["emporter","📦 À emporter"]].filter(([k]) => spot.equipements[k]).map(([k,l]) => (
                <span key={k} style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 10px", color: "rgba(244,247,247,0.65)" }}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Adresse uniquement — GPS masqué aux utilisateurs */}
        {spot.adresse && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "12px 14px", marginBottom: 20, border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: 12, color: "rgba(244,247,247,0.6)" }}>📍 {spot.adresse}</p>
          </div>
        )}

        {/* Bouton itinéraire — utilise les coordonnées GPS en interne sans les afficher */}
        {spot.gps && (
          <button
            onClick={() => {
              const [lat, lng] = spot.gps.split(",").map(s => s.trim());
              const label = encodeURIComponent(spot.nom);
              // Ouvre Google Maps avec l'itinéraire depuis la position actuelle
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  pos => {
                    const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
                    window.open(`https://www.google.com/maps/dir/${origin}/${lat},${lng}`, "_blank");
                  },
                  () => {
                    // Si refus de géolocalisation, ouvre juste la destination
                    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`, "_blank");
                  }
                );
              } else {
                window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(200,146,10,0.1)", border: "0.5px solid rgba(200,146,10,0.35)",
              borderRadius: 14, padding: "12px 16px", cursor: "pointer",
              width: "100%", marginBottom: 20, fontFamily: "inherit",
              color: "#C8920A",
            }}
          >
            <Icon name="map" size={18} color="#C8920A" />
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#C8920A" }}>Voir l'itinéraire</p>
              <p style={{ fontSize: 10, color: "rgba(200,146,10,0.6)" }}>Depuis ma position actuelle</p>
            </div>
            <Icon name="chevron" size={14} color="rgba(200,146,10,0.5)" />
          </button>
        )}

        {/* Parking */}
        {spot.parking && (spot.parking.moto || spot.parking.auto || spot.parking.gardienne || spot.parking.note) && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "14px 16px", marginBottom: 20, border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>PARKING</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {spot.parking.moto && spot.parking.moto !== "non" && (
                <span style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", color: "rgba(244,247,247,0.7)" }}>
                  🏍 Moto — {spot.parking.moto}
                </span>
              )}
              {spot.parking.auto && spot.parking.auto !== "non" && (
                <span style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", color: "rgba(244,247,247,0.7)" }}>
                  🚗 Auto — {spot.parking.auto}
                </span>
              )}
              {spot.parking.gardienne && (
                <span style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", color: "rgba(244,247,247,0.7)" }}>
                  🔒 Gardienné
                </span>
              )}
            </div>
            {spot.parking.note && <p style={{ fontSize: 11, color: "rgba(244,247,247,0.45)", marginTop: 8, fontStyle: "italic" }}>ℹ️ {spot.parking.note}</p>}
          </div>
        )}

        {/* Ambiance */}
        {(spot.age_minimum || spot.dress_code || spot.style || spot.enfants === false) && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "14px 16px", marginBottom: 20, border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>AMBIANCE</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {spot.enfants === false && <span style={{ fontSize: 11, background: "rgba(231,76,60,0.08)", border: "0.5px solid rgba(231,76,60,0.2)", borderRadius: 20, padding: "4px 12px", color: "rgba(244,247,247,0.7)" }}>🔞 Adultes uniquement</span>}
              {spot.age_minimum && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", color: "rgba(244,247,247,0.7)" }}>🎂 {spot.age_minimum}</span>}
              {spot.dress_code && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", color: "rgba(244,247,247,0.7)" }}>👔 {spot.dress_code}</span>}
              {spot.style && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", color: "rgba(244,247,247,0.7)" }}>✨ {spot.style}</span>}
            </div>
          </div>
        )}

        {/* WiFi */}
        {spot.wifi_reseau && (
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "10px 16px", marginBottom: 20, border: "0.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>📶</span>
            <div>
              <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.2em", fontWeight: 700 }}>WIFI</p>
              <p style={{ fontSize: 12, color: "rgba(244,247,247,0.7)", fontFamily: "monospace" }}>{spot.wifi_reseau}</p>
            </div>
          </div>
        )}

        {/* Site web / TikTok */}
        {(spot.site_web || spot.tiktok) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {spot.site_web && (
              <a href={spot.site_web.startsWith("http") ? spot.site_web : "https://" + spot.site_web} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: "#C8920A", background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.25)", borderRadius: 20, padding: "6px 14px", textDecoration: "none" }}>
                🌐 Site web
              </a>
            )}
            {spot.tiktok && (
              <a href={spot.tiktok.startsWith("http") ? spot.tiktok : "https://tiktok.com/@" + spot.tiktok.replace("@","")} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: "rgba(244,247,247,0.7)", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 14px", textDecoration: "none" }}>
                🎵 TikTok
              </a>
            )}
          </div>
        )}

        {/* ── PASS & GLOW : Équipe & Prestations ── */}
        {spot.cat === "Pass & Glow" && <PassGlowClient spotId={spot.id} />}

        {/* ── FIT, BODY & SPORT : Séances à venir ── */}
        {spot.cat === "Fit, Body & Sport" && <FitSportClient spotId={spot.id} spotWa={spot.wa} />}

        {/* ── BOUTONS D'ACTION ── */}

        {/* Window Shopper & Services → WhatsApp direct (Présence ou Premium) */}
        {(spot.cat === "Window Shopper" || spot.cat === "Services") && hasWA && (
          <a href={`https://wa.me/${spot.wa.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#C8920A", color: "#0D2B30", borderRadius: 16, padding: "16px",
            fontWeight: 800, fontSize: 13, letterSpacing: "0.12em", textDecoration: "none", marginBottom: 24,
          }}>
            <Icon name="whatsapp" size={18} color="#0D2B30" /> CONTACTER SUR WHATSAPP
          </a>
        )}

        {/* Urgences → appel direct */}
        {spot.cat === "Urgences" && spot.telephone && (
          <a href={`tel:${spot.telephone.replace(/\s/g,"")}`} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#8B1A1A", color: "#F4F7F7", borderRadius: 16, padding: "16px",
            fontWeight: 800, fontSize: 13, letterSpacing: "0.12em", textDecoration: "none", marginBottom: 24,
          }}>
            <Icon name="phone" size={18} color="#F4F7F7" /> APPEL DIRECT
          </a>
        )}

        {/* Catégories avec réservation Premium */}
        {!["Window Shopper","Services","Urgences"].includes(spot.cat) && (
          <>
            {isPremium ? (
              !showResaForm ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                  <button onClick={() => setShowResaForm(true)} style={{
                    padding: "14px 0", background: "#C8920A", color: "#0D2B30",
                    border: "none", borderRadius: 12, fontWeight: 800, fontSize: 12,
                    letterSpacing: "0.1em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <Icon name="calendar" size={16} color="#0D2B30" /> RÉSERVER
                  </button>
                  {hasWA && (
                    <a href={`https://wa.me/${spot.wa.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" style={{
                      padding: "14px 0", background: "rgba(37,211,102,0.15)", color: "#25D166",
                      border: "1px solid rgba(37,211,102,0.3)", borderRadius: 12, fontWeight: 800, fontSize: 12,
                      letterSpacing: "0.1em", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                      <Icon name="whatsapp" size={16} color="#25D166" /> WHATSAPP
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 18, marginBottom: 24, overflow: "hidden", border: "0.5px solid rgba(200,146,10,0.2)" }}>
                  <ReservationForm spot={spot} onClose={() => setShowResaForm(false)} />
                </div>
              )
            ) : (
              /* Présence : WhatsApp seulement */
              hasWA ? (
                <a href={`https://wa.me/${spot.wa.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "#C8920A", color: "#0D2B30", borderRadius: 16, padding: "16px",
                  fontWeight: 800, fontSize: 13, letterSpacing: "0.15em", textDecoration: "none", marginBottom: 24,
                }}>
                  <Icon name="whatsapp" size={18} color="#0D2B30" /> CONTACTER SUR WHATSAPP
                </a>
              ) : (
                <div style={{ background: "rgba(200,146,10,0.06)", border: "0.5px solid rgba(200,146,10,0.2)", borderRadius: 14, padding: "16px", marginBottom: 24, textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "rgba(244,247,247,0.4)", lineHeight: 1.5 }}>🔒 Réservations disponibles en offre Premium</p>
                </div>
              )
            )}
          </>
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
  const isPremium = spot.pass === "Premium";
  return (
    <div
      onClick={() => onClick(spot)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: isPremium
          ? `0.5px solid ${hov ? "rgba(200,146,10,0.7)" : "rgba(200,146,10,0.25)"}`
          : `0.5px solid ${hov ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 18, overflow: "hidden", cursor: "pointer",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.15s, border-color 0.15s",
        boxShadow: isPremium && hov ? "0 4px 24px rgba(200,146,10,0.12)" : "none",
      }}
    >
      <div style={{ position: "relative", height: 140 }}>
        {spot.img ? (
          <img src={spot.img} alt={spot.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0D2B30 0%, #1a3a40 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 36, opacity: 0.3 }}>📍</span>
          </div>
        )}
        {isPremium && (
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

// ─── BANNIÈRE HAUT — CARROUSEL ────────────────────────────────
const BanniereHautCarousel = ({ ads }) => {
  const [idx, setIdx] = useState(0);
  const filtered = (ads || []).filter(a => a.type === "banniere_haut" && a.actif);
  useEffect(() => {
    if (filtered.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % filtered.length), 4000);
    return () => clearInterval(t);
  }, [filtered.length]);
  if (!filtered.length) return (
    <div style={{ margin: "0 0 20px", borderRadius: 16, border: "1px dashed rgba(200,146,10,0.25)", height: 90, background: "rgba(200,146,10,0.03)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <span style={{ fontSize: 16 }}>📢</span>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(200,146,10,0.6)" }}>Votre pub ici !</p>
        <p style={{ fontSize: 9, color: "rgba(244,247,247,0.25)", letterSpacing: "0.1em" }}>Contactez <span style={{ color: "#C8920A" }}>#wayza</span></p>
      </div>
    </div>
  );
  const ad = filtered[idx];
  return (
    <div style={{ margin: "0 0 20px", borderRadius: 16, overflow: "hidden", border: "0.5px solid rgba(200,146,10,0.3)", position: "relative", height: 90, background: "rgba(200,146,10,0.05)", cursor: "pointer" }}
      onClick={() => ad.lien_wa && window.open(`https://wa.me/${ad.lien_wa.replace(/[^0-9]/g,"")}`, "_blank")}>
      {ad.image_url && <img src={ad.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={ad.titre} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,43,48,0.92) 0%, transparent 65%)", display: "flex", alignItems: "center", padding: "0 16px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 8, color: "#C8920A", letterSpacing: "0.2em", fontWeight: 700, marginBottom: 2 }}>✦ BANNIÈRE HAUT</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#F4F7F7" }}>{ad.titre}</p>
          {ad.texte && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.55)", marginTop: 2 }}>{ad.texte}</p>}
        </div>
        {filtered.length > 1 && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {filtered.map((_, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{
                width: i === idx ? 14 : 5, height: 5, borderRadius: 3,
                background: i === idx ? "#C8920A" : "rgba(200,146,10,0.3)",
                cursor: "pointer", transition: "all 0.3s",
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── BANNIÈRE BAS — CARROUSEL ─────────────────────────────────
const BanniereBasCarousel = ({ ads }) => {
  const [idx, setIdx] = useState(0);
  const filtered = (ads || []).filter(a => a.type === "banniere_bas" && a.actif);
  useEffect(() => {
    if (filtered.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % filtered.length), 3500);
    return () => clearInterval(t);
  }, [filtered.length]);
  if (!filtered.length) return (
    <div style={{ margin: "16px 0 0", borderRadius: 12, border: "1px dashed rgba(200,146,10,0.2)", height: 54, background: "rgba(200,146,10,0.02)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <span style={{ fontSize: 13 }}>📢</span>
      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(200,146,10,0.5)" }}>Votre pub ici ! <span style={{ color: "#C8920A" }}>#wayza</span></p>
    </div>
  );
  const ad = filtered[idx];
  return (
    <div style={{ margin: "16px 0 0", borderRadius: 12, overflow: "hidden", border: "0.5px solid rgba(200,146,10,0.2)", position: "relative", height: 54, background: "rgba(0,0,0,0.4)", cursor: "pointer" }}
      onClick={() => ad.lien_wa && window.open(`https://wa.me/${ad.lien_wa.replace(/[^0-9]/g,"")}`, "_blank")}>
      {ad.image_url && <img src={ad.image_url} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} alt={ad.titre} />}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
        <p style={{ fontSize: 9, color: "#C8920A", fontWeight: 700, letterSpacing: "0.15em", flexShrink: 0 }}>PUB</p>
        <div style={{ width: 1, height: 16, background: "rgba(200,146,10,0.3)" }} />
        <p style={{ fontSize: 12, fontWeight: 700, color: "#F4F7F7", flex: 1 }}>{ad.titre}</p>
        {ad.texte && <p style={{ fontSize: 10, color: "rgba(244,247,247,0.45)", flexShrink: 0, maxWidth: 100, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{ad.texte}</p>}
        {filtered.length > 1 && (
          <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            {filtered.map((_, i) => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: i === idx ? "#C8920A" : "rgba(200,146,10,0.3)" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SPOT SPONSORISÉ ─────────────────────────────────────────
// Injecte un spot sponsorisé en première position de la liste
const SponsoriseCard = ({ ad, onClick, spots }) => {
  if (!ad || !ad.actif) return (
    <div style={{
      background: "rgba(200,146,10,0.03)",
      border: "1px dashed rgba(200,146,10,0.2)",
      borderRadius: 18, height: 80,
      gridColumn: "1 / -1", marginBottom: 4,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>📢</span>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(200,146,10,0.55)" }}>Votre pub ici !</p>
        <p style={{ fontSize: 9, color: "rgba(244,247,247,0.2)", letterSpacing: "0.12em" }}>Spot Sponsorisé · Contactez <span style={{ color: "#C8920A" }}>#wayza</span></p>
      </div>
    </div>
  );
  // Trouver le spot correspondant au nom de l'annonceur (ou créer un objet minimal)
  const spotMatch = spots.find(s => s.nom === ad.titre) || {
    id: "sp_" + ad.id,
    nom: ad.titre,
    slogan: ad.texte || "",
    ville: ad.ville || "",
    cat: ad.cat || "",
    pass: "Premium",
    img: ad.image_url || "",
    wa: ad.lien_wa || "",
    photos: [], social: {}, region: "", gps: "",
    description: ad.texte || "",
    statut: "libre",
    _isSponsorise: true,
  };

  return (
    <div onClick={() => onClick(spotMatch)} style={{
      background: "rgba(200,146,10,0.06)",
      border: "0.5px solid rgba(200,146,10,0.4)",
      borderRadius: 18, overflow: "hidden", cursor: "pointer",
      position: "relative",
      gridColumn: "1 / -1",
      marginBottom: 4,
    }}>
      {/* Badge Sponsorisé */}
      <div style={{
        position: "absolute", top: 10, left: 10, zIndex: 2,
        background: "#C8920A", color: "#0D2B30",
        fontSize: 8, fontWeight: 800, letterSpacing: "0.15em",
        padding: "3px 10px", borderRadius: 20,
      }}>✦ SPONSORISÉ</div>

      <div style={{ display: "flex", alignItems: "center", height: 80 }}>
        {ad.image_url ? (
          <img src={ad.image_url} alt={ad.titre} style={{ width: 100, height: "100%", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 100, height: "100%", background: "linear-gradient(135deg, #1A0E05, #C8920A)", flexShrink: 0 }} />
        )}
        <div style={{ padding: "12px 14px", flex: 1 }}>
          <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.2em", marginBottom: 3, fontWeight: 600 }}>{ad.ville || "MADAGASCAR"}</p>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F4F7F7", marginBottom: 3, lineHeight: 1.3 }}>{ad.titre}</h3>
          {ad.texte && <p style={{ fontSize: 11, color: "rgba(244,247,247,0.45)", fontStyle: "italic" }}>{ad.texte}</p>}
        </div>
        <div style={{ padding: "0 14px", flexShrink: 0 }}>
          <Icon name="chevron" size={16} color="rgba(200,146,10,0.6)" />
        </div>
      </div>
    </div>
  );
};

// ─── VILLES & QUARTIERS DE MADAGASCAR ────────────────────────
const VILLES_LISTE = [
  { label: "Toute l'île",   value: "Toute l'île",   emoji: "🇲🇬" },
  { label: "Tana",          value: "Tana",           emoji: "🏙" },
  { label: "Nosy Be",       value: "Nosy Be",        emoji: "🌴" },
  { label: "Sainte Marie",  value: "Sainte Marie",   emoji: "🐋" },
  { label: "Taolagnaro",    value: "Taolagnaro",     emoji: "🌊" },
  { label: "Mahajanga",     value: "Mahajanga",      emoji: "⛵" },
  { label: "Toamasina",     value: "Toamasina",      emoji: "🚢" },
  { label: "Fianarantsoa",  value: "Fianarantsoa",   emoji: "🏔" },
  { label: "Antsirabe",     value: "Antsirabe",      emoji: "🚂" },
  { label: "Ambositra",     value: "Ambositra",      emoji: "🏡" },
  { label: "Morondava",     value: "Morondava",      emoji: "🌅" },
  { label: "Diego Suarez",  value: "Diego Suarez",   emoji: "⚓" },
  { label: "Sambava",       value: "Sambava",        emoji: "🌿" },
  { label: "Manakara",      value: "Manakara",       emoji: "🌾" },
  { label: "Ihosy",         value: "Ihosy",          emoji: "🐄" },
  { label: "Ambanja",       value: "Ambanja",        emoji: "🍫" },
  { label: "Ambatolampy",   value: "Ambatolampy",    emoji: "🏞" },
  { label: "Mananjary",     value: "Mananjary",      emoji: "🎋" },
  { label: "Farafangana",   value: "Farafangana",    emoji: "🌺" },
  { label: "Tsiroanomandidy", value: "Tsiroanomandidy", emoji: "🌻" },
];

// GPS_VILLES : quartiers de TOUTES les grandes villes de Madagascar
const GPS_VILLES_MG = [
  // ── ANTANANARIVO (Tana) ──
  { name: "Tana", label: "Analakely",        lat: -18.914, lng: 47.536, radius: 2 },
  { name: "Tana", label: "Ampefiloha",       lat: -18.924, lng: 47.530, radius: 2 },
  { name: "Tana", label: "Ambohijanahary",   lat: -18.900, lng: 47.530, radius: 3 },
  { name: "Tana", label: "Ivandry",          lat: -18.882, lng: 47.524, radius: 3 },
  { name: "Tana", label: "Ambohidahy",       lat: -18.910, lng: 47.526, radius: 2 },
  { name: "Tana", label: "Faravohitra",      lat: -18.905, lng: 47.521, radius: 2 },
  { name: "Tana", label: "Isoraka",          lat: -18.918, lng: 47.525, radius: 2 },
  { name: "Tana", label: "Ambatonakanga",    lat: -18.916, lng: 47.518, radius: 2 },
  { name: "Tana", label: "Tsaralalàna",      lat: -18.907, lng: 47.532, radius: 2 },
  { name: "Tana", label: "Ambohimanarina",   lat: -18.896, lng: 47.509, radius: 4 },
  { name: "Tana", label: "67ha",             lat: -18.940, lng: 47.530, radius: 3 },
  { name: "Tana", label: "Mahamasina",       lat: -18.933, lng: 47.533, radius: 2 },
  { name: "Tana", label: "Ankadifotsy",      lat: -18.943, lng: 47.525, radius: 3 },
  { name: "Tana", label: "Andravoahangy",    lat: -18.905, lng: 47.545, radius: 3 },
  { name: "Tana", label: "Ankorondrano",     lat: -18.890, lng: 47.533, radius: 3 },
  { name: "Tana", label: "Ambatobe",         lat: -18.878, lng: 47.531, radius: 3 },
  { name: "Tana", label: "Ankadivato",       lat: -18.896, lng: 47.540, radius: 3 },
  { name: "Tana", label: "Ambohibao",        lat: -18.870, lng: 47.510, radius: 4 },
  { name: "Tana", label: "Talatamaty",       lat: -18.855, lng: 47.490, radius: 5 },
  { name: "Tana", label: "Itaosy",           lat: -18.950, lng: 47.510, radius: 4 },
  { name: "Tana", label: "Andohatapenaka",   lat: -18.940, lng: 47.518, radius: 3 },
  { name: "Tana", label: "Ambodivona",       lat: -18.910, lng: 47.550, radius: 3 },
  { name: "Tana", label: "Alarobia",         lat: -18.885, lng: 47.548, radius: 3 },
  { name: "Tana", label: "Ambanidia",        lat: -18.922, lng: 47.519, radius: 2 },
  // Grand Tana fallback
  { name: "Tana", label: "Antananarivo",     lat: -18.914, lng: 47.536, radius: 22 },

  // ── NOSY BE ──
  { name: "Nosy Be", label: "Hell-Ville",       lat: -13.406, lng: 48.270, radius: 5 },
  { name: "Nosy Be", label: "Ambondrona",       lat: -13.390, lng: 48.278, radius: 4 },
  { name: "Nosy Be", label: "Andilana",         lat: -13.271, lng: 48.204, radius: 4 },
  { name: "Nosy Be", label: "Ambatoloaka",      lat: -13.398, lng: 48.214, radius: 4 },
  { name: "Nosy Be", label: "Dzamandzar",       lat: -13.310, lng: 48.190, radius: 4 },
  { name: "Nosy Be", label: "Madirokely",       lat: -13.393, lng: 48.214, radius: 3 },
  { name: "Nosy Be", label: "Nosy Be",          lat: -13.340, lng: 48.260, radius: 28 },

  // ── TOAMASINA ──
  { name: "Toamasina", label: "Centre-ville",    lat: -18.145, lng: 49.401, radius: 3 },
  { name: "Toamasina", label: "Tanambao",        lat: -18.155, lng: 49.395, radius: 3 },
  { name: "Toamasina", label: "Morafeno",        lat: -18.130, lng: 49.403, radius: 3 },
  { name: "Toamasina", label: "Brickaville",     lat: -18.820, lng: 49.065, radius: 15 },
  { name: "Toamasina", label: "Toamasina",       lat: -18.140, lng: 49.400, radius: 40 },

  // ── MAHAJANGA ──
  { name: "Mahajanga", label: "Mahavoky",        lat: -15.715, lng: 46.318, radius: 3 },
  { name: "Mahajanga", label: "Amborovy",        lat: -15.665, lng: 46.330, radius: 5 },
  { name: "Mahajanga", label: "Tsaramandroso",   lat: -15.730, lng: 46.305, radius: 4 },
  { name: "Mahajanga", label: "Mahajanga",       lat: -15.720, lng: 46.320, radius: 35 },

  // ── FIANARANTSOA ──
  { name: "Fianarantsoa", label: "Haute-Ville",  lat: -21.454, lng: 47.082, radius: 3 },
  { name: "Fianarantsoa", label: "Basse-Ville",  lat: -21.462, lng: 47.092, radius: 3 },
  { name: "Fianarantsoa", label: "Ambalavao",    lat: -21.840, lng: 46.940, radius: 10 },
  { name: "Fianarantsoa", label: "Fianarantsoa", lat: -21.454, lng: 47.087, radius: 35 },

  // ── TAOLAGNARO (Fort Dauphin) ──
  { name: "Taolagnaro", label: "Libanona",       lat: -25.030, lng: 46.988, radius: 3 },
  { name: "Taolagnaro", label: "Centre",         lat: -25.022, lng: 46.984, radius: 3 },
  { name: "Taolagnaro", label: "Taolagnaro",     lat: -25.030, lng: 46.980, radius: 30 },

  // ── SAINTE MARIE ──
  { name: "Sainte Marie", label: "Ambodifotatra", lat: -17.086, lng: 49.853, radius: 5 },
  { name: "Sainte Marie", label: "Sainte Marie",  lat: -17.090, lng: 49.860, radius: 22 },

  // ── ANTSIRABE ──
  { name: "Antsirabe", label: "Centre",           lat: -19.866, lng: 47.035, radius: 5 },
  { name: "Antsirabe", label: "Antsirabe",        lat: -19.870, lng: 47.030, radius: 25 },

  // ── DIEGO SUAREZ (Antsiranana) ──
  { name: "Diego Suarez", label: "Centre",        lat: -12.355, lng: 49.297, radius: 5 },
  { name: "Diego Suarez", label: "Ramena",        lat: -12.270, lng: 49.363, radius: 8 },
  { name: "Diego Suarez", label: "Diego Suarez",  lat: -12.355, lng: 49.297, radius: 40 },

  // ── MORONDAVA ──
  { name: "Morondava", label: "Morondava",        lat: -20.290, lng: 44.283, radius: 25 },

  // ── SAMBAVA ──
  { name: "Sambava", label: "Sambava",            lat: -14.267, lng: 50.167, radius: 20 },

  // ── AMBANJA ──
  { name: "Ambanja", label: "Ambanja",            lat: -13.683, lng: 48.450, radius: 20 },

  // ── AMBOSITRA ──
  { name: "Ambositra", label: "Ambositra",        lat: -20.530, lng: 47.240, radius: 20 },

  // ── MANAKARA ──
  { name: "Manakara", label: "Manakara",          lat: -22.145, lng: 48.013, radius: 20 },

  // ── MANANJARY ──
  { name: "Mananjary", label: "Mananjary",        lat: -21.230, lng: 48.343, radius: 20 },

  // ── FARAFANGANA ──
  { name: "Farafangana", label: "Farafangana",    lat: -22.820, lng: 47.827, radius: 20 },

  // ── IHOSY ──
  { name: "Ihosy", label: "Ihosy",               lat: -22.402, lng: 46.121, radius: 20 },

  // ── AMBATOLAMPY ──
  { name: "Ambatolampy", label: "Ambatolampy",   lat: -19.390, lng: 47.423, radius: 15 },

  // ── TSIROANOMANDIDY ──
  { name: "Tsiroanomandidy", label: "Tsiroanomandidy", lat: -18.770, lng: 46.047, radius: 20 },
];

// Calcul distance haversine en km
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Détecte la ville (et le quartier) depuis des coordonnées GPS
function detecterVilleDepuisGPS(lat, lng) {
  let closest = null, closestLabel = null, minDist = Infinity;
  GPS_VILLES_MG.forEach(v => {
    const d = haversineKm(lat, lng, v.lat, v.lng);
    if (d < v.radius && d < minDist) {
      minDist = d;
      closest = v.name;
      closestLabel = v.label;
    }
  });
  return closest ? { ville: closest, quartier: closestLabel } : null;
}

const CitySelector = ({ city, setCity, spots, geoCity, geoQuartier }) => {
  const [open, setOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMsg, setGeoMsg] = useState(null);

  const handleGeo = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const result = detecterVilleDepuisGPS(pos.coords.latitude, pos.coords.longitude);
        if (result) {
          setCity(result.ville);
          setGeoMsg(result.quartier !== result.ville ? `📍 ${result.quartier}, ${result.ville}` : `📍 ${result.ville}`);
        } else {
          setCity("Toute l'île");
          setGeoMsg("Position hors des villes WAYZA — île entière");
        }
        setGeoLoading(false);
        setOpen(false);
      },
      () => { setGeoLoading(false); }
    );
  };

  // Afficher le quartier si détecté automatiquement
  const displayLabel = geoCity === city && geoQuartier && geoQuartier !== city
    ? `${geoQuartier}, ${city}`
    : (VILLES_LISTE.find(v => v.value === city)?.label || city);

  const currentEmoji = VILLES_LISTE.find(v => v.value === city)?.emoji || "📍";

  // Compteur spots par ville (robuste, même logique que HomeScreen)
  const countForVille = (v) => {
    if (v.value === "Toute l'île") return spots.length;
    const normalize = (s = "") => {
      let r = s.trim().toLowerCase();
      r = r.replace(/antananarive?/i, "tana").replace(/tananarive?/i, "tana");
      r = r.replace(/nosy.?b[eé]/i, "nosy be");
      r = r.replace(/sainte?.?marie/i, "sainte marie");
      r = r.replace(/fort.?dauphin/i, "taolagnaro");
      r = r.replace(/antsiranana/i, "diego suarez");
      r = r.replace(/tamatave/i, "toamasina");
      r = r.replace(/majunga/i, "mahajanga");
      return r;
    };
    const key = normalize(v.value);
    return spots.filter(s => {
      const sv = normalize(s.ville || "");
      const sr = normalize(s.region || "");
      return sv === key || sr === key || sv.includes(key) || key.includes(sv.slice(0, 4));
    }).length;
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 10,
            background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.35)",
            borderRadius: 30, padding: "10px 18px", cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 16 }}>{currentEmoji}</span>
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ fontSize: 8, color: "rgba(200,146,10,0.7)", letterSpacing: "0.2em", fontWeight: 700, marginBottom: 1 }}>CHOISISSEZ VOTRE VILLE</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#F4F7F7" }}>{displayLabel}</p>
          </div>
          <span style={{ fontSize: 10, color: "rgba(200,146,10,0.6)", display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
        </button>

        {/* Bouton Autour de moi */}
        <button
          onClick={handleGeo}
          disabled={geoLoading}
          style={{
            flexShrink: 0, width: 44, height: 44, borderRadius: "50%",
            background: geoCity ? "rgba(46,204,138,0.15)" : "rgba(255,255,255,0.05)",
            border: geoCity ? "0.5px solid rgba(46,204,138,0.4)" : "0.5px solid rgba(255,255,255,0.15)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}
          title="Autour de moi"
        >
          {geoLoading ? "⏳" : "📍"}
        </button>
      </div>

      {geoMsg && !open && (
        <p style={{ fontSize: 10, color: "rgba(46,204,138,0.7)", marginTop: 5, paddingLeft: 4 }}>{geoMsg}</p>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 200,
          background: "#0D2B30", border: "0.5px solid rgba(200,146,10,0.35)",
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          maxHeight: 320, overflowY: "auto",
        }}>
          {VILLES_LISTE.map((v, i) => {
            const count = countForVille(v);
            const active = city === v.value;
            return (
              <button key={v.value} onClick={() => { setCity(v.value); setOpen(false); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 18px", cursor: "pointer", fontFamily: "inherit",
                background: active ? "rgba(200,146,10,0.12)" : i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                border: "none", borderBottom: i < VILLES_LISTE.length - 1 ? "0.5px solid rgba(255,255,255,0.05)" : "none",
                textAlign: "left",
              }}>
                <span style={{ fontSize: 17, width: 26, textAlign: "center" }}>{v.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#C8920A" : "#F4F7F7" }}>
                  {v.label}
                </span>
                <span style={{ fontSize: 9, color: count > 0 ? "rgba(200,146,10,0.6)" : "rgba(244,247,247,0.25)", letterSpacing: "0.1em" }}>
                  {count > 0 ? `${count} spot${count > 1 ? "s" : ""}` : "bientôt"}
                </span>
                {active && <span style={{ color: "#C8920A", fontSize: 12, marginLeft: 4 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── ÉCRAN ACCUEIL ────────────────────────────────────────────
const HomeScreen = ({ city, setCity, geoCity, geoQuartier, onSpot, onMag, onTab, ads, spots = SPOTS_FALLBACK, onInscription }) => {
  const [selectedCat, setSelectedCat] = useState(null);

  // Normalise un nom de ville pour comparaison robuste
  const normalizeVille = (v = "") => {
    let s = v.trim().toLowerCase();
    // Variantes Antananarivo
    s = s.replace(/antananarive?/i, "tana").replace(/tananarive?/i, "tana");
    // Variantes orthographiques courantes
    s = s.replace(/nosy.?b[eé]/i, "nosy be");
    s = s.replace(/sainte?.?marie/i, "sainte marie").replace(/ile.?sainte.?marie/i, "sainte marie");
    s = s.replace(/fort.?dauphin/i, "taolagnaro");
    s = s.replace(/diégo.?suarez/i, "diego suarez").replace(/diego.?suarez/i, "diego suarez").replace(/antsiranana/i, "diego suarez");
    s = s.replace(/tamatave/i, "toamasina");
    s = s.replace(/majunga/i, "mahajanga");
    s = s.replace(/tuléar/i, "toliara").replace(/toliara/i, "toliara");
    return s;
  };

  // Liste des villes WAYZA connues (valeurs normalisées)
  const VILLES_CONNUES = VILLES_LISTE.filter(v => v.value !== "Toute l'île").map(v => normalizeVille(v.value));

  const cityKey = normalizeVille(city);

  const byCity = city === "Toute l'île"
    ? spots
    : spots.filter(s => {
        const sv = normalizeVille(s.ville || "");
        const sr = normalizeVille(s.region || "");
        // Match exact sur ville ou région
        if (sv === cityKey || sr === cityKey) return true;
        // Match partiel (ex: "Ambohibao" contient "tana" via normalisation)
        if (sv.includes(cityKey) || cityKey.includes(sv.slice(0, 4))) return true;
        // Si la ville du spot n'est dans AUCUNE ville connue → l'afficher dans Toute l'île seulement
        return false;
      });

  const filteredSpots = selectedCat
    ? byCity.filter(s => s.cat === selectedCat)
    : byCity;

  // Pubs par type
  const sponsoriseAd   = (ads || []).find(a => a.type === "sponsorise" && a.actif) || null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      {/* Bannière Haut — STICKY, toujours visible */}
      <div style={{ padding: "0 16px", flexShrink: 0, background: "#0D2B30", zIndex: 10 }}>
        <BanniereHautCarousel ads={ads} />
      </div>

      {/* Contenu scrollable */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 20, minHeight: 0 }}>
      {/* Hero mag */}
      <div style={{ margin: "0 16px 24px", position: "relative", height: 300, borderRadius: 24, overflow: "hidden", cursor: "pointer" }} onClick={() => onMag(MAG[0])}>
        <img src={MAG[0]?.img || ""} alt="hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
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

      {/* Sélecteur de ville */}
      <div style={{ padding: "0 16px 20px" }}>
        <CitySelector city={city} setCity={setCity} spots={spots} geoCity={geoCity} geoQuartier={geoQuartier} />
      </div>

      {/* Catégories style "spot cards" — plus petites */}
      <div style={{ padding: "0 16px 8px" }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 12 }}>CATÉGORIES</p>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", paddingBottom: 4, marginBottom: 16, marginLeft: -16, paddingLeft: 16, marginRight: -16, paddingRight: 16 }}>
          {CATEGORIES.map(cat => {
            const active = selectedCat === cat.name;
            const spotCount = byCity.filter(s => s.cat === cat.name).length;
            const isEmpty = spotCount === 0;

            const handleCatClick = () => {
              if (!isEmpty) setSelectedCat(active ? null : cat.name);
            };

            return (
              <div key={cat.id} onClick={handleCatClick} style={{
                flexShrink: 0,
                scrollSnapAlign: "start",
                width: 100,
                height: 96,
                borderRadius: 14,
                overflow: "hidden",
                cursor: isEmpty ? "default" : "pointer",
                position: "relative",
                opacity: isEmpty ? 0.5 : 1,
                transform: active ? "scale(0.95)" : "scale(1)",
                transition: "all 0.15s",
                border: active
                  ? `2px solid ${cat.glow}`
                  : `0.5px solid ${cat.glow}50`,
                boxShadow: active ? `0 0 16px ${cat.glow}50` : "none",
              }}>
                {/* Fond image ou dégradé couleur */}
                {cat.img ? (
                  <img src={cat.img} alt={cat.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${cat.glow}30 0%, rgba(13,43,48,0.9) 100%)` }} />
                )}
                {/* Overlay gradient */}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)` }} />
                {/* Contenu */}
                <div style={{ position: "absolute", inset: 0, padding: "8px 8px 9px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 17, color: active ? cat.glow : "rgba(255,255,255,0.9)" }}>{cat.icon}</span>
                    {active && (
                      <span style={{ fontSize: 7, background: cat.glow, color: "#0D2B30", borderRadius: 8, padding: "2px 5px", fontWeight: 800 }}>✓</span>
                    )}
                    {!active && !isEmpty && spotCount > 0 && (
                      <span style={{ fontSize: 7, background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "2px 5px" }}>{spotCount}</span>
                    )}
                    {isEmpty && (
                      <span style={{ fontSize: 7, background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.3)", borderRadius: 8, padding: "2px 5px" }}>—</span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#F4F7F7", lineHeight: 1.25, marginBottom: 1 }}>{cat.name}</p>
                    <p style={{ fontSize: 8, color: active ? cat.glow : "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>
                      {isEmpty ? "BIENTÔT" : cat.sub}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedCat && (
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 10, color: "#C8920A", letterSpacing: "0.2em" }}>
              {filteredSpots.length} SPOT{filteredSpots.length > 1 ? "S" : ""} · {selectedCat.toUpperCase()}
            </p>
            <button onClick={() => setSelectedCat(null)} style={{
              background: "rgba(200,146,10,0.15)", border: "0.5px solid rgba(200,146,10,0.4)",
              borderRadius: 20, padding: "4px 12px", color: "#C8920A",
              fontSize: 10, cursor: "pointer", fontFamily: "inherit",
            }}>Tout voir</button>
          </div>
        )}

        {/* Spots */}
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 12 }}>
          SPOTS SÉLECTIONNÉS — {filteredSpots.length} ADRESSE{filteredSpots.length > 1 ? "S" : ""}
        </p>


        {filteredSpots.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ fontSize: 14, color: "rgba(244,247,247,0.3)", fontStyle: "italic" }}>
              Aucun spot dans cette catégorie pour cette ville.
            </p>
            <button onClick={() => setSelectedCat(null)} style={{
              marginTop: 12, background: "#C8920A", color: "#0D2B30",
              border: "none", borderRadius: 20, padding: "8px 20px",
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>Voir tous les spots</button>
          </div>
        )}

        <div className="wayza-spots-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Sponsorisé en tête de liste */}
          {sponsoriseAd && <SponsoriseCard ad={sponsoriseAd} onClick={onSpot} spots={spots} />}

          {filteredSpots.map((s, idx) => (
            <div key={s.id}>
              <SpotCard spot={s} onClick={onSpot} />
            </div>
          ))}
        </div>

        {/* Bannière Bas — STICKY EN BAS */}
        <BanniereBasCarousel ads={ads} />

        {/* Bannière inscription spot */}
        <InscriptionBanner onInscription={onInscription} />
      </div>
      </div>
    </div>
  );
};

// ─── ÉCRAN MAG ────────────────────────────────────────────────
const MagScreen = ({ onArticle, ads, onInscription }) => {
  const [articles, setArticles] = useState(MAG);
  const magAds = (ads || []).filter(a => a.type === "wayzmag" && a.actif);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .eq("publie", true)
          .order("date_parution", { ascending: false });
        if (!error && data?.length) {
          // Normaliser vers la structure attendue
          const normalized = data.map(a => ({
            id: a.id,
            titre: a.titre,
            soustitre: a.sous_titre || "",
            tag: `${(a.categorie || "").toUpperCase()} · ${(a.region || "").toUpperCase()}`,
            date: a.date_parution ? new Date(a.date_parution).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "",
            spot: a.spot_lie || "",
            corps: a.contenu || "",
            img: a.photo_principale || "",
            galerie: a.galerie || [],
          }));
          setArticles(normalized);
        }
      } catch { /* garder MAG fallback */ }
    };
    load();
  }, []);

  const hero = articles[0];
  const rest = articles.slice(1);

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 16px 120px", minHeight: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 4 }}>ÉDITION PRESTIGE</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F4F7F7", fontStyle: "italic" }}>Wayz'Mag</h2>
      </div>

      {/* Articles sponsorisés Wayz'Mag */}
      {magAds.length > 0 ? (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 10 }}>✦ PARTENAIRES</p>
          {magAds.map(ad => (
            <div key={ad.id} onClick={() => ad.lien_wa && window.open(`https://wa.me/${ad.lien_wa.replace(/[^0-9]/g,"")}`, "_blank")}
              style={{ background: "rgba(200,146,10,0.06)", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 14, padding: "14px 16px", marginBottom: 10, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
              {ad.image_url && <img src={ad.image_url} alt={ad.titre} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.2em", fontWeight: 700, marginBottom: 3 }}>WAYZ'MAG</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#F4F7F7", marginBottom: 2 }}>{ad.titre}</p>
                {ad.texte && <p style={{ fontSize: 11, color: "rgba(244,247,247,0.5)" }}>{ad.texte}</p>}
              </div>
              <Icon name="chevron" size={14} color="rgba(200,146,10,0.5)" />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: 20, border: "1px dashed rgba(200,146,10,0.2)", borderRadius: 14, padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>📢</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(200,146,10,0.55)" }}>Votre pub ici !</p>
            <p style={{ fontSize: 9, color: "rgba(244,247,247,0.25)", lineHeight: 1.5 }}>Article partenaire Wayz'Mag · Contactez <span style={{ color: "#C8920A" }}>#wayza</span></p>
          </div>
        </div>
      )}

      {/* Hero article */}
      {hero && (
        <div onClick={() => onArticle(hero)} style={{
          position: "relative", height: 320, borderRadius: 20, overflow: "hidden",
          cursor: "pointer", marginBottom: 16, border: "0.5px solid rgba(200,146,10,0.2)",
        }}>
          {hero.img && <img src={hero.img} alt={hero.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          {!hero.img && <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0D2B30, #1A4A2B)" }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", inset: 0, padding: 22, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 6 }}>{hero.tag}</span>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#F4F7F7", lineHeight: 1.25, fontStyle: "italic", marginBottom: 10 }}>
              {hero.titre}{hero.soustitre && <><br /><span style={{ fontSize: 15, fontWeight: 600 }}>{hero.soustitre}</span></>}
            </h3>
            <span style={{ fontSize: 10, color: "rgba(244,247,247,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
              {hero.date}{hero.spot ? ` · ${hero.spot}` : ""} <Icon name="chevron" size={11} color="rgba(244,247,247,0.4)" />
            </span>
          </div>
        </div>
      )}

      {/* Grille articles secondaires */}
      {rest.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {rest.map(a => (
            <div key={a.id} onClick={() => onArticle(a)} style={{
              position: "relative", height: 200, borderRadius: 16, overflow: "hidden",
              cursor: "pointer", border: "0.5px solid rgba(200,146,10,0.15)",
            }}>
              {a.img
                ? <img src={a.img} alt={a.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0D2B30, #1A3A2A)" }} />
              }
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, transparent 55%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 12px" }}>
                <p style={{ fontSize: 8, color: "#C8920A", letterSpacing: "0.2em", fontWeight: 700, marginBottom: 3 }}>{a.tag}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#F4F7F7", lineHeight: 1.25, fontStyle: "italic" }}>{a.titre}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {articles.length === 0 && (
        <p style={{ textAlign: "center", color: "rgba(244,247,247,0.3)", fontSize: 13, padding: "40px 20px", fontStyle: "italic" }}>
          Les articles arrivent bientôt…
        </p>
      )}

      {/* Bannière inscription spot */}
      <InscriptionBanner onInscription={onInscription} />
    </div>
  );
};

// ─── ÉCRAN ARTICLE ────────────────────────────────────────────
const ArticleScreen = ({ article, onBack }) => {
  const [galIdx, setGalIdx] = useState(null);
  const allPhotos = [article.img, ...(article.galerie || [])].filter(Boolean);

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 20, minHeight: 0 }}>
      <div style={{ position: "relative", height: 280 }}>
        {article.img
          ? <img src={article.img} alt={article.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0D2B30, #1A3A2A)" }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0D2B30 0%, transparent 50%)" }} />
        <button onClick={onBack} style={{
          position: "absolute", top: 52, left: 16,
          background: "rgba(0,0,0,0.5)", border: "0.5px solid rgba(255,255,255,0.15)",
          borderRadius: 20, padding: "8px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, color: "#F4F7F7", fontSize: 12, fontFamily: "inherit",
        }}>
          <Icon name="back" size={14} color="#F4F7F7" /> Wayz'Mag
        </button>
      </div>
      <div style={{ padding: "20px 20px 0" }}>
        <span style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700 }}>{article.tag}</span>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F4F7F7", fontStyle: "italic", lineHeight: 1.2, margin: "8px 0 4px" }}>{article.titre}</h1>
        <p style={{ fontSize: 16, color: "rgba(244,247,247,0.6)", marginBottom: 16, fontStyle: "italic" }}>{article.soustitre}</p>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          {article.date && <span style={{ fontSize: 10, color: "rgba(244,247,247,0.35)" }}>{article.date}</span>}
          {article.spot && <span style={{ fontSize: 10, color: "#C8920A" }}>✦ {article.spot}</span>}
        </div>
        <div style={{ width: 40, height: 1, background: "#C8920A", marginBottom: 20 }} />
        <p style={{ fontSize: 14, color: "rgba(244,247,247,0.75)", lineHeight: 1.9, marginBottom: 24 }}>{article.corps}</p>

        {/* Galerie photos */}
        {allPhotos.length > 1 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.25em", fontWeight: 700, marginBottom: 12 }}>GALERIE</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {allPhotos.map((p, i) => (
                <div key={i} onClick={() => setGalIdx(i)} style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "1", cursor: "pointer", border: `1.5px solid ${galIdx === i ? "#C8920A" : "transparent"}` }}>
                  <img src={p} alt={`photo ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
            {galIdx !== null && (
              <div style={{ marginTop: 12, borderRadius: 16, overflow: "hidden", position: "relative" }}>
                <img src={allPhotos[galIdx]} alt="zoom" style={{ width: "100%", borderRadius: 16 }} />
                <button onClick={() => setGalIdx(null)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#F4F7F7", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ÉCRAN INSCRIPTION SPOT (auto-inscription) ───────────────
const CATS_INSCRIPTION = [
  "Fast, Grill & Resto",
  "Lounge-K & Night Club",
  "Pass & Glow",
  "Fit, Body & Sport",
  "Window Shopper",
  "Services",
  "Automoto",
  "Voyager & découvrir",
  "Transport & transferts",
];

const REGIONS_INSCRIPTION = [
  "Analamanga","Diana","Analanjirofo","Anosy","Alaotra-Mangoro",
  "Atsinanana","Betsiboka","Boeny","Bongolava","Haute Matsiatra",
  "Ihorombe","Itasy","Melaky","Menabe","SAVA","Sofia",
  "Vakinankaratra","Vatovavy","Fitovinany","Atsimo-Andrefana","Atsimo-Atsinanana",
];

const SI = {
  input: { width:"100%", background:"rgba(255,255,255,0.05)", border:"0.5px solid rgba(200,146,10,0.25)", borderRadius:10, padding:"11px 13px", color:"#F4F7F7", fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:10 },
  label: { fontSize:9, color:"#C8920A", letterSpacing:"0.22em", fontWeight:700, display:"block", marginBottom:5 },
  btn:   { width:"100%", padding:"13px 0", background:"#C8920A", color:"#0D2B30", border:"none", borderRadius:12, fontWeight:800, fontSize:13, cursor:"pointer", letterSpacing:"0.1em", fontFamily:"inherit" },
  ghost: { width:"100%", padding:"11px 0", background:"transparent", color:"#C8920A", border:"1px solid rgba(200,146,10,0.35)", borderRadius:12, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" },
};

const InscriptionScreen = ({ onBack }) => {
  const [etape, setEtape]   = useState(1); // 1=offre, 2=identite, 3=contact, 4=localisation, 5=confirmation
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]     = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [form, setForm] = useState({
    // Étape 1
    offre: "Presence",
    cat: "",
    // Étape 2
    nom: "",
    slogan: "",
    description: "",
    // Étape 3
    wa: "",
    telephone: "",
    email: "",
    instagram: "",
    facebook: "",
    // Étape 4
    ville: "",
    region: "",
    adresse: "",
    gps: "",
    // Gérant
    gerant_nom: "",
    gerant_code: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const getGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => set("gps", `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
      () => {}
    );
  };

  const genCode = (nom) => {
    const base = nom.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4).padEnd(4,"X");
    const rand = Math.random().toString(36).toUpperCase().slice(2,6);
    return `WAYZA-${base}-${rand}`;
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.cat || !form.wa || !form.ville || !form.gerant_nom) {
      setErrMsg("Merci de remplir les champs obligatoires (*).");
      return;
    }
    setSubmitting(true); setErrMsg("");
    try {
      const code = genCode(form.nom);
      // Insérer le spot (actif:false → en attente validation admin)
      const { data: spotData, error: spotErr } = await supabase.from("spots").insert({
        nom: form.nom,
        slogan: form.slogan,
        description: form.description,
        cat: form.cat,
        pass: form.offre,
        wa: form.wa,
        telephone: form.telephone,
        email: form.email,
        instagram: form.instagram,
        facebook: form.facebook,
        ville: form.ville,
        region: form.region,
        adresse: form.adresse,
        gps: form.gps,
        actif: false,
        photos: [],
        equipements: {},
        paiements: {},
        horaires: {},
      }).select().single();

      if (spotErr) throw spotErr;

      // Insérer le gérant lié
      const { error: gerantErr } = await supabase.from("gerants").insert({
        nom: form.gerant_nom,
        code_acces: code,
        spot_id: spotData.id,
        actif: false, // activé par admin après validation
      });
      if (gerantErr) throw gerantErr;

      set("gerant_code", code);
      setDone(true);
    } catch (e) {
      setErrMsg("Erreur lors de l'inscription : " + (e.message || "réessayez."));
    }
    setSubmitting(false);
  };

  // ── SUCCÈS ──
  if (done) return (
    <div style={{ flex:1, overflowY:"auto", padding:"40px 24px 120px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:16 }}>
      <div style={{ fontSize:52 }}>✅</div>
      <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.4em", fontWeight:700 }}>INSCRIPTION ENVOYÉE</p>
      <h2 style={{ fontSize:22, fontWeight:800, color:"#F4F7F7", fontStyle:"italic", lineHeight:1.2 }}>{form.nom}</h2>
      <p style={{ fontSize:12, color:"rgba(244,247,247,0.5)", lineHeight:1.7 }}>
        Votre fiche est en cours de validation par Mandimbimanana.<br />
        Vous recevrez une confirmation sous 24h.
      </p>
      <div style={{ background:"rgba(200,146,10,0.08)", border:"0.5px solid rgba(200,146,10,0.3)", borderRadius:16, padding:"18px 20px", width:"100%" }}>
        <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.25em", fontWeight:700, marginBottom:8 }}>VOTRE CODE D'ACCÈS GÉRANT</p>
        <p style={{ fontSize:20, fontWeight:800, color:"#F4F7F7", letterSpacing:"0.1em", fontFamily:"monospace" }}>{form.gerant_code}</p>
        <p style={{ fontSize:10, color:"rgba(244,247,247,0.4)", marginTop:8, lineHeight:1.5 }}>
          Conservez ce code. Il vous permettra d'accéder à votre console gérant une fois votre fiche validée.
        </p>
      </div>
      <button onClick={onBack} style={{ ...SI.btn, marginTop:8 }}>← RETOUR À L'ACCUEIL</button>
    </div>
  );

  const progressW = `${(etape / 4) * 100}%`;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
      {/* Header */}
      <div style={{ padding:"16px 20px 12px", flexShrink:0, background:"rgba(0,0,0,0.2)", borderBottom:"0.5px solid rgba(200,146,10,0.15)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(244,247,247,0.5)", fontSize:20, padding:0, lineHeight:1 }}>←</button>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:8, color:"#C8920A", letterSpacing:"0.35em", fontWeight:700 }}>INSCRIPTION — 30 000 Ar / AN</p>
            <h2 style={{ fontSize:17, fontWeight:800, color:"#F4F7F7", fontStyle:"italic" }}>Référencer mon spot</h2>
          </div>
          <span style={{ fontSize:10, color:"rgba(244,247,247,0.35)" }}>{etape}/4</span>
        </div>
        {/* Barre de progression */}
        <div style={{ height:3, background:"rgba(200,146,10,0.15)", borderRadius:3, marginTop:12 }}>
          <div style={{ height:"100%", width:progressW, background:"#C8920A", borderRadius:3, transition:"width 0.3s" }} />
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 120px", minHeight:0 }}>

        {/* ── ÉTAPE 1 : Offre + Catégorie ── */}
        {etape === 1 && (
          <div>
            <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", fontWeight:700, marginBottom:4 }}>ÉTAPE 1</p>
            <h3 style={{ fontSize:18, fontWeight:800, color:"#F4F7F7", fontStyle:"italic", marginBottom:20 }}>Choisissez votre offre</h3>

            {/* Offre */}
            <p style={{ ...SI.label, marginBottom:10 }}>OFFRE *</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              {[
                { v:"Presence", l:"Présence", prix:"30 000 Ar", desc:"Fiche complète visible · Pub à la carte" },
                { v:"Premium",  l:"⭐ Premium", prix:"20 000 Ar", desc:"+ Calendrier · Réservations · Pub 1×/sem" },
              ].map(o => (
                <div key={o.v} onClick={() => set("offre", o.v)} style={{
                  padding:"14px 12px", borderRadius:14, cursor:"pointer",
                  background: form.offre===o.v ? "rgba(200,146,10,0.12)" : "rgba(255,255,255,0.03)",
                  border:`0.5px solid ${form.offre===o.v ? "#C8920A" : "rgba(255,255,255,0.1)"}`,
                }}>
                  <p style={{ fontSize:12, fontWeight:800, color:form.offre===o.v?"#C8920A":"#F4F7F7", marginBottom:3 }}>{o.l}</p>
                  <p style={{ fontSize:11, color:"#C8920A", fontWeight:700, marginBottom:5 }}>{o.prix} / {o.v === "Presence" ? "01 an" : "27j"}</p>
                  <p style={{ fontSize:9, color:"rgba(244,247,247,0.4)", lineHeight:1.4 }}>{o.desc}</p>
                  {form.offre===o.v && <p style={{ fontSize:8, color:"#C8920A", fontWeight:700, marginTop:6 }}>✓ SÉLECTIONNÉ</p>}
                </div>
              ))}
            </div>

            {/* Catégorie */}
            <p style={{ ...SI.label, marginBottom:10 }}>CATÉGORIE *</p>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:24 }}>
              {CATS_INSCRIPTION.map(c => {
                const cat = CATEGORIES.find(x => x.name === c);
                return (
                  <div key={c} onClick={() => set("cat", c)} style={{
                    padding:"11px 14px", borderRadius:12, cursor:"pointer",
                    background: form.cat===c ? `${cat?.glow || "#C8920A"}15` : "rgba(255,255,255,0.03)",
                    border:`0.5px solid ${form.cat===c ? (cat?.glow||"#C8920A") : "rgba(255,255,255,0.08)"}`,
                    borderLeft:`3px solid ${form.cat===c ? (cat?.glow||"#C8920A") : "rgba(255,255,255,0.08)"}`,
                    display:"flex", alignItems:"center", gap:10,
                  }}>
                    <span style={{ fontSize:18 }}>{cat?.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:form.cat===c?(cat?.glow||"#C8920A"):"rgba(244,247,247,0.8)" }}>{c}</p>
                      <p style={{ fontSize:9, color:"rgba(244,247,247,0.3)" }}>{cat?.sub}</p>
                    </div>
                    {form.cat===c && <span style={{ fontSize:12, color:cat?.glow||"#C8920A" }}>✓</span>}
                  </div>
                );
              })}
            </div>

            <button onClick={() => { if (!form.cat) { setErrMsg("Sélectionnez une catégorie."); return; } setErrMsg(""); setEtape(2); }} style={SI.btn}>
              CONTINUER →
            </button>
            {errMsg && <p style={{ fontSize:11, color:"#E74C3C", marginTop:10, textAlign:"center" }}>{errMsg}</p>}
          </div>
        )}

        {/* ── ÉTAPE 2 : Identité du spot ── */}
        {etape === 2 && (
          <div>
            <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", fontWeight:700, marginBottom:4 }}>ÉTAPE 2</p>
            <h3 style={{ fontSize:18, fontWeight:800, color:"#F4F7F7", fontStyle:"italic", marginBottom:20 }}>Votre établissement</h3>

            <label style={SI.label}>NOM DU SPOT *</label>
            <input placeholder="Ex : Orchidea Club" value={form.nom} onChange={e=>set("nom",e.target.value)} style={SI.input} />

            <label style={SI.label}>SLOGAN</label>
            <input placeholder="Ex : La nuit commence ici" value={form.slogan} onChange={e=>set("slogan",e.target.value)} style={SI.input} />

            <label style={SI.label}>DESCRIPTION</label>
            <textarea placeholder="Décrivez votre établissement en 2-3 phrases..." value={form.description} onChange={e=>set("description",e.target.value)} style={{ ...SI.input, height:90, resize:"none" }} />

            <label style={SI.label}>VOTRE NOM (gérant) *</label>
            <input placeholder="Ex : Jean Rakoto" value={form.gerant_nom} onChange={e=>set("gerant_nom",e.target.value)} style={SI.input} />

            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <button onClick={() => setEtape(1)} style={{ ...SI.ghost, flex:1 }}>← Retour</button>
              <button onClick={() => { if (!form.nom || !form.gerant_nom) { setErrMsg("Nom du spot et nom du gérant requis."); return; } setErrMsg(""); setEtape(3); }} style={{ ...SI.btn, flex:2 }}>CONTINUER →</button>
            </div>
            {errMsg && <p style={{ fontSize:11, color:"#E74C3C", marginTop:10, textAlign:"center" }}>{errMsg}</p>}
          </div>
        )}

        {/* ── ÉTAPE 3 : Contacts ── */}
        {etape === 3 && (
          <div>
            <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", fontWeight:700, marginBottom:4 }}>ÉTAPE 3</p>
            <h3 style={{ fontSize:18, fontWeight:800, color:"#F4F7F7", fontStyle:"italic", marginBottom:20 }}>Vos contacts</h3>

            <label style={SI.label}>WHATSAPP * (numéro de réservations)</label>
            <input placeholder="+261 32 00 000 00" value={form.wa} onChange={e=>set("wa",e.target.value)} style={SI.input} />

            <label style={SI.label}>TÉLÉPHONE</label>
            <input placeholder="+261 20 00 000 00" value={form.telephone} onChange={e=>set("telephone",e.target.value)} style={SI.input} />

            <label style={SI.label}>EMAIL</label>
            <input placeholder="contact@monspot.mg" type="email" value={form.email} onChange={e=>set("email",e.target.value)} style={SI.input} />

            <div style={{ height:1, background:"rgba(200,146,10,0.12)", margin:"4px 0 14px" }} />
            <p style={{ ...SI.label, marginBottom:10 }}>RÉSEAUX SOCIAUX (optionnel)</p>

            <label style={SI.label}>INSTAGRAM</label>
            <input placeholder="@monspot ou URL" value={form.instagram} onChange={e=>set("instagram",e.target.value)} style={SI.input} />

            <label style={SI.label}>FACEBOOK</label>
            <input placeholder="Page Facebook (URL)" value={form.facebook} onChange={e=>set("facebook",e.target.value)} style={SI.input} />

            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <button onClick={() => setEtape(2)} style={{ ...SI.ghost, flex:1 }}>← Retour</button>
              <button onClick={() => { if (!form.wa) { setErrMsg("WhatsApp requis."); return; } setErrMsg(""); setEtape(4); }} style={{ ...SI.btn, flex:2 }}>CONTINUER →</button>
            </div>
            {errMsg && <p style={{ fontSize:11, color:"#E74C3C", marginTop:10, textAlign:"center" }}>{errMsg}</p>}
          </div>
        )}

        {/* ── ÉTAPE 4 : Localisation ── */}
        {etape === 4 && (
          <div>
            <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.3em", fontWeight:700, marginBottom:4 }}>ÉTAPE 4</p>
            <h3 style={{ fontSize:18, fontWeight:800, color:"#F4F7F7", fontStyle:"italic", marginBottom:20 }}>Localisation</h3>

            <label style={SI.label}>VILLE *</label>
            <input placeholder="Ex : Nosy Be, Antananarivo…" value={form.ville} onChange={e=>set("ville",e.target.value)} style={SI.input} />

            <label style={SI.label}>RÉGION *</label>
            <select value={form.region} onChange={e=>set("region",e.target.value)} style={{ ...SI.input, appearance:"none" }}>
              <option value="">Sélectionner une région…</option>
              {REGIONS_INSCRIPTION.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <label style={SI.label}>ADRESSE</label>
            <input placeholder="Ex : Rue Pasteur, Hell-Ville" value={form.adresse} onChange={e=>set("adresse",e.target.value)} style={SI.input} />

            <label style={SI.label}>POSITION (usage interne — non visible des utilisateurs)</label>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <input placeholder="Cliquez 📍 pour détecter automatiquement" value={form.gps} onChange={e=>set("gps",e.target.value)} style={{ ...SI.input, marginBottom:0, flex:1 }} />
              <button onClick={getGPS} style={{ background:"rgba(200,146,10,0.15)", border:"0.5px solid rgba(200,146,10,0.4)", borderRadius:10, padding:"0 14px", color:"#C8920A", cursor:"pointer", fontSize:16, flexShrink:0 }}>📍</button>
            </div>
            <p style={{ fontSize:10, color:"rgba(244,247,247,0.3)", marginBottom:18 }}>Les coordonnées GPS permettent les itinéraires pour les utilisateurs — elles ne sont jamais affichées.</p>

            {/* Récap avant soumission */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"0.5px solid rgba(200,146,10,0.2)", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
              <p style={{ fontSize:9, color:"#C8920A", letterSpacing:"0.2em", fontWeight:700, marginBottom:10 }}>RÉCAP DE VOTRE INSCRIPTION</p>
              {[
                ["Offre",      form.offre === "Presence" ? "Présence — 30 000 Ar / an" : "⭐ Premium — 20 000 Ar"],
                ["Catégorie",  form.cat],
                ["Spot",       form.nom],
                ["Gérant",     form.gerant_nom],
                ["WhatsApp",   form.wa],
                ["Ville",      form.ville],
              ].map(([l,v]) => v && (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:10, color:"rgba(244,247,247,0.4)" }}>{l}</span>
                  <span style={{ fontSize:10, color:"#F4F7F7", fontWeight:600, maxWidth:180, textAlign:"right" }}>{v}</span>
                </div>
              ))}
            </div>

            {errMsg && <p style={{ fontSize:11, color:"#E74C3C", marginBottom:12, textAlign:"center" }}>{errMsg}</p>}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setEtape(3)} style={{ ...SI.ghost, flex:1 }}>← Retour</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ ...SI.btn, flex:2, opacity:submitting?0.6:1 }}>
                {submitting ? "ENVOI…" : "✓ SOUMETTRE"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// ─── BANNIÈRE INSCRIPTION SPOT (bouton d'entrée) ──────────────
const InscriptionBanner = ({ onInscription }) => (
  <div style={{
    marginTop: 28, marginBottom: 8,
    background: "linear-gradient(135deg, rgba(200,146,10,0.08), rgba(200,146,10,0.04))",
    border: "0.5px solid rgba(200,146,10,0.3)",
    borderRadius: 18, padding: "20px 18px",
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10,
  }}>
    <span style={{ fontSize: 26 }}>✦</span>
    <p style={{ fontSize: 13, fontWeight: 800, color: "#F4F7F7", letterSpacing: "0.05em" }}>Vous êtes un spot ?</p>
    <p style={{ fontSize: 11, color: "rgba(244,247,247,0.5)", lineHeight: 1.6 }}>
      Inscrivez votre spot dès 30 000 Ar / an et bénéficiez d'une fiche complète visible sur toute l'île.
    </p>
    <button onClick={onInscription} style={{
      background: "#C8920A", color: "#0D2B30", borderRadius: 24, padding: "10px 24px",
      fontWeight: 800, fontSize: 11, letterSpacing: "0.12em", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
    }}>
      <span>⭐</span> S'INSCRIRE — 30 000 Ar / AN
    </button>
  </div>
);

// ─── ÉCRAN URGENCES ───────────────────────────────────────────
const UrgencesScreen = ({ onInscription }) => {
  const [data, setData] = useState(URGENCES);
  const [onglet, setOnglet] = useState("sante");

  useEffect(() => {
    const load = async () => {
      try {
        const { data: rows, error } = await supabase
          .from("urgences")
          .select("*")
          .eq("actif", true)
          .order("categorie");
        if (!error && rows?.length) {
          // Normaliser : categorie Supabase → type local
          const catMap = { "Santé": "sante", "Sécurité": "securite", "Ambassade": "ambassade", "Autre": "autre" };
          setData(rows.map(r => ({
            service: r.categorie || "Urgences",
            nom: r.nom,
            contact: r.telephone || "",
            quartier: r.adresse || "",
            ville: r.ville || "",
            type: catMap[r.categorie] || "autre",
            disponible_24h: r.disponible_24h || false,
          })));
        }
      } catch { /* garder fallback */ }
    };
    load();
  }, []);

  const onglets = [
    { id: "sante",     label: "🏥 Santé",      types: ["med","sante"] },
    { id: "securite",  label: "🚔 Sécurité",   types: ["pol","securite"] },
    { id: "ambassade", label: "🏛️ Ambassades", types: ["amb","ambassade"] },
    { id: "autre",     label: "⚡ Autre",       types: ["pharm","autre"] },
  ];

  const tc = { med: "#c0392b", pol: "#2980b9", pharm: "#27ae60", amb: "#C8920A", sante: "#c0392b", securite: "#2980b9", ambassade: "#C8920A", autre: "#27ae60" };

  const currentTypes = onglets.find(o => o.id === onglet)?.types || [];
  const filtered = data.filter(u => currentTypes.includes(u.type));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      {/* En-tête */}
      <div style={{ padding: "16px 16px 0", flexShrink: 0 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 4 }}>CONTACTS ESSENTIELS</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F4F7F7", marginBottom: 12 }}>Urgences</h2>
        <div style={{ background: "rgba(139,26,26,0.15)", border: "0.5px solid rgba(139,26,26,0.4)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⊕</span>
          <p style={{ fontSize: 11, color: "rgba(244,200,200,0.8)", lineHeight: 1.5 }}>En cas d'urgence vitale, composez le 15 (SAMU) ou rendez-vous aux urgences les plus proches.</p>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{
            flexShrink: 0, padding: "8px 14px", borderRadius: 24,
            background: onglet === o.id ? "#C8920A" : "rgba(255,255,255,0.05)",
            color: onglet === o.id ? "#0D2B30" : "rgba(244,247,247,0.55)",
            border: onglet === o.id ? "none" : "0.5px solid rgba(255,255,255,0.1)",
            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>{o.label}</button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 120px", minHeight: 0 }}>
        {filtered.length === 0 ? (
          <p style={{ color: "rgba(244,247,247,0.3)", fontSize: 13, fontStyle: "italic", padding: "30px 0", textAlign: "center" }}>Aucun contact dans cette catégorie.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((u, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: `0.5px solid ${(tc[u.type] || "#C8920A")}40`,
                borderLeft: `2.5px solid ${tc[u.type] || "#C8920A"}`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#F4F7F7" }}>{u.nom}</p>
                    {u.disponible_24h && (
                      <span style={{ fontSize: 7, background: "#C8920A", color: "#0D2B30", borderRadius: 8, padding: "2px 6px", fontWeight: 800, letterSpacing: "0.05em", flexShrink: 0 }}>24H/24</span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)" }}>{u.service}{u.quartier ? ` · ${u.quartier}` : ""}{u.ville ? ` · ${u.ville}` : ""}</p>
                </div>
                {u.contact && (
                  <a href={`tel:${u.contact.replace(/\s/g, "")}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                    <div style={{ background: "rgba(200,146,10,0.15)", border: "0.5px solid rgba(200,146,10,0.35)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="phone" size={13} color="#C8920A" />
                      <span style={{ fontSize: 11, color: "#C8920A", fontWeight: 700 }}>{u.contact}</span>
                    </div>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        <InscriptionBanner onInscription={onInscription} />
      </div>
    </div>
  );
};

// ─── POPUP — POP UP ──────────────────────────────────────────
// (anciennement ForceFrappePopup)
const PopUpAd = ({ ad, onClose }) => {
  const [canClose, setCanClose] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!ad) return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(8px)",
    }}>
      <div style={{
        width: "100%", maxWidth: 340,
        borderRadius: 32, overflow: "hidden",
        border: "1px dashed rgba(200,146,10,0.5)",
        background: "rgba(13,43,48,0.95)",
        position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14, zIndex: 10,
          background: "rgba(0,0,0,0.6)", border: "0.5px solid rgba(255,255,255,0.15)",
          borderRadius: "50%", width: 34, height: 34, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="x" size={16} color="#F4F7F7" />
        </button>
        <div style={{ height: 440, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
          <span style={{ fontSize: 52, marginBottom: 20 }}>📢</span>
          <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.4em", fontWeight: 700, marginBottom: 12 }}>✦ POP UP EXCLUSIF</p>
          <h3 style={{ fontSize: 26, fontWeight: 800, color: "#F4F7F7", fontStyle: "italic", lineHeight: 1.25, marginBottom: 10 }}>Votre pub ici !</h3>
          <p style={{ fontSize: 13, color: "rgba(244,247,247,0.45)", lineHeight: 1.7, marginBottom: 28 }}>
            Offrez à votre établissement une visibilité maximale dès l'ouverture de l'app.
          </p>
          <div style={{
            background: "rgba(200,146,10,0.08)", border: "0.5px solid rgba(200,146,10,0.35)",
            borderRadius: 16, padding: "14px 18px", marginBottom: 24, width: "100%",
          }}>
            <p style={{ fontSize: 10, color: "#C8920A", fontWeight: 700, letterSpacing: "0.15em", marginBottom: 4 }}>FORMAT POP UP</p>
            <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", marginTop: 4 }}>Boost Vendredi +30%</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(244,247,247,0.3)", fontSize: 10 }}>
            <span>Contactez</span>
            <span style={{ color: "#C8920A", fontWeight: 700 }}>#wayza</span>
          </div>
        </div>
      </div>
    </div>
  );
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
            <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.35em", fontWeight: 700, marginBottom: 8 }}>✦ POP UP EXCLUSIF</p>
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

// ─── BANDEAU VENDREDI ─────────────────────────────────────────
const VendrediBanner = () => {
  if (!isVendredi()) return null;
  return (
    <div style={{
      background: "linear-gradient(90deg, rgba(224,136,32,0.18), rgba(200,146,10,0.12))",
      borderBottom: "0.5px solid rgba(224,136,32,0.35)",
      padding: "6px 16px",
      display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
    }}>
      <span style={{ fontSize: 13 }}>🔶</span>
      <p style={{ fontSize: 9, color: "#E08820", fontWeight: 700, letterSpacing: "0.2em" }}>
        BOOST VENDREDI — TARIFS +30% AUJOURD'HUI
      </p>
    </div>
  );
};

// ─── ÉCRAN CONTACTS WAYZA ─────────────────────────────────────
const ContactsScreen = ({ onInscription }) => {
  const [params, setParams] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("parametres").select("*");
        if (data?.length) {
          const map = {};
          data.forEach(p => { map[p.cle] = p.valeur; });
          setParams(map);
        }
      } catch { /* garder null */ }
      setLoading(false);
    };
    load();
  }, []);

  // Contacts par défaut si la table est vide
  const contact = params || {
    whatsapp: "+261 34 00 000 00",
    email: "contact@wayza.mg",
    instagram: "@wayza_madagascar",
    facebook: "WAYZA Madagascar",
    adresse: "Antananarivo, Madagascar",
  };

  const rows = [
    { icon: "whatsapp", label: "WhatsApp", value: contact.whatsapp, href: contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g,"")}` : null, color: "#25D166" },
    { icon: "phone",    label: "Téléphone", value: contact.telephone || contact.whatsapp, href: contact.telephone ? `tel:${contact.telephone.replace(/\s/g,"")}` : null, color: "#C8920A" },
    { icon: "ig",       label: "Instagram", value: contact.instagram, href: contact.instagram ? (contact.instagram.startsWith("http") ? contact.instagram : `https://instagram.com/${contact.instagram.replace("@","")}`) : null, color: "#E4405F" },
    { icon: "fb",       label: "Facebook",  value: contact.facebook,  href: contact.facebook  ? (contact.facebook.startsWith("http")  ? contact.facebook  : `https://facebook.com/${contact.facebook}`) : null, color: "#1877F2" },
    { icon: "map",      label: "Adresse",   value: contact.adresse,   href: null, color: "#C8920A" },
  ].filter(r => r.value);

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 16px 120px", minHeight: 0 }}>
      <div style={{ marginBottom: 24, paddingTop: 4 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 4 }}>NOUS REJOINDRE</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F4F7F7", fontStyle: "italic" }}>Contacts WAYZA</h2>
      </div>

      {/* Bloc identité */}
      <div style={{ background: "linear-gradient(135deg, rgba(200,146,10,0.1), rgba(200,146,10,0.04))", border: "0.5px solid rgba(200,146,10,0.3)", borderRadius: 20, padding: "22px 20px", marginBottom: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, fontStyle: "italic", color: "#F4F7F7", letterSpacing: "0.05em", marginBottom: 4 }}>
          WAY<span style={{ color: "#C8920A" }}>ZA</span>
        </h1>
        <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", letterSpacing: "0.3em" }}>MADAGASCAR 2026</p>
        {contact.slogan && <p style={{ fontSize: 12, color: "rgba(244,247,247,0.5)", fontStyle: "italic", marginTop: 10, lineHeight: 1.5 }}>{contact.slogan}</p>}
      </div>

      {/* Liste contacts */}
      {loading ? (
        <p style={{ fontSize: 12, color: "rgba(244,247,247,0.35)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>Chargement…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {rows.map((r) => (
            <div key={r.label}
              onClick={() => r.href && window.open(r.href, "_blank")}
              style={{
                background: "rgba(255,255,255,0.03)", border: `0.5px solid ${r.color}30`,
                borderLeft: `3px solid ${r.color}`, borderRadius: 14,
                padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
                cursor: r.href ? "pointer" : "default",
              }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${r.color}15`, border: `0.5px solid ${r.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={r.icon} size={18} color={r.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 9, color: "rgba(244,247,247,0.35)", letterSpacing: "0.2em", marginBottom: 2 }}>{r.label.toUpperCase()}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#F4F7F7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</p>
              </div>
              {r.href && <Icon name="chevron" size={14} color={`${r.color}80`} />}
            </div>
          ))}
        </div>
      )}

      {/* Encart "Vous êtes un spot ?" */}
      <InscriptionBanner onInscription={onInscription} />
    </div>
  );
};

// ─── ÉCRAN OFFRES À LA CARTE ──────────────────────────────────
const OffresScreen = ({ onInscription, onContact }) => {
  const OFFRES = [
    { v:"popup",         l:"Pop Up",           icon:"🎯", prix:"200 000 Ar/j",  desc:"Plein écran au lancement de l'appli. Visibilité maximale.", color:"#C8920A",  exemple:"Orchidea Club — La nuit commence ici" },
    { v:"banniere_haut", l:"Bannière Haut",     icon:"📢", prix:"20 000 Ar/j",   desc:"Carrousel en haut de la liste des spots. Votre image et votre slogan.", color:"#1A6B9A", exemple:"Sky Bar Zoma — La ville à vos pieds" },
    { v:"banniere_bas",  l:"Bannière Bas",      icon:"📌", prix:"10 000 Ar/j",   desc:"Pied de liste — vu à la fin du scroll.", color:"#4A7A4A",   exemple:"Roots Spa — Régénérez l'essentiel" },
    { v:"sponsorise",    l:"Spot Sponsorisé",   icon:"⭐", prix:"5 000 Ar/j",    desc:"Première position dans la grille des spots.", color:"#8B4A9A",   exemple:"L'Écrin Vanille — L'île en bouche" },
    { v:"ticker",        l:"Ticker Défilant",   icon:"📡", prix:"2 000 Ar/j",    desc:"Bandeau défilant en haut de toutes les pages.", color:"#9A6A1A",   exemple:"✦ Votre message défilant ici ✦" },
    { v:"wayzmag",       l:"Wayz'Mag",          icon:"◈", prix:"Sur devis",      desc:"Article partenaire ou encart dans le magazine prestige.", color:"#C8920A",   exemple:"Reportage, portrait, publi-rédactionnel" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 16px 120px", minHeight: 0 }}>
      <div style={{ marginBottom: 24, paddingTop: 4 }}>
        <p style={{ fontSize: 9, color: "#C8920A", letterSpacing: "0.3em", fontWeight: 700, marginBottom: 4 }}>RÉGIE PUBLICITAIRE</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F4F7F7", fontStyle: "italic" }}>Offres à la carte</h2>
        <p style={{ fontSize: 11, color: "rgba(244,247,247,0.4)", marginTop: 6, lineHeight: 1.6 }}>
          Boostez votre visibilité auprès de milliers de voyageurs et de locaux premium.
        </p>
      </div>

      {/* Encart contact central */}
      <div style={{
        background: "linear-gradient(135deg, rgba(200,146,10,0.14), rgba(200,146,10,0.06))",
        border: "1px solid rgba(200,146,10,0.5)",
        borderRadius: 20, padding: "20px 18px", marginBottom: 24,
        textAlign: "center",
      }}>
        <p style={{ fontSize: 28, marginBottom: 8 }}>📢</p>
        <p style={{ fontSize: 15, fontWeight: 800, color: "#F4F7F7", marginBottom: 6 }}>Votre pub ici !</p>
        <p style={{ fontSize: 11, color: "rgba(244,247,247,0.5)", lineHeight: 1.6, marginBottom: 14 }}>
          Toutes vos campagnes publicitaires WAYZA sont gérées personnellement par Mandimbimanana.
        </p>
        <button onClick={onContact} style={{
          background: "#C8920A", color: "#0D2B30", border: "none", borderRadius: 24,
          padding: "10px 24px", fontWeight: 800, fontSize: 12, cursor: "pointer",
          letterSpacing: "0.12em", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          💬 CONTACTER #WAYZA
        </button>
      </div>

      {/* Cards offres */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {OFFRES.map(o => (
          <div key={o.v} style={{
            background: "rgba(255,255,255,0.03)",
            border: `0.5px solid ${o.color}35`,
            borderLeft: `3px solid ${o.color}`,
            borderRadius: 16, overflow: "hidden",
          }}>
            {/* Placeholder visuel "Votre pub ici" */}
            <div style={{
              height: 52,
              background: `linear-gradient(135deg, ${o.color}12, rgba(0,0,0,0.3))`,
              borderBottom: `0.5px solid ${o.color}20`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <span style={{ fontSize: 16 }}>{o.icon}</span>
              <p style={{ fontSize: 10, color: `${o.color}cc`, fontWeight: 700, letterSpacing: "0.15em", fontStyle: "italic" }}>
                {o.exemple}
              </p>
            </div>

            <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#F4F7F7" }}>{o.l}</p>
                </div>
                <p style={{ fontSize: 10, color: "rgba(244,247,247,0.45)", lineHeight: 1.5 }}>{o.desc}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: o.color }}>{o.prix}</p>
                <button onClick={onContact} style={{
                  marginTop: 6, background: `${o.color}20`, color: o.color,
                  border: `0.5px solid ${o.color}50`, borderRadius: 20,
                  padding: "5px 12px", fontSize: 9, fontWeight: 700,
                  cursor: "pointer", letterSpacing: "0.1em", fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}>RÉSERVER</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note Boost Vendredi */}
      <div style={{
        background: "rgba(224,136,32,0.08)", border: "0.5px solid rgba(224,136,32,0.3)",
        borderRadius: 14, padding: "14px 16px", marginBottom: 20,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔶</span>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#E08820", marginBottom: 3 }}>Boost Vendredi +30%</p>
          <p style={{ fontSize: 10, color: "rgba(244,247,247,0.4)", lineHeight: 1.5 }}>
            Chaque vendredi, tous les formats bénéficient automatiquement d'une visibilité accrue de 30%.
          </p>
        </div>
      </div>

      <InscriptionBanner onInscription={onInscription} />
    </div>
  );
};


export default function WayzaPrestigeApp() {
  const [tab, setTab] = useState("home");
  const [city, setCity] = useState("Toute l'île");
  const [geoCity, setGeoCity] = useState(null);
  const [geoQuartier, setGeoQuartier] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [activeAd, setActiveAd] = useState(null);
  const [ads, setAds] = useState([]);
  const [spots, setSpots] = useState(SPOTS_FALLBACK);
  const [showInscription, setShowInscription] = useState(false);
  const { isDesktop, isLandscape, isMobileLandscape } = useLayout();

  // ─── GÉOLOCALISATION AUTOMATIQUE AU DÉMARRAGE ────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const result = detecterVilleDepuisGPS(pos.coords.latitude, pos.coords.longitude);
        if (result) {
          setCity(result.ville);
          setGeoCity(result.ville);
          setGeoQuartier(result.quartier);
        }
        // Si hors zone connue → on reste sur "Toute l'île"
      },
      () => { /* Permission refusée ou erreur → "Toute l'île" par défaut */ },
      { timeout: 6000, maximumAge: 300000 }
    );
  }, []);

  // ─── PWA INSTALL BANNER ──────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  // ─── CHARGEMENT SPOTS ────────────────────────────────────────
  useEffect(() => {
    const loadSpots = async () => {
      try {
        const { data, error } = await supabase.from("spots").select("*").eq("actif", true);
        if (!error && data?.length) {
          // Normaliser : "Gold" → "Premium", "Standard" → "Tongasoa" (rétrocompat)
          // + remap photo_principale → img (nom de colonne Supabase vs nom interne)
          const normalized = data.map(s => ({
            ...s,
            pass: s.pass === "Gold" ? "Premium" : s.pass === "Standard" ? "Tongasoa" : s.pass,
            img: s.img || (typeof s.photo_principale === "string" ? s.photo_principale.replace(/^"|"$/g, "") : "") || s.image_url || s.photo || "",
            photos: Array.isArray(s.photos) ? s.photos.map(p => typeof p === "string" ? p.replace(/^"|"$/g, "") : p) : [],
            social: s.social || {},
            horaires: s.horaires || {},
            equipements: s.equipements || {},
            paiements: s.paiements || {},
            gps: s.gps || "",
            adresse: s.adresse || "",
            telephone: s.telephone || "",
            parking: s.parking || null,
            age_minimum: s.age_minimum || "",
            dress_code: s.dress_code || "",
            style: s.style || "",
            enfants: s.enfants ?? null,
            wifi_reseau: s.wifi_reseau || "",
            site_web: s.site_web || "",
            tiktok: s.tiktok || "",
            email: s.email || "",
            tarif_entree: s.tarif_entree || "",
            tarif_fourchette: s.tarif_fourchette || "",
            happy_hour: s.happy_hour || "",
            menu_jour: s.menu_jour || "",
            tarif_vip: s.tarif_vip || "",
          }));
          const supabaseIds = new Set(normalized.map(s => s.id));
          const merged = [
            ...normalized,
            ...SPOTS_FALLBACK.filter(s => !supabaseIds.has(s.id)),
          ];
          setSpots(merged);
        }
      } catch {
        // Garder SPOTS_FALLBACK
      }
    };
    loadSpots();
  }, []);

  // ─── CHARGEMENT PUBS ─────────────────────────────────────────
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
          // Normaliser anciens types vers nouveaux noms
          const normalized = data.map(a => ({
            ...a,
            type: a.type === "force_frappe" ? "popup"
                : a.type === "banniere"      ? "banniere_haut"
                : a.type,
          }));
          setAds(normalized);
          // Déclencher Pop up — UNE SEULE FOIS par session
          const popup = normalized.find(a => a.type === "popup");
          const alreadyShown = sessionStorage.getItem("wayza_popup_shown");
          if (!alreadyShown) {
            if (popup) {
              setTimeout(() => { setActiveAd(popup); setShowPopup(true); sessionStorage.setItem("wayza_popup_shown", "1"); }, 2800);
            } else {
              setTimeout(() => { setActiveAd(null); setShowPopup(true); sessionStorage.setItem("wayza_popup_shown", "1"); }, 2800);
            }
          }
        } else {
          // Aucune pub — popup placeholder une seule fois
          const alreadyShown = sessionStorage.getItem("wayza_popup_shown");
          if (!alreadyShown) {
            setTimeout(() => { setActiveAd(null); setShowPopup(true); sessionStorage.setItem("wayza_popup_shown", "1"); }, 2800);
          }
        }
      } catch {
        // Popup placeholder en cas d'erreur — une seule fois
        const alreadyShown = sessionStorage.getItem("wayza_popup_shown");
        if (!alreadyShown) {
          setTimeout(() => { setActiveAd(null); setShowPopup(true); sessionStorage.setItem("wayza_popup_shown", "1"); }, 2800);
        }
      }
    };
    loadAds();
  }, []);

  // ─── TICKER ──────────────────────────────────────────────────
  const tickerText = ads.find(a => a.type === "ticker")?.texte
    || "✦ VOTRE PUB ICI — Contactez #wayza ✦ VOTRE PUB ICI — Contactez #wayza ✦ VOTRE PUB ICI — Contactez #wayza ✦";

  const navItems = [
    { id: "home",    icon: "home",    label: "ACCUEIL" },
    { id: "mag",     icon: "book",    label: "WAYZ'MAG" },
    { id: "contact", icon: "phone",   label: "CONTACT" },
    { id: "urg",     icon: "shield",  label: "URGENCES" },
  ];

  const renderMain = () => {
    if (showInscription) return <InscriptionScreen onBack={() => setShowInscription(false)} />;
    if (selectedSpot) return <SpotDetailScreen spot={selectedSpot} onBack={() => setSelectedSpot(null)} />;
    if (tab === "home") return <HomeScreen city={city} setCity={setCity} geoCity={geoCity} geoQuartier={geoQuartier} onSpot={setSelectedSpot} onMag={a => { setSelectedArticle(a); setTab("mag"); }} onTab={t => { setTab(t); setSelectedSpot(null); setSelectedArticle(null); }} ads={ads} spots={spots} onInscription={() => setShowInscription(true)} />;
    if (tab === "mag") {
      if (selectedArticle) return <ArticleScreen article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
      return <MagScreen onArticle={a => setSelectedArticle(a)} ads={ads} onInscription={() => setShowInscription(true)} />;
    }
    if (tab === "offres") return <OffresScreen onInscription={() => setShowInscription(true)} onContact={() => { setTab("contact"); }} />;
    if (tab === "contact") return <ContactsScreen onInscription={() => setShowInscription(true)} />;
    if (tab === "urg") return <UrgencesScreen onInscription={() => setShowInscription(true)} />;
    // Fallback — évite un écran vide si tab a une valeur inattendue
    return <HomeScreen city={city} setCity={setCity} geoCity={geoCity} geoQuartier={geoQuartier} onSpot={setSelectedSpot} onMag={a => { setSelectedArticle(a); setTab("mag"); }} onTab={t => { setTab(t); setSelectedSpot(null); setSelectedArticle(null); }} ads={ads} spots={spots} onInscription={() => setShowInscription(true)} />;
  };

  return (
    <div className="wayza-app-root" style={{
      width: "100vw",
      height: "100dvh",
      background: "#0D2B30", color: "#F4F7F7",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex", flexDirection: "column", position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes ticker { 0%{transform:translateX(100%)} 100%{transform:translateX(-180%)} }
        @keyframes tickerFull { 0%{transform:translateX(100vw)} 100%{transform:translateX(-100%)} }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; box-sizing: border-box; margin: 0; padding: 0; }
        input, button { font-family: 'Georgia', 'Times New Roman', serif; }
        input[type="date"], input[type="time"] { color-scheme: dark; }
        html, body { background: #0D2B30; width: 100%; height: 100%; overflow: hidden; }
        .wayza-spots-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .wayza-cats-grid  { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        @media (min-width: 768px) {
          .wayza-spots-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 16px !important; }
          .wayza-cats-grid  { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (min-width: 1200px) {
          .wayza-spots-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>

      {/* Bandeau Vendredi Boost */}
      <VendrediBanner />

      {/* Header */}
      {!selectedSpot && (
        <div className="wayza-top-header" style={{ padding: "16px 20px 10px", flexShrink: 0, display: (isDesktop || isMobileLandscape) ? "none" : "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
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

      {/* Layout desktop */}
      <div className="wayza-main-layout" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: isDesktop ? "row" : "column", minHeight: 0 }}>
        {/* Sidebar desktop */}
        <div className="wayza-sidebar" style={{ display: isDesktop ? "flex" : "none", flexDirection: "column", width: 240, minWidth: 240, background: "rgba(0,0,0,0.3)", borderRight: "0.5px solid rgba(200,146,10,0.15)", padding: "24px 16px", gap: 4, overflowY: "auto" }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.4em", color: "rgba(244,247,247,0.4)", fontFamily: "Arial, sans-serif", marginBottom: 4 }}>MADAGASCAR</p>
            <h1 style={{ fontSize: 20, fontWeight: 800, fontStyle: "italic", color: "#F4F7F7", lineHeight: 1 }}>
              WAYZA <span style={{ color: "#C8920A" }}>2026</span>
            </h1>
          </div>

          {/* Wayz'Mag en haut */}
          {(() => {
            const magCat = CATEGORIES.find(c => c.name === "Wayz'Mag");
            const magActive = tab === "mag" && !selectedSpot;
            return (
              <button onClick={() => { setTab("mag"); setSelectedSpot(null); setSelectedArticle(null); }} style={{
                background: magActive ? `${magCat.glow}18` : "rgba(200,146,10,0.06)",
                border: `0.5px solid ${magActive ? magCat.glow : "rgba(200,146,10,0.3)"}`,
                borderLeft: `3px solid ${magCat.glow}`,
                borderRadius: 12, padding: "12px 14px", cursor: "pointer", width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                boxShadow: magActive ? `0 0 12px ${magCat.glow}30` : "none",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{magCat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: magActive ? magCat.glow : "#F4F7F7", letterSpacing: "0.1em", fontFamily: "Arial", fontWeight: 800, display: "block" }}>
                    WAYZ'MAG
                  </span>
                  <span style={{ fontSize: 9, color: "rgba(244,247,247,0.35)", display: "block", marginTop: 1 }}>{magCat.sub}</span>
                </div>
                <Icon name="sparkles" size={14} color={magActive ? magCat.glow : "rgba(200,146,10,0.4)"} />
              </button>
            );
          })()}

          <div style={{ height: 1, background: "rgba(200,146,10,0.12)", margin: "4px 0 8px" }} />

          {/* Bouton Contact */}
          {(() => {
            const active = tab === "contact" && !selectedSpot;
            return (
              <button onClick={() => { setTab("contact"); setSelectedSpot(null); setSelectedArticle(null); }} style={{
                background: active ? "rgba(200,146,10,0.12)" : "none",
                border: active ? "0.5px solid rgba(200,146,10,0.3)" : "0.5px solid transparent",
                borderRadius: 12, padding: "10px 14px", cursor: "pointer", width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
              }}>
                <Icon name="phone" size={16} color={active ? "#C8920A" : "rgba(244,247,247,0.4)"} />
                <span style={{ fontSize: 11, color: active ? "#C8920A" : "rgba(244,247,247,0.5)", letterSpacing: "0.15em", fontFamily: "Arial", fontWeight: 700 }}>
                  CONTACT
                </span>
              </button>
            );
          })()}

          <div style={{ height: 1, background: "rgba(200,146,10,0.12)", margin: "4px 0 8px" }} />
          {navItems.filter(i => i.id !== "mag" && i.id !== "contact").map(item => {
            const active = tab === item.id && !selectedSpot;
            return (
              <button key={item.id} onClick={() => { setTab(item.id); setSelectedSpot(null); setSelectedArticle(null); }} style={{
                background: active ? "rgba(200,146,10,0.12)" : "none",
                border: active ? "0.5px solid rgba(200,146,10,0.3)" : "0.5px solid transparent",
                borderRadius: 12, padding: "10px 14px", cursor: "pointer", width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Icon name={item.icon} size={16} color={active ? "#C8920A" : "rgba(244,247,247,0.4)"} />
                <span style={{ fontSize: 11, color: active ? "#C8920A" : "rgba(244,247,247,0.5)", letterSpacing: "0.15em", fontFamily: "Arial", fontWeight: 700 }}>
                  {item.label}
                </span>
              </button>
            );
          })}

          <div style={{ height: 1, background: "rgba(200,146,10,0.12)", margin: "8px 0" }} />
          <p style={{ fontSize: 8, color: "rgba(244,247,247,0.25)", letterSpacing: "0.2em", marginBottom: 6, paddingLeft: 4 }}>CATÉGORIES</p>

          {/* Catégories liste verticale sidebar */}
          {CATEGORIES.map(cat => {
            const active = tab === "home" && !selectedSpot;
            return (
              <button key={cat.id} onClick={() => { setTab("home"); setSelectedSpot(null); setSelectedArticle(null); }} style={{
                background: "none",
                border: "0.5px solid transparent",
                borderLeft: `2px solid ${cat.glow}60`,
                borderRadius: 10, padding: "9px 12px", cursor: "pointer", width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${cat.glow}0d`}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <span style={{ fontSize: 16, flexShrink: 0, color: cat.glow }}>{cat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10, color: "rgba(244,247,247,0.7)", fontFamily: "Arial", fontWeight: 600, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.name}</span>
                  <span style={{ fontSize: 8, color: "rgba(244,247,247,0.3)", display: "block", marginTop: 1 }}>{cat.sub}</span>
                </div>
              </button>
            );
          })}
          {/* Ticker desktop — en bas de la sidebar */}
          <div style={{ marginTop: "auto", paddingTop: 16 }}>
            <div style={{ background: "rgba(0,0,0,0.4)", borderTop: "0.5px solid rgba(200,146,10,0.2)", overflow: "hidden", borderRadius: 8, padding: "5px 0" }}>
              <div style={{ animation: "ticker 30s linear infinite", whiteSpace: "nowrap", display: "inline-block" }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", color: "#C8920A", fontFamily: "Arial, sans-serif" }}>
                  {tickerText}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Contenu principal */}
        <div className="wayza-main-content" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {renderMain()}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="wayza-bottom-nav" style={{ position: "relative", bottom: 0, left: 0, right: 0, padding: isMobileLandscape ? "6px 20px 4px" : "10px 20px 8px", paddingTop: isMobileLandscape ? "6px" : "8px", background: "linear-gradient(to top, #0D2B30 70%, transparent)", flexShrink: 0, display: isDesktop ? "none" : "block", overflow: "visible" }}>
        <div style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 50, padding: "10px 16px", display: "flex", justifyContent: "space-around", alignItems: "center", overflow: "visible", position: "relative" }}>
          {navItems.map(item => {
            const active = tab === item.id && !selectedSpot;
            return (
              <button key={item.id} onClick={() => { setTab(item.id); setSelectedSpot(null); setSelectedArticle(null); }} style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 8px",
              }}>
                {item.id === "mag" ? (
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 38, height: 38,
                      background: active ? "#C8920A" : "rgba(200,146,10,0.2)",
                      border: `2px solid ${active ? "#C8920A" : "rgba(200,146,10,0.4)"}`,
                      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, boxShadow: active ? "0 0 16px rgba(200,146,10,0.5)" : "none",
                    }}>
                      <Icon name="sparkles" size={16} color={active ? "#0D2B30" : "#C8920A"} />
                    </div>
                    <span style={{ fontSize: 9, color: active ? "#C8920A" : "rgba(244,247,247,0.5)", letterSpacing: "0.12em", fontFamily: "Arial, sans-serif", fontWeight: 800 }}>
                      WAYZ'MAG
                    </span>
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

        {/* Ticker — pleine largeur, toujours collé sous les boutons nav */}
        {!isDesktop && (
          <div style={{
            width: "100%",
            background: "#000",
            borderTop: "0.5px solid rgba(200,146,10,0.25)",
            overflow: "hidden",
            height: 20,
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: 0, left: 0,
              height: "100%",
              display: "flex",
              alignItems: "center",
              animation: "tickerFull 45s linear infinite",
              whiteSpace: "nowrap",
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", color: "#C8920A", fontFamily: "Arial, sans-serif" }}>
                {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pop Up */}
      {showPopup && <PopUpAd ad={activeAd} onClose={() => setShowPopup(false)} />}

      {/* Bannière Installation PWA */}
      {showInstallBanner && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: "rgba(13,43,48,0.97)",
          borderTop: "1px solid rgba(200,146,10,0.3)",
          padding: "10px 16px 24px",
          display: "flex", alignItems: "center", gap: 12,
          backdropFilter: "blur(16px)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        }}>
          <img src="/icon-192.png" alt="Wayza"
            style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: "#F4F7F7", fontWeight: 700, fontSize: 13, margin: 0 }}>
              Installer WAYZA
            </p>
            <p style={{ color: "rgba(244,247,247,0.45)", fontSize: 10, margin: "2px 0 0" }}>
              Accès rapide depuis votre écran d'accueil
            </p>
          </div>
          <button onClick={handleInstall} style={{
            background: "#C8920A", color: "#0D2B30", border: "none",
            borderRadius: 20, padding: "7px 16px",
            fontWeight: 800, fontSize: 11, cursor: "pointer", flexShrink: 0,
            fontFamily: "inherit", letterSpacing: "0.05em",
          }}>INSTALLER</button>
          <button onClick={() => setShowInstallBanner(false)} style={{
            background: "none", border: "none",
            color: "rgba(244,247,247,0.35)", fontSize: 20, cursor: "pointer", padding: "0 4px", flexShrink: 0,
          }}>✕</button>
        </div>
      )}
    </div>
  );
}
