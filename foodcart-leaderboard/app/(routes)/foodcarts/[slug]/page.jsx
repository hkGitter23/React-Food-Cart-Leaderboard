"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getFoodcartBySlug } from "@/lib/foodcarts";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

export default function FoodcartPage() {
  const { slug } = useParams();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userSnap.exists()) {
          setDisplayName(userSnap.data().displayName ?? "Anonymous");
        } else {
          setDisplayName(firebaseUser.email ?? "Anonymous");
        }
      } else {
        setDisplayName("");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!slug) return;
    const decoded = decodeURIComponent(slug).toLowerCase();
    getFoodcartBySlug(decoded)
      .then((data) => setTruck(data))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const decoded = decodeURIComponent(slug).toLowerCase();
    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const reviewsRef = collection(db, "Foodcarts", decoded, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setReviews(snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            author: data.author ?? "Anonymous",
            rating: data.rating ?? 0,
            comment: data.comment ?? "",
            createdAt:
              data.createdAt && typeof data.createdAt.toDate === "function"
                ? data.createdAt.toDate()
                : null,
          };
        }));
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    loadReviews();
  }, [slug]);

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!user) return;
    if (rating === 0) { alert("Please select a star rating."); return; }
    if (!comment.trim()) { alert("Please write a comment."); return; }
    setSubmitting(true);
    try {
      const decoded = decodeURIComponent(slug).toLowerCase();
      await addDoc(collection(db, "Foodcarts", decoded, "reviews"), {
        author: displayName || "Anonymous",
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      setReviews((prev) => [
        { id: Date.now().toString(), author: displayName || "Anonymous", rating, comment: comment.trim(), createdAt: new Date() },
        ...prev,
      ]);
      setRating(0);
      setComment("");
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!truck) {
    return (
      <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          ← Back to Leaderboard
        </Link>
        <h1 style={{ marginTop: 16 }}>Food cart not found</h1>
      </main>
    );
  }

  const theme = truck.style || { primary: "#333", accent: "#0070f3" };

  // Separate Drinks from Food
  const drinkKeywords = ["tea", "coffee", "boba", "beverage", "soda", "water", "juice", "drink"];
  const drinks = truck.menu.filter(item =>
    drinkKeywords.some(keyword => item.name.toLowerCase().includes(keyword))
  );
  const food = truck.menu.filter(item =>
    !drinkKeywords.some(keyword => item.name.toLowerCase().includes(keyword))
  );

  return (
    <main style={{
      padding: "40px 20px",
      maxWidth: "800px",
      margin: "0 auto",
      minHeight: "100vh",
      backgroundColor: "#F8F9FA", // Light neutral background for better readability
      color: "#1A1A1A",
      fontFamily: "system-ui, sans-serif"
    }}>
      <Link href="/" style={{ color: theme.primary, textDecoration: "none", fontWeight: "600" }}>
        ← Back to Leaderboard
      </Link>

      {/* Header Section */}
      <header style={{ textAlign: "center", margin: "40px 0" }}>
        <h1 style={{
          fontSize: "3rem",
          color: theme.primary,
          margin: "0 0 10px 0",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}>
          {truck.name}
        </h1>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
          <span style={{ background: theme.primary, color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "0.9rem" }}>
            {truck.category}
          </span>
          <span style={{ color: "#666" }}>•</span>
          <span style={{ color: "#666", fontWeight: "500" }}>{truck.location}</span>
        </div>
      </header>

      {/* Food Section */}
      <section style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <h2 style={{
          textAlign: "center",
          borderBottom: `2px solid ${theme.primary}`,
          paddingBottom: "10px",
          marginBottom: "30px",
          color: theme.primary,
          letterSpacing: "2px"
        }}>
          MAIN MENU
        </h2>

        <div style={{ display: "grid", gap: "25px" }}>
          {food.length > 0 ? food.map((item) => (
            <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>{item.name}</div>
                {item.desc && <div style={{ color: "#777", fontSize: "0.9rem", marginTop: "4px" }}>{item.desc}</div>}
              </div>
              <div style={{ borderBottom: "1px dotted #CCC", flex: 1, margin: "0 10px" }}></div>
              <div style={{ fontWeight: "700", color: theme.primary }}>{item.price || "$--"}</div>
            </div>
          )) : <p style={{ textAlign: "center", opacity: 0.5 }}>No food items listed yet.</p>}
        </div>

        {/* Drinks Section */}
        {drinks.length > 0 && (
          <>
            <h2 style={{
              textAlign: "center",
              borderBottom: `2px solid ${theme.primary}`,
              paddingBottom: "10px",
              marginTop: "50px",
              marginBottom: "30px",
              color: theme.primary,
              letterSpacing: "2px"
            }}>
              REFRESHMENTS
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {drinks.map((drink) => (
                <div key={drink.name} style={{ textAlign: "center", padding: "10px", border: "1px solid #EEE", borderRadius: "8px" }}>
                  <div style={{ fontWeight: "600" }}>{drink.name}</div>
                  <div style={{ color: theme.primary, fontSize: "0.9rem" }}>{drink.price || "$--"}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Reviews Section */}
      <section style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginTop: "30px" }}>
        <h2 style={{
          textAlign: "center",
          borderBottom: `2px solid ${theme.primary}`,
          paddingBottom: "10px",
          marginBottom: "30px",
          color: theme.primary,
          letterSpacing: "2px"
        }}>
          REVIEWS
        </h2>

        {user ? (
          <form onSubmit={handleSubmitReview} style={{ marginBottom: "30px", paddingBottom: "20px", borderBottom: "1px solid #eee" }}>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontWeight: "600", display: "block", marginBottom: "6px" }}>Your Rating</label>
              <div style={{ display: "flex", gap: "4px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    style={{ cursor: "pointer", fontSize: "1.5rem", color: star <= rating ? "#facc15" : "#e5e7eb" }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <textarea
              placeholder="Write your review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", resize: "vertical", minHeight: "80px", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{ marginTop: "10px", background: theme.primary, color: "white", padding: "10px 24px", border: "none", borderRadius: "8px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: "600", opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        ) : (
          <p style={{ textAlign: "center", color: "#999", marginBottom: "20px" }}>
            <Link href="/login" style={{ color: theme.primary, fontWeight: "600" }}>Sign in</Link> to leave a review.
          </p>
        )}

        {reviewsLoading ? (
          <p style={{ textAlign: "center", color: "#999" }}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999" }}>No reviews yet. Be the first!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "0.95rem" }}>{r.author}</strong>
                  {r.createdAt && (
                    <span style={{ fontSize: "0.8rem", color: "#999" }}>{r.createdAt.toLocaleDateString()}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: i < r.rating ? "#facc15" : "#e5e7eb", fontSize: "0.9rem" }}>★</span>
                  ))}
                </div>
                <p style={{ margin: 0, color: "#555", fontSize: "0.95rem", lineHeight: "1.5" }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: "60px", textAlign: "center", color: "#AAA", fontSize: "0.8rem", textTransform: "uppercase" }}>
        Prices and availability subject to change • {truck.id}
      </footer>
    </main>
  );
}