"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

export default function EndCTA() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-200px" });

  const scrollToChatForm = () => {
    const formElement = document.getElementById("chat-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <section ref={sectionRef} className="w-full py-24 sm:py-32 bg-gray-900 relative overflow-hidden flex items-center justify-center">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-950 to-indigo-950 z-0" />
           <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/2 -left-1/2 w-[100%] h-[100%] bg-purple-500/20 rounded-full blur-[100px]"
          />
           <motion.div 
            animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.3, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-1/2 -right-1/2 w-[100%] h-[100%] bg-indigo-500/20 rounded-full blur-[120px]"
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-10"></div>
      </div>

      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main heading */}
        <motion.div
           initial={{ opacity: 0, y: 40 }}
           animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
           transition={{ duration: 0.8 }}
        >
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-8 leading-[1] tracking-tighter uppercase font-cabinet">
            Never Drop <br className="hidden sm:block" />
            <span className="text-purple-400">The Ball</span> Again
            </h2>
        </motion.div>

        {/* Subtext */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl sm:text-2xl text-purple-100/90 max-w-2xl mx-auto mb-12 leading-relaxed font-light"
        >
          Set up your Ballpitt link in 5 minutes. Every conversation handled
          automatically.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          onClick={scrollToChatForm}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white bg-purple-600 rounded-full overflow-hidden shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <span className="relative flex items-center gap-3">
            Start Chat Demo
            <motion.svg
                className="w-6 h-6"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
            </motion.svg>
          </span>
        </motion.button>
      </div>
    </section>
  );
}
