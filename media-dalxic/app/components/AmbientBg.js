"use client"

/* ═══════════════════════════════════════════════════════════════════
   AMBIENT BACKGROUND — Pure CSS star field galaxy
   Master component: density, motion, colour, quantity all here.
   Change once → every platform page updates.
   No JS randomisation = zero hydration risk.
   ═══════════════════════════════════════════════════════════════════ */

export default function AmbientBg() {
  return (
    <>
      {/* Keyframes for star drift + twinkle animations */}
      <style>{`
        @keyframes starDrift1 { 0%, 100% { transform: translate(0, 0) } 50% { transform: translate(-60px, -45px) } }
        @keyframes starDrift2 { 0%, 100% { transform: translate(0, 0) } 50% { transform: translate(50px, -30px) } }
        @keyframes starDrift3 { 0%, 100% { transform: translate(0, 0) } 50% { transform: translate(40px, 55px) } }
        @keyframes starDrift4 { 0%, 100% { transform: translate(0, 0) } 50% { transform: translate(-35px, 40px) } }
        @keyframes twinkle { 0%, 100% { opacity: 0.3 } 50% { opacity: 1 } }
        @keyframes twinkle2 { 0%, 100% { opacity: 0.15 } 35% { opacity: 0.9 } 70% { opacity: 0.4 } }
      `}</style>
      {/* Deep gradient base */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(15,12,40,1) 0%, rgba(6,10,20,1) 50%, #060A14 100%)", zIndex: 0 }} />
      {/* Subtle grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)", backgroundSize: "50px 50px", opacity: 0.5 }} />
      {/* Center glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translate(-50%, -50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, rgba(167,139,250,0.02) 40%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      {/* Bottom-right glow */}
      <div style={{ position: "fixed", bottom: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.03) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Layer 1 — tiny white pin-pricks, dense field, slow drift */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, animation: "starDrift1 18s ease-in-out infinite", backgroundImage:
        "radial-gradient(0.5px 0.5px at 12px 18px, rgba(255,255,255,0.5), transparent)," +
        "radial-gradient(0.8px 0.8px at 55px 85px, rgba(255,255,255,0.3), transparent)," +
        "radial-gradient(0.5px 0.5px at 98px 142px, rgba(255,255,255,0.4), transparent)," +
        "radial-gradient(1px 1px at 140px 28px, rgba(255,255,255,0.25), transparent)," +
        "radial-gradient(0.5px 0.5px at 185px 105px, rgba(255,255,255,0.35), transparent)," +
        "radial-gradient(0.8px 0.8px at 228px 170px, rgba(255,255,255,0.2), transparent)," +
        "radial-gradient(0.5px 0.5px at 270px 42px, rgba(255,255,255,0.45), transparent)," +
        "radial-gradient(1px 1px at 315px 128px, rgba(255,255,255,0.2), transparent)," +
        "radial-gradient(0.5px 0.5px at 358px 8px, rgba(255,255,255,0.35), transparent)," +
        "radial-gradient(0.8px 0.8px at 400px 155px, rgba(255,255,255,0.3), transparent)," +
        "radial-gradient(0.5px 0.5px at 445px 72px, rgba(255,255,255,0.4), transparent)," +
        "radial-gradient(1px 1px at 488px 190px, rgba(255,255,255,0.15), transparent)," +
        "radial-gradient(0.5px 0.5px at 530px 48px, rgba(255,255,255,0.3), transparent)," +
        "radial-gradient(0.8px 0.8px at 575px 130px, rgba(255,255,255,0.25), transparent)," +
        "radial-gradient(0.5px 0.5px at 618px 85px, rgba(255,255,255,0.4), transparent)," +
        "radial-gradient(0.5px 0.5px at 660px 165px, rgba(255,255,255,0.2), transparent)," +
        "radial-gradient(0.8px 0.8px at 705px 22px, rgba(255,255,255,0.35), transparent)," +
        "radial-gradient(0.5px 0.5px at 748px 108px, rgba(255,255,255,0.3), transparent)," +
        "radial-gradient(0.5px 0.5px at 790px 55px, rgba(255,255,255,0.25), transparent)," +
        "radial-gradient(0.8px 0.8px at 835px 178px, rgba(255,255,255,0.2), transparent)"
      , backgroundSize: "860px 200px" }} />

      {/* Layer 2 — medium violet circles + elongated diamond shapes, drift right */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, animation: "starDrift2 14s ease-in-out infinite", backgroundImage:
        "radial-gradient(2px 2px at 25px 45px, rgba(167,139,250,0.5), transparent)," +
        "radial-gradient(1px 3px at 82px 12px, rgba(129,140,248,0.35), transparent)," +
        "radial-gradient(3px 3px at 140px 98px, rgba(167,139,250,0.3), transparent)," +
        "radial-gradient(1px 2.5px at 198px 155px, rgba(99,102,241,0.4), transparent)," +
        "radial-gradient(2.5px 2.5px at 260px 68px, rgba(167,139,250,0.35), transparent)," +
        "radial-gradient(3px 1px at 318px 180px, rgba(129,140,248,0.3), transparent)," +
        "radial-gradient(2px 2px at 375px 32px, rgba(167,139,250,0.45), transparent)," +
        "radial-gradient(1px 3px at 432px 122px, rgba(99,102,241,0.3), transparent)," +
        "radial-gradient(3px 3px at 490px 75px, rgba(167,139,250,0.25), transparent)," +
        "radial-gradient(2px 1px at 548px 148px, rgba(129,140,248,0.4), transparent)," +
        "radial-gradient(2.5px 2.5px at 605px 18px, rgba(167,139,250,0.35), transparent)," +
        "radial-gradient(1px 2px at 660px 92px, rgba(99,102,241,0.3), transparent)"
      , backgroundSize: "680px 200px" }} />

      {/* Layer 3 — large soft cyan orbs + tiny cyan dots, fast diagonal */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, animation: "starDrift3 10s ease-in-out infinite", backgroundImage:
        "radial-gradient(4px 4px at 35px 82px, rgba(34,211,238,0.2), transparent)," +
        "radial-gradient(0.8px 0.8px at 80px 25px, rgba(34,211,238,0.4), transparent)," +
        "radial-gradient(6px 6px at 165px 145px, rgba(34,211,238,0.1), transparent)," +
        "radial-gradient(1px 1px at 245px 58px, rgba(34,211,238,0.45), transparent)," +
        "radial-gradient(3px 1.5px at 328px 170px, rgba(34,211,238,0.25), transparent)," +
        "radial-gradient(0.8px 0.8px at 405px 38px, rgba(34,211,238,0.4), transparent)," +
        "radial-gradient(5px 5px at 488px 112px, rgba(34,211,238,0.12), transparent)," +
        "radial-gradient(1px 1px at 568px 65px, rgba(34,211,238,0.35), transparent)," +
        "radial-gradient(3px 3px at 648px 155px, rgba(34,211,238,0.15), transparent)," +
        "radial-gradient(0.8px 0.8px at 725px 42px, rgba(34,211,238,0.4), transparent)"
      , backgroundSize: "760px 200px" }} />

      {/* Layer 4 — amber warm flecks, elongated streaks, slow counter-drift */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, animation: "starDrift4 22s ease-in-out infinite", backgroundImage:
        "radial-gradient(2px 1px at 55px 110px, rgba(245,158,11,0.35), transparent)," +
        "radial-gradient(4px 4px at 180px 35px, rgba(245,158,11,0.12), transparent)," +
        "radial-gradient(1px 2.5px at 310px 160px, rgba(245,158,11,0.3), transparent)," +
        "radial-gradient(3px 1px at 440px 78px, rgba(245,158,11,0.25), transparent)," +
        "radial-gradient(5px 5px at 570px 140px, rgba(245,158,11,0.08), transparent)," +
        "radial-gradient(1px 1px at 695px 50px, rgba(245,158,11,0.35), transparent)"
      , backgroundSize: "720px 200px" }} />

      {/* Layer 5 — rose/pink rare gems, varied shapes */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, animation: "starDrift2 26s ease-in-out infinite reverse", backgroundImage:
        "radial-gradient(2px 3px at 95px 70px, rgba(244,114,182,0.3), transparent)," +
        "radial-gradient(4px 2px at 280px 150px, rgba(244,114,182,0.15), transparent)," +
        "radial-gradient(1.5px 1.5px at 465px 30px, rgba(244,114,182,0.35), transparent)," +
        "radial-gradient(3px 5px at 650px 120px, rgba(244,114,182,0.12), transparent)"
      , backgroundSize: "720px 200px" }} />

      {/* Layer 6 — twinkling bright stars, mixed sizes + colors, pulsing */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, animation: "twinkle 3s ease-in-out infinite", backgroundImage:
        "radial-gradient(3px 3px at 100px 60px, rgba(255,255,255,0.6), transparent)," +
        "radial-gradient(1.5px 4px at 220px 170px, rgba(167,139,250,0.55), transparent)," +
        "radial-gradient(4px 4px at 340px 40px, rgba(34,211,238,0.4), transparent)," +
        "radial-gradient(2px 2px at 460px 130px, rgba(255,255,255,0.5), transparent)," +
        "radial-gradient(5px 2px at 580px 80px, rgba(99,102,241,0.35), transparent)," +
        "radial-gradient(2.5px 2.5px at 700px 165px, rgba(245,158,11,0.4), transparent)," +
        "radial-gradient(3px 1px at 820px 25px, rgba(244,114,182,0.35), transparent)," +
        "radial-gradient(2px 5px at 150px 140px, rgba(34,211,238,0.3), transparent)"
      , backgroundSize: "860px 200px" }} />

      {/* Layer 7 — second twinkle offset, different rhythm */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, animation: "twinkle2 4.5s ease-in-out infinite", backgroundImage:
        "radial-gradient(2px 2px at 65px 95px, rgba(255,255,255,0.55), transparent)," +
        "radial-gradient(4px 1.5px at 195px 15px, rgba(167,139,250,0.4), transparent)," +
        "radial-gradient(1.5px 1.5px at 385px 175px, rgba(34,211,238,0.5), transparent)," +
        "radial-gradient(3px 3px at 515px 55px, rgba(255,255,255,0.35), transparent)," +
        "radial-gradient(1px 3.5px at 645px 135px, rgba(99,102,241,0.45), transparent)," +
        "radial-gradient(5px 5px at 775px 85px, rgba(244,114,182,0.15), transparent)"
      , backgroundSize: "820px 200px" }} />
    </>
  )
}
