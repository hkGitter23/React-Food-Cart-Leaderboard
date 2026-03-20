import Leaderboard from "../components/Leaderboard";
import LedStrip from "../components/LedStrip";


export default function Home() {
  return (
    <>
      <main style={{ padding: 24 }}>

        {/* LED STRIP (white page, under navbar) */}
        <div style={{ maxWidth: 1100, margin: "0 auto 20px auto" }}>
          <LedStrip />
        </div>

        <Leaderboard />
      </main>
    </>
  );
}