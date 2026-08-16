"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  const [nyTime, setNyTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const nyTimeString = now.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setNyTime(nyTimeString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const footerGroups = [
    {
      title: "Navigation",
      links: [
        { label: "Home", href: "#hero" },
        { label: "Demo", href: "#video" },
        { label: "Features", href: "#features" },
        { label: "Blog", href: "/blogs" },
      ]
    },
    {
      title: "Socials",
      links: [
        { label: "Twitter (X)", href: "#" },
        { label: "LinkedIn", href: "#" },
        { label: "Facebook", href: "#" },
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/policy" },
        { label: "Terms of Service", href: "/terms" },
      ]
    }
  ];

  const handleLinkClick = (e, href) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-[#030213] text-white overflow-hidden py-16 sm:py-20 lg:py-24 rounded-t-[3rem] mt-20">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-20">
          {footerGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-6">
              <h3 className="text-sm font-semibold tracking-widest text-purple-200/90 uppercase">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-4">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        onClick={(e) => handleLinkClick(e, link.href)}
                        className="text-gray-200 hover:text-white transition-colors duration-300 text-base sm:text-lg"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-gray-200 hover:text-white transition-colors duration-300 text-base sm:text-lg"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between border-t border-white/10 pt-10 gap-8">
            <div className="flex flex-col gap-4 items-center md:items-start">
                <h2 className="text-[15vw] md:text-[10vw] leading-[0.8] font-black text-transparent bg-clip-text bg-gradient-to-b from-white/35 to-white/8 tracking-tighter select-none pointer-events-none">
                    BALLPITT
                </h2>
                <div className="flex flex-col sm:flex-row gap-6 text-sm text-gray-300 font-medium items-center md:items-start">
                    <p>© 2026 Ballpitt Inc. All Rights Reserved.</p>
                    <p className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        New York — {nyTime || "00:00:00"}
                    </p>
                </div>
            </div>

            <button 
                onClick={handleBackToTop}
                className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all duration-300 md:self-end"
            >
                <svg 
                    className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform duration-300" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            </button>
        </div>
      </div>
    </footer>
  );
}
