"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import styles from "./page.module.css";

export default function ViewingPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAllReviews = async () => {
      try {
        // Fetch all foodcart IDs first to avoid collectionGroup index requirement
        const foodcartsSnap = await getDocs(collection(db, "Foodcarts"));
        const foodcartIds = foodcartsSnap.docs.map((d) => d.id);

        const allReviews = [];
        await Promise.all(
          foodcartIds.map(async (foodcartId) => {
            try {
              const reviewsRef = collection(db, "Foodcarts", foodcartId, "reviews");
              const q = query(reviewsRef, orderBy("createdAt", "desc"));
              const snap = await getDocs(q);
              snap.docs.forEach((d) => {
                const data = d.data();
                const createdAt =
                  data.createdAt && typeof data.createdAt.toDate === "function"
                    ? data.createdAt.toDate()
                    : null;
                allReviews.push({
                  id: d.id,
                  foodcartId,
                  author: data.author ?? "Anonymous",
                  rating: data.rating ?? 0,
                  comment: data.comment ?? "",
                  createdAt,
                });
              });
            } catch {
              // Skip foodcarts with no reviews or missing index
            }
          })
        );

        allReviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setReviews(allReviews);
      } catch (err) {
        console.error("Failed to load all reviews", err);
        setError(err?.message || "Unable to load reviews.");
      } finally {
        setLoading(false);
      }
    };

    loadAllReviews();
  }, []);

  const newPostText = useMemo(() => {
    if (reviews.length === 0) return "No reviews yet.";
    const r = reviews[0];
    return `${r.author} posted a new review for ${r.foodcartId}`;
  }, [reviews]);

  if (loading) {
    return (
      <div className={styles.viewing}>
        <h1 className={styles.title}>Reviews</h1>
        <p className={styles.newPost}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.viewing}>
        <h1 className={styles.title}>Reviews</h1>
        <p className={styles.newPost}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.viewing}>
      <h1 className={styles.title}>View other reviews here!</h1>

      <p className={styles.newPost}>
        <span className={styles.badge}>New</span>
        {newPostText}
      </p>

      <ul className={styles.reviewList}>
        {reviews.map((r) => (
          <li key={`${r.foodcartId}-${r.id}`} className={styles.reviewItem}>
            <div className={styles.reviewMeta}>
              Posted by <strong>{r.author}</strong> ·{" "}
              <span>{r.foodcartId}</span>
              {r.createdAt ? (
                <>
                  {" "}
                  · <span>{r.createdAt.toLocaleString()}</span>
                </>
              ) : null}
            </div>

            <div className={styles.reviewRating}>
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={i < r.rating ? styles.starFilled : styles.starEmpty}
                >
                  ★
                </span>
              ))}
            </div>

            <div className={styles.reviewBody}>{r.comment}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
