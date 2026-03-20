"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const DEFAULT_PROFILE = {
  backgroundColor: "#3b82f6",
  displayName: "John Dragon",
  bio: "Food enthusiast and Drexel senior. Always on the hunt for the best campus eats!",
  gradMonth: "June",
  gradYear: "2026",
  profilePicture: "",
  isDark: false,
};

export default function Page() {
  const [uid, setUid] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_PROFILE.backgroundColor);
  const [displayName, setDisplayName] = useState(DEFAULT_PROFILE.displayName);
  const [bio, setBio] = useState(DEFAULT_PROFILE.bio);
  const [gradMonth, setGradMonth] = useState(DEFAULT_PROFILE.gradMonth);
  const [gradYear, setGradYear] = useState(DEFAULT_PROFILE.gradYear);
  const [profilePicture, setProfilePicture] = useState(DEFAULT_PROFILE.profilePicture);

  const [isDark, setIsDark] = useState(DEFAULT_PROFILE.isDark);
  const [saving, setSaving] = useState(false);
  const [uploadingPfp, setUploadingPfp] = useState(false);

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Helper: apply global theme
  const applyTheme = (dark) => {
    const theme = dark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("drexel_theme", theme);
    } catch {}
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUid(null);
        setLoadingProfile(false);

        // If not logged in, still respect localStorage theme
        try {
          const saved = localStorage.getItem("drexel_theme");
          document.documentElement.setAttribute("data-theme", saved === "dark" ? "dark" : "light");
        } catch {
          document.documentElement.setAttribute("data-theme", "light");
        }
        return;
      }

      setUid(user.uid);

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();

          setBackgroundColor(data.backgroundColor ?? DEFAULT_PROFILE.backgroundColor);
          setDisplayName(data.displayName ?? DEFAULT_PROFILE.displayName);
          setBio(data.bio ?? DEFAULT_PROFILE.bio);
          setGradMonth(data.gradMonth ?? DEFAULT_PROFILE.gradMonth);
          setGradYear(data.gradYear ?? DEFAULT_PROFILE.gradYear);
          setProfilePicture(data.profilePicture ?? DEFAULT_PROFILE.profilePicture);

          const dark = data.isDark ?? DEFAULT_PROFILE.isDark;
          setIsDark(dark);

          // IMPORTANT: apply globally so it affects ALL pages
          applyTheme(dark);
        } else {
          await setDoc(userRef, {
            ...DEFAULT_PROFILE,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          applyTheme(DEFAULT_PROFILE.isDark);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    });

    return () => unsub();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uid) {
      alert("You must be logged in to upload a profile picture.");
      return;
    }

    const MAX_MB = 3;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`Image too large. Please upload an image under ${MAX_MB}MB.`);
      return;
    }

    setUploadingPfp(true);

    try {
      const fileRef = ref(storage, `profilePictures/${uid}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      setProfilePicture(url);

      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { profilePicture: url, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error("Profile picture upload failed:", err);
      alert("Upload failed — check console.");
    } finally {
      setUploadingPfp(false);
    }
  };

  const handleToggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);

    // IMPORTANT: apply globally so other tabs become dark/light too
    applyTheme(next);

    if (!uid) return;

    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { isDark: next, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
  };

  const handleSave = async () => {
    if (!uid) {
      alert("You must be logged in to save your profile.");
      return;
    }

    setSaving(true);

    try {
      const userRef = doc(db, "users", uid);
      await setDoc(
        userRef,
        {
          backgroundColor,
          displayName,
          bio,
          gradMonth,
          gradYear,
          profilePicture,
          isDark,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      alert("Profile saved!");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed — check console.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return <div style={{ padding: 24 }}>Loading profile...</div>;
  }

  return (
    <div className={`${styles.app} ${isDark ? styles.dark : ""}`}>
      <div className={styles.page}>
        <header className={styles.topBar}>
          <h1>FoodCart Profile Editor</h1>
          <button className={styles.toggleBtn} onClick={handleToggleTheme}>
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
        </header>

        <section className={`${styles.card} ${styles.previewCard}`}>
          <div className={styles.previewHeader} style={{ backgroundColor }}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>
                {profilePicture ? <img src={profilePicture} alt="avatar" /> : initials}
              </div>

              <label className={styles.avatarChange}>
                {uploadingPfp ? "Uploading..." : "Change"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                  disabled={uploadingPfp}
                />
              </label>
            </div>
          </div>

          <div className={styles.previewBody}>
            <h2 className={styles.previewName}>{displayName}</h2>
            <p className={styles.previewBio}>{bio}</p>
            <p className={styles.previewGrad}>
              Graduating {gradMonth} {gradYear}
            </p>
            <div className={styles.previewStats}>
              <p>Total Reviews: 0</p>
              <p>Total Votes: 0</p>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Edit Profile</h2>
          <p className={styles.cardSubtitle}>Customize your profile</p>

          <div className={styles.field}>
            <label>Display Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Background Color</label>
            <div className={styles.row}>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
              <input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Bio</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
            />
            <p className={styles.helper}>{bio.length} / 200</p>
          </div>

          <div className={styles.field}>
            <label>Graduation Date</label>
            <div className={styles.row}>
              <input
                placeholder="Month"
                value={gradMonth}
                onChange={(e) => setGradMonth(e.target.value)}
              />
              <input
                placeholder="Year"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}