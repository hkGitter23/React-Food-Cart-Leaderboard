import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

const COLLECTION = "Foodcarts";

function normalize(data, id) {
  return {
    id,
    name: data.name ?? id,
    category: data.category ?? "",
    location: data.location ?? "",
    priceRange: data.priceRange ?? "",
    menu: Array.isArray(data.menu) ? data.menu : [],
    votes: 0,
  };
}

export async function getAllFoodcarts() {
  const snap = await getDocs(collection(db, COLLECTION));
  const results = [];
  snap.forEach((d) => results.push(normalize(d.data(), d.id)));
  return results;
}

export async function getFoodcartBySlug(slug) {
  const snap = await getDoc(doc(db, COLLECTION, slug));
  if (!snap.exists()) return null;
  return normalize(snap.data(), snap.id);
}
