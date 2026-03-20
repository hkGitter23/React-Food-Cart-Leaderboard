"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { useEffect} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";



export default function Page() {
  const [truckName, setTruckName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState("");
  const [photos, setPhotos] = useState([]);
  const router = useRouter();
  const [roleLoading, setRoleLoading] = useState(true);

  function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhotos((prev) => {
      const remaining = 5 - prev.length;
      const nextFiles = files.slice(0, remaining);
      const nextUrls = nextFiles.map((file) => URL.createObjectURL(file));
      return [...prev, ...nextUrls];
    });

    e.target.value = "";
  }
  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.push("/login");
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : "user";

    if (role !== "owner") {
      router.push("/");
      return;
    }

    setRoleLoading(false);
  });

  return () => unsub();
}, [router]);

if (roleLoading) return <div>Loading...</div>;



  return (
    <div className={styles.page}>
      <section className={styles.editor}>
        <h1 className={styles.title}>Customize Your truck Page</h1>

        <div className={styles.form}>
          <input
            placeholder="Type your Truck name"
            value={truckName}
            onChange={(e) => setTruckName(e.target.value)}
          />
          <input
            placeholder="Type your cuisine"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          />
          <textarea
            placeholder="Type your description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            placeholder="Type your location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            placeholder="Type food truck hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} />
        </div>
      </section>

      <section className={styles.preview}>
        <div className={styles.photoGrid}>
          {photos.map((photo, index) => (
            <img
              key={`${photo}-${index}`}
              src={photo}
              className={styles.photo}
              alt={`Food truck photo ${index + 1}`}
            />
          ))}
        </div>

        <h2>{truckName || "Truck Name"}</h2>
        <p>{cuisine || "Cuisine Type"}</p>
        <p>{description || "Truck description will appear here."}</p>
        <p>
          {location || "Location"} · {hours || "Hours"}
        </p>
      </section>
    </div>
  );
}