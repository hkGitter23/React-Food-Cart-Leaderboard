"use client";

import { useEffect, useMemo, useState } from "react";
import { collectionGroup, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import styles from "./page.module.css";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAllAnnouncements = async () => {
      try {
        const q = query(
          collectionGroup(db, "announcements"),
          orderBy("createdAt", "desc"),
          limit(50)
        );

        const snap = await getDocs(q);

        const mapped = snap.docs.map((d) => {
          const data = d.data();
          const createdAt =
            data.createdAt && typeof data.createdAt.toDate === "function"
              ? data.createdAt.toDate()
              : null;

          const foodcartId = d.ref.parent?.parent?.id || "Unknown";

          return {
            id: d.id,
            foodcartId,
            title: data.title ?? "Announcement",
            message: data.message ?? data.text ?? data.body ?? "",
            createdAt,
          };
        });

        setAnnouncements(mapped);
      } catch (err) {
        console.error("Failed to load all announcements, please try again. If this keeps happening please file a report using the report button", err);
        setError("");
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllAnnouncements();
  }, []);

  const newPostText = useMemo(() => {
    if (announcements.length === 0) return "No announcements yet.";
    const a = announcements[0];
    return `${a.foodcartId} posted a new announcement`;
  }, [announcements]);

  if (loading) {
    return (
      <div className={styles.announcements}>
        <h1 className={styles.title}>Announcements</h1>
        <p className={styles.newPost}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.announcements}>
        <h1 className={styles.title}>Announcements</h1>
        <p className={styles.newPost}>{error}</p>
      </div>
    );
  }

  return (
  <div className={styles.announcements}>
    <h1 className={styles.title}>View announcements right here!</h1>

    {announcements.length === 0 ? (
  <ul className={styles.announcementList}>
    <li className={styles.announcementItem}>
      <div className={styles.announcementTitle}>
        No announcements at the moment
      </div>
      <div className={styles.announcementBody}>
        Check back later for updates from food carts.
      </div>
    </li>
  </ul>
) : (
  <ul className={styles.announcementList}>
    {announcements.map((a) => (
      <li key={`${a.foodcartId}-${a.id}`} className={styles.announcementItem}>
        <div className={styles.announcementMeta}>
          <strong>{a.foodcartId}</strong>
          {a.createdAt ? (
            <>
              {" "}
              · <span>{a.createdAt.toLocaleString()}</span>
            </>
          ) : null}
        </div>
        <div className={styles.announcementTitle}>{a.title}</div>
        <div className={styles.announcementBody}>
          {a.message || "No details provided."}
        </div>
      </li>
    ))}
  </ul>
)}
  </div>
);
}