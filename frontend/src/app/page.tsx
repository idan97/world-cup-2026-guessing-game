"use client";
import { useNavigation } from "@/utils/navigation";

export default function Home() {
  const nav = useNavigation();

  return (
    <div>
      <button onClick={nav.toLogin}>Go to Dashboard</button>
    </div>
  );
}
