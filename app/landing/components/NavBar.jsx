"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

const NAV_LINKS = [
  { label: "Home", href: "#hero", active: true },
  { label: "Demo", href: "#video" },
  { label: "Features", href: "#features" },
  { label: "Blog", href: "/blogs" },
];

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setIsMenuOpen(false);

    if (href === "#pricing") return;

    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <motion.header 
        className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 px-4`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div 
          className={`mx-auto max-w-4xl transition-all duration-300 ${
            isScrolled || isMenuOpen
              ? "bg-white/80 backdrop-blur-md shadow-lg border border-white/20" 
              : "bg-transparent"
          } rounded-full px-6 py-3 ml-auto mr-auto`}
        >
          <nav className="flex items-center justify-between">
            {/* Left - Logo */}
            <Link
              href="/"
              className="flex-shrink-0 text-[20px] font-black uppercase tracking-tight text-[#000000] hover:text-purple-600 transition-colors cursor-pointer"
            >
              BALLPITT
            </Link>

            {/* Center - Nav Links (Desktop) */}
            <ul className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link
                      href={link.href}
                      className="relative text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer group"
                    >
                      {link.label}
                      <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-purple-600 transform scale-x-0 origin-left transition-transform group-hover:scale-x-100" />
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="relative text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer group"
                    >
                      {link.label}
                      <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-purple-600 transform scale-x-0 origin-left transition-transform group-hover:scale-x-100" />
                    </a>
                  )}
                </li>
              ))}
            </ul>

            {/* Right - CTA Button (Desktop) */}
            <div className="hidden md:flex items-center">
              <motion.a
                href="/auth/signin"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center rounded-full bg-black px-5 py-2 text-[14px] font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg cursor-pointer"
              >
                Get Started
              </motion.a>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              type="button"
              onClick={handleToggleMenu}
              whileTap={{ scale: 0.9 }}
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors"
            >
              {isMenuOpen ? (
                <HiOutlineX className="h-5 w-5" />
              ) : (
                <HiOutlineMenu className="h-5 w-5" />
              )}
            </motion.button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-4 right-4 z-40 md:hidden"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 overflow-hidden">
               <ul className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <li key={`mobile-${link.label}`}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="block rounded-xl px-4 py-3 text-center text-[16px] font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        onClick={(e) => handleLinkClick(e, link.href)}
                        className="block rounded-xl px-4 py-3 text-center text-[16px] font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                  href="/auth/signin"
                  className="flex w-full items-center justify-center rounded-xl bg-purple-600 px-6 py-3.5 text-[16px] font-semibold text-white shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all"
                >
                  Get Started
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}