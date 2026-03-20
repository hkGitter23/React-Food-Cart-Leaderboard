"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fetchVotes, fetchUserVote, castVote } from "@/lib/votes";
import { getAllFoodcarts } from "@/lib/foodcarts";
import styles from "./Leaderboard.module.css";

function getDrexelTerm(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  let term;
  let academicYear;

  if (month >= 9 && month <= 12) {
    term = "Fall";
    academicYear = `${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
  } else if (month >= 1 && month <= 3) {
    term = "Winter";
    academicYear = `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
  } else if (month >= 4 && month <= 6) {
    term = "Spring";
    academicYear = `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
  } else {
    term = "Summer";
    academicYear = `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
  }

  return `${term} ${academicYear}`;
}

function generatePreviousPeriods() {
  return ["Fall 25-26", "Winter 25-26"];
}

export default function Leaderboard({ trucks: trucksProp, title, subtitle }) {
  const currentPeriod = getDrexelTerm(new Date());

  const basePeriods = generatePreviousPeriods();
  const availablePeriods = basePeriods.includes(currentPeriod)
    ? basePeriods
    : [currentPeriod, ...basePeriods];

  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [query, setQuery] = useState("");
  const [baseTrucks, setBaseTrucks] = useState(
    Array.isArray(trucksProp) && trucksProp.length > 0 ? trucksProp : []
  );
  const [trucks, setTrucks] = useState(baseTrucks);
  const [loading, setLoading] = useState(!trucksProp?.length);
  const [userVoteId, setUserVoteId] = useState(null);
  const [uid, setUid] = useState(null);
  const [voting, setVoting] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState("");

  const isCurrentPeriod = selectedPeriod === currentPeriod;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null));
    return () => unsub();
  }, []);

  // Fetch food carts from Firestore on mount (unless provided via prop)
  useEffect(() => {
    if (Array.isArray(trucksProp) && trucksProp.length > 0) {
      setBaseTrucks(trucksProp);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getAllFoodcarts()
      .then((carts) => {
        if (!cancelled) {
          setBaseTrucks(carts);
          setTrucks(carts);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [trucksProp]);

  // Reset when period changes
  useEffect(() => {
    setTrucks(baseTrucks);
    setUserVoteId(null);
  }, [selectedPeriod, baseTrucks]);

  // Fetch votes and merge with base trucks
  useEffect(() => {
    if (baseTrucks.length === 0) return;
    let cancelled = false;

    async function load() {
      try {
        const [votesMap, userTruck] = await Promise.all([
          fetchVotes(selectedPeriod),
          uid ? fetchUserVote(selectedPeriod, uid) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setTrucks(
          baseTrucks.map((t) => ({
            ...t,
            votes: typeof votesMap[t.id] === "number" ? votesMap[t.id] : 0,
          }))
        );
        setUserVoteId(userTruck);
      } catch {
        if (cancelled) return;
        setTrucks(baseTrucks);
        setUserVoteId(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedPeriod, uid, baseTrucks]);

  async function handleVote(nextId) {
    if (!isCurrentPeriod || !uid || voting) return;
    if (userVoteId === nextId) return;

    const previousVoteId = userVoteId;

    setTrucks((prev) =>
      prev.map((t) => {
        if (t.id === nextId) return { ...t, votes: (t.votes || 0) + 1 };
        if (previousVoteId && t.id === previousVoteId) {
          return { ...t, votes: Math.max(0, (t.votes || 0) - 1) };
        }
        return t;
      })
    );
    setUserVoteId(nextId);

    setVoting(true);
    try {
      const updatedVotes = await castVote(selectedPeriod, uid, nextId);
      setTrucks((prev) =>
        prev.map((t) => ({
          ...t,
          votes: typeof updatedVotes[t.id] === "number" ? updatedVotes[t.id] : t.votes,
        }))
      );
    } catch {
      setTrucks((prev) =>
        prev.map((t) => {
          if (t.id === nextId) return { ...t, votes: Math.max(0, (t.votes || 0) - 1) };
          if (previousVoteId && t.id === previousVoteId) {
            return { ...t, votes: (t.votes || 0) + 1 };
          }
          return t;
        })
      );
      setUserVoteId(previousVoteId);
    } finally {
      setVoting(false);
    }
  }

  function handleSubmitReport() {
    if (!reportText.trim()) {
      alert("Please describe the issue before submitting.");
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem("drexel_foodcart_reports_v1") || "[]");

      existing.push({
        message: reportText.trim(),
        period: selectedPeriod,
        createdAt: new Date().toISOString(),
      });

      localStorage.setItem("drexel_foodcart_reports_v1", JSON.stringify(existing));
      alert("Report submitted. Thank you!");
      setReportText("");
      setShowReport(false);
    } catch (e) {
      console.error(e);
      alert("Error submitting report. Try again.");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = q
      ? trucks.filter((t) => {
          const name = (t.name ?? "").toLowerCase();
          const cat = (t.category ?? "").toLowerCase();
          const loc = (t.location ?? "").toLowerCase();
          return name.includes(q) || cat.includes(q) || loc.includes(q);
        })
      : trucks;

    return [...list].sort(
      (a, b) => (b.votes || 0) - (a.votes || 0) || a.name.localeCompare(b.name)
    );
  }, [query, trucks]);

  const maxVotes = Math.max(1, ...filtered.map((t) => t.votes || 0));

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.h1}>{title ?? "Drexel FoodCart Leaderboard"}</h1>
          <p className={styles.sub}>
            {subtitle ?? `Rankings for ${selectedPeriod}. Resets at end of each term.`}
          </p>
        </div>

        <div className={styles.controls}>
          <select
            className={styles.periodSelect}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {availablePeriods.map((p) => (
              <option key={p} value={p}>
                {p === currentPeriod ? `${p} (Current)` : p}
              </option>
            ))}
          </select>

          <input
            className={styles.search}
            placeholder="Search food carts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.headRow}>
          <span className={styles.headTitle}>
            {isCurrentPeriod ? "Current Rankings" : `${selectedPeriod} Rankings`}
          </span>
          <span className={styles.count}>{filtered.length} results</span>
        </div>

        <div className={styles.table}>
          {filtered.map((t, i) => {
            const isSelected = userVoteId === t.id;

            return (
              <div key={t.id} className={styles.row}>
                <div className={styles.left}>
                  <span className={styles.rank}>#{i + 1}</span>

                  <Link
                    href={`/foodcarts/${t.id}`}
                    className={styles.nameWrap}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <span className={styles.name}>{t.name}</span>
                    <span className={styles.tag}>{t.category}</span>
                    <span className={styles.location}>{t.location}</span>
                  </Link>
                </div>

                <div className={styles.right}>
                  <div className={styles.barWrap}>
                    <div
                      className={styles.bar}
                      style={{ width: `${((t.votes || 0) / maxVotes) * 100}%` }}
                    />
                  </div>

                  <span className={styles.votes}>{t.votes} votes</span>

                  <button
                    className={styles.voteBtn}
                    onClick={() => handleVote(t.id)}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!isCurrentPeriod || !uid || voting}
                    title={!uid && isCurrentPeriod ? "Sign in to vote" : undefined}
                    style={
                      !isCurrentPeriod || !uid
                        ? { opacity: 0.5, cursor: "not-allowed" }
                        : isSelected
                        ? { opacity: 0.7 }
                        : undefined
                    }
                  >
                    {!isCurrentPeriod
                      ? "View Only"
                      : !uid
                      ? "Sign in"
                      : isSelected
                      ? "Voted"
                      : "Vote"}
                  </button>
                </div>
              </div>
            );
          })}

          {loading && <div className={styles.empty}>Loading food carts…</div>}
          {!loading && filtered.length === 0 && <div className={styles.empty}>No matches found.</div>}
        </div>
      </div>

      <button
        className={styles.reportFloatingBtn}
        type="button"
        onClick={() => setShowReport(true)}
      >
        Report Issue
      </button>

      {showReport && (
        <div className={styles.modalOverlay} onClick={() => setShowReport(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Report an Issue</h3>

            <textarea
              className={styles.textArea}
              placeholder="Describe the issue..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />

            <div className={styles.modalButtons}>
              <button className={styles.submitBtn} type="button" onClick={handleSubmitReport}>
                Submit
              </button>

              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => setShowReport(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}