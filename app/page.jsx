"use client";
import LandingPage from "./landing/LandingPage";

export default function HomePage() {
  return (
    <div
      className={`font-satoshi bg-white min-h-dvh w-dvw`}
      style={{ scrollBehavior: "smooth" }}
    >
      <LandingPage/>
    </div>
  );
}
