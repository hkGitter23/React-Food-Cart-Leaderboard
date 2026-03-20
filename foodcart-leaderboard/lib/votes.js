import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";

function formatPeriodKey(periodLabel) {
  return periodLabel.replace(/[^a-zA-Z0-9-]/g, "_");
}

export async function fetchVotes(periodLabel) {
  const key = formatPeriodKey(periodLabel);
  const snap = await getDoc(doc(db, "leaderboard", key));
  if (!snap.exists()) return {};
  return snap.data().votes ?? {};
}

export async function fetchUserVote(periodLabel, uid) {
  if (!uid) return null;
  const key = formatPeriodKey(periodLabel);
  const snap = await getDoc(doc(db, "leaderboard", key, "userVotes", uid));
  if (!snap.exists()) return null;
  return snap.data().truckId ?? null;
}

export async function castVote(periodLabel, uid, newTruckId) {
  const periodKey = formatPeriodKey(periodLabel);
  const periodRef = doc(db, "leaderboard", periodKey);
  const userVoteRef = doc(db, "leaderboard", periodKey, "userVotes", uid);

  const updatedVotes = await runTransaction(db, async (tx) => {
    const periodSnap = await tx.get(periodRef);
    const userSnap = await tx.get(userVoteRef);

    const votes = periodSnap.exists() ? { ...(periodSnap.data().votes ?? {}) } : {};
    const previousTruckId = userSnap.exists() ? userSnap.data().truckId : null;

    if (previousTruckId === newTruckId) return votes;

    if (previousTruckId) {
      votes[previousTruckId] = Math.max(0, (votes[previousTruckId] ?? 0) - 1);
    }
    votes[newTruckId] = (votes[newTruckId] ?? 0) + 1;

    tx.set(periodRef, { votes }, { merge: true });
    tx.set(userVoteRef, { truckId: newTruckId });

    return votes;
  });

  return updatedVotes;
}
