/**
 * One-time script to seed sample reviews into each Foodcart's
 * "reviews" subcollection.
 *
 * Usage:  node scripts/seed-reviews.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load service account key ─────────────────────────────────────────
const keyPath = resolve(__dirname, "..", "foodcart-leaderboard-firebase-adminsdk-fbsvc-98cd20dd11.json");
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

// ── Initialize Firebase Admin ────────────────────────────────────────
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ── Sample reviews per food cart ─────────────────────────────────────
const REVIEWS = {
  "sues-lunch-truck": [
    { author: "DragonFan", rating: 5, comment: "Best Asian food near campus. The portions are huge and the flavors are amazing!" },
    { author: "HungryDrexel", rating: 4, comment: "Always my go-to spot between classes. Quick service and tasty food." },
    { author: "FoodieDragon", rating: 5, comment: "Sue's never disappoints. The lunch specials are a great deal." },
  ],
  "lennoxs-lunch-truck": [
    { author: "SandwichLover", rating: 4, comment: "Solid sandwiches and the fries are perfectly crispy every time." },
    { author: "DrexelSenior", rating: 3, comment: "Good food, but the wait can be long during lunch rush." },
  ],
  "petes-little-lunch-box": [
    { author: "EarlyBird", rating: 5, comment: "Best breakfast on campus hands down. The bacon egg and cheese is perfect." },
    { author: "BudgetEater", rating: 5, comment: "Great prices for the quality. Pete's is always consistent." },
    { author: "MorningPerson", rating: 4, comment: "Love the cheesesteaks here. Quick and affordable." },
  ],
  "happy-sunshine": [
    { author: "NoodleFan", rating: 4, comment: "Really good Chinese food for the price. The portions are generous." },
    { author: "CampusExplorer", rating: 3, comment: "Decent food, nothing fancy but gets the job done between classes." },
  ],
  "kami": [
    { author: "KoreanFoodLover", rating: 5, comment: "The bulgogi beef with udon is incredible. Authentic Korean flavors!" },
    { author: "BibimbapFan", rating: 5, comment: "Best bibimbap near Drexel. The spicy pork is a must-try." },
    { author: "LunchRegular", rating: 4, comment: "Always fresh and flavorful. Great option for a filling meal." },
  ],
  "chicken-land": [
    { author: "ChickenKing", rating: 5, comment: "The loaded chicken fries are addictive. Best fried chicken near campus!" },
    { author: "HalalFoodie", rating: 4, comment: "Great halal options. The chicken over rice is my favorite." },
    { author: "LateNighter", rating: 4, comment: "Perfect spot for a quick and filling meal. Love the combo deals." },
  ],
  "silver-halal": [
    { author: "HalalLover", rating: 4, comment: "Solid halal cart with good prices. The lamb is tender and well-seasoned." },
    { author: "QuickBite", rating: 3, comment: "Good for a quick meal. Nothing spectacular but reliable." },
  ],
  "wokworks-drexel": [
    { author: "StirFryFan", rating: 4, comment: "Love building my own bowl. Fresh ingredients and great sauces." },
    { author: "HealthyEater", rating: 5, comment: "Best healthy option on campus. The stir-fry bowls are so good." },
  ],
  "cucina-zapata": [
    { author: "TacoTuesday", rating: 5, comment: "The chicken satay taco is out of this world. Unique fusion flavors!" },
    { author: "BobaAddict", rating: 4, comment: "Came for the boba, stayed for the burritos. Thai tea is amazing." },
    { author: "FusionFoodie", rating: 5, comment: "Most creative menu on food truck alley. The katsu burrito is a must." },
  ],
  "nanus-hot-chicken": [
    { author: "SpiceChaser", rating: 5, comment: "If you love spicy chicken, this is the spot. The tenders are perfectly crispy." },
    { author: "MilkshakeFan", rating: 4, comment: "Great chicken sandwiches and the banana pudding is a hidden gem." },
    { author: "DrexelFreshman", rating: 4, comment: "My friends and I come here every week. Never gets old!" },
  ],
};

async function main() {
  console.log("Seeding reviews subcollections...\n");

  // Spread reviews across the last 30 days so they have varied timestamps
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  for (const [cartId, reviews] of Object.entries(REVIEWS)) {
    const cartRef = db.collection("Foodcarts").doc(cartId);
    const cartSnap = await cartRef.get();

    if (!cartSnap.exists) {
      console.log(`  ? Skipping "${cartId}" (doc not found in Firestore)`);
      continue;
    }

    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      // Stagger timestamps: most recent review first, oldest last
      const daysAgo = i * 3 + Math.floor(Math.random() * 3);
      const ts = Timestamp.fromDate(new Date(now - daysAgo * DAY));

      await cartRef.collection("reviews").add({
        author: review.author,
        rating: review.rating,
        comment: review.comment,
        createdAt: ts,
      });
    }

    console.log(`  + ${cartId}: ${reviews.length} reviews`);
  }

  console.log("\nDone! Check Firebase Console to verify.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
