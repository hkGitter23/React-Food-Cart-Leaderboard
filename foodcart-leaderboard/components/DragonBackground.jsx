"use client";

import { usePathname } from "next/navigation";

export default function DragonBackground({ children }) {
  const pathname = usePathname();

  // Hide dragons ONLY on the map page
  const hide = pathname === "/map";

  if (hide) return <>{children}</>;

  return <div className="dragon-bg">{children}</div>;
}
