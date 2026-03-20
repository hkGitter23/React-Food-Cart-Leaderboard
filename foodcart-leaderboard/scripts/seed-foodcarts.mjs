/**
 * One-time script to seed the Firestore "Foodcarts" collection
 * from the static TRUCKS array.
 *
 * Usage:  node scripts/seed-foodcarts.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load service account key directly ───────────────────────────────
const keyPath = resolve(__dirname, "..", "foodcart-leaderboard-firebase-adminsdk-fbsvc-98cd20dd11.json");
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

// ── Initialize Firebase Admin ────────────────────────────────────────
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ── TRUCKS data ──────────────────────────────────────────────────────
import { TRUCKS } from "../lib/trucks.js";

// ── Existing docs that use display-name IDs (to merge & delete) ─────
const LEGACY_DOCS = {
  "Nanu's Hot Chicken": "nanus-hot-chicken",
  "Nabin's Truck": null, // no matching slug in TRUCKS — skip merge
};

async function main() {
  console.log("Seeding Foodcarts collection...\n");

  // 1. Read existing legacy docs so we can merge their extra fields
  const legacyData = {};
  for (const [docName, targetSlug] of Object.entries(LEGACY_DOCS)) {
    if (!targetSlug) continue;
    const snap = await db.collection("Foodcarts").doc(docName).get();
    if (snap.exists) {
      legacyData[targetSlug] = snap.data();
      console.log(`  Read legacy doc "${docName}" -> will merge into "${targetSlug}"`);
    }
  }

  // 2. Write each truck
  for (const truck of TRUCKS) {
    const legacy = legacyData[truck.id] || {};

    const data = {
      name: truck.name,
      category: truck.category,
      location: truck.location,
      priceRange: truck.priceRange,
      menu: truck.menu,
      // Merge fields from legacy doc if they exist
      about: legacy.About ?? legacy.about ?? "",
      address: legacy.Address ?? legacy.address ?? truck.location,
      rating: legacy.Rating ?? legacy.rating ?? null,
      lat: legacy.lat ?? null,
      lng: legacy.lng ?? null,
      // PascalCase duplicates so the map page keeps working
      About: legacy.About ?? legacy.about ?? "",
      Address: legacy.Address ?? legacy.address ?? truck.location,
      Rating: legacy.Rating ?? legacy.rating ?? null,
      Menu: legacy.Menu ?? Object.fromEntries(
        truck.menu.map((item) => [item.name, item.price ?? ""])
      ),
    };

    await db.collection("Foodcarts").doc(truck.id).set(data, { merge: true });
    console.log(`  + ${truck.id} (${truck.name})`);
  }

  // 3. Delete old legacy docs (they've been migrated to slug-keyed docs)
  for (const docName of Object.keys(LEGACY_DOCS)) {
    try {
      await db.collection("Foodcarts").doc(docName).delete();
      console.log(`  - Deleted legacy doc "${docName}"`);
    } catch {
      // May not exist, that's fine
    }
  }

  console.log("\nDone! Check Firebase Console to verify.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
