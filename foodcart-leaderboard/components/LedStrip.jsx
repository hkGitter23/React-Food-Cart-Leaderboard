"use client";
import styles from "./LedStrip.module.css";

export default function LedStrip() {
  const text =
    "DREXEL FOOD CART LEADERBOARD • FIND • RATE • RANK • ";

  return (
    <div className={styles.stripWrap}>
      <div className={styles.stripInner}>
        <span className={styles.stripText}>{text}</span>
        <span className={styles.stripText}>{text}</span>
        <span className={styles.stripText}>{text}</span>
        <span className={styles.stripText}>{text}</span>
      </div>
    </div>
  );
}