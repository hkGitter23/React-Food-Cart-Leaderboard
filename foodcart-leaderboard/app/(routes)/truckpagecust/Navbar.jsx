"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DREXEL_BLUE = "#07294D";
const DREXEL_GOLD = "#FFC600";

function DragonIcon({ size = 44 }) {
  return (
    <img
      src="/drexel-dragon.png"
      alt="Drexel Dragon"
      width={size}
      height={size}
      style={{
        display: "block",
        objectFit: "contain",
      }}
    />
  );
}


export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { label: "Search", href: "/search" },
    { label: "Map", href: "/map" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "View Reviews", href: "/viewing" },
    { label: "Profile", href: "/profileEditor" },
    { label: "Login", href: "/login" }, 
    { label: "Customize Truck Profile", href: "/truckpagecust"}
  ];

  return (
    <header style={styles.header}>
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <div style={styles.logoWrap}>
              <DragonIcon size={50} />
            </div>

            <div>
              <h1 style={styles.title}>Drexel FoodCart Leaderboard</h1>
              <p style={styles.subtitle}>Find • Rate • Rank Drexel food carts</p>

              <div style={styles.goldBar} />
            </div>
          </div>

          <div ref={menuRef} style={styles.menuWrap}>
            <button
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
              style={styles.hamburgerBtn}
            >
              <span style={styles.hamburgerLine} />
              <span style={styles.hamburgerLine} />
              <span style={styles.hamburgerLine} />
            </button>

            {open && (
              <div style={styles.dropdown}>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    style={styles.dropdownLink}
                  >
                    {link.label}
                  </Link>
                ))}

                <div style={styles.divider} />

                <button
                  onClick={() => {
                    setOpen(false);
                    alert("Hook your logout logic here.");
                  }}
                  style={styles.logoutBtn}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: { width: "100%" },

  // BIG header = about top 1/4 of page
  hero: {
    minHeight: "25vh",
    background: DREXEL_BLUE,
    color: "white",
    borderBottom: `5px solid ${DREXEL_GOLD}`,
    display: "flex",
    alignItems: "center",
  },
  heroInner: {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "22px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    minWidth: 0,
  },

  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
  },

  title: {
    margin: 0,
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: 0.2,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "8px 0 0 0",
    fontSize: 14,
    opacity: 0.9,
  },
  goldBar: {
    marginTop: 12,
    height: 4,
    width: 220,
    borderRadius: 999,
    background: DREXEL_GOLD,
  },

  menuWrap: { position: "relative", flexShrink: 0 },

  hamburgerBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.10)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
    padding: 0,
  },
  hamburgerLine: {
    width: 22,
    height: 2,
    background: "white",
    borderRadius: 999,
    margin: "0 auto",
  },

  dropdown: {
    position: "absolute",
    right: 0,
    top: 58,
    width: 230,
    background: "white",
    color: "#111",
    borderRadius: 14,
    boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.08)",
    zIndex: 999,
  },
  dropdownLink: {
    display: "block",
    padding: "12px 14px",
    textDecoration: "none",
    color: "#111",
    fontWeight: 650,
  },
  divider: { height: 1, background: "rgba(0,0,0,0.08)" },
  logoutBtn: {
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    border: "none",
    background: "white",
    cursor: "pointer",
    fontWeight: 750,
    color: "#B00020",
  },
};
