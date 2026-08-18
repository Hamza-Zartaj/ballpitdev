"use client";

import dynamic from "next/dynamic";
import { useEffect, Suspense } from "react";

// All components dynamically imported so they load together without flashing
const NavBar = dynamic(() => import("./components/NavBar"), { ssr: false });
const ChatForm = dynamic(() => import("./components/ChatForm"), { ssr: false });
const HeroSection = dynamic(() => import("./components/HeroSection"), { ssr: false });
const AITransitionSection = dynamic(() => import("./components/AITransitionSection"), { ssr: false });
const VideoExplainer = dynamic(() => import("./components/VideoExplainer"), { ssr: false });
const CoreValueSection = dynamic(() => import("./components/CoreValueSection"), { ssr: false });
const TestimonialsSection = dynamic(() => import("./components/TestimonialsSection"), { ssr: false });
const EndCTA = dynamic(() => import("./components/EndCTA"), { ssr: false });
const Footer = dynamic(() => import("./components/Footer"), { ssr: false });

// Export the LandingPage component to be used in other pages
export default function LandingPage() {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Respect reduced-motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    if (mediaQuery.matches) {
      document.documentElement.style.setProperty("--motion-duration", "0.01ms");
    }
  }, []);

  return (
    <div className="relative">
      <NavBar />
      
      <HeroSection />
      <ChatForm />
      <AITransitionSection />
      <VideoExplainer />
      <CoreValueSection />
      <TestimonialsSection />
      <EndCTA />
      <Footer />
    </div>
  );
}
