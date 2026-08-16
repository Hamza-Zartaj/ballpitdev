"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const VALUES = [
  {
    id: 1,
    icon: (
      <svg
        className="w-12 h-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "Always Available",
    subtitle: "Talk to Prospects Anywhere",
    description:
      "Share a single Ballpitt link anywhere — website, ads, Instagram, texts. Every click instantly starts a conversation.",
    visual: "signals"
  },
  {
    id: 2,
    icon: (
      <svg
        className="w-12 h-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    title: "You Control It",
    subtitle: "Decide What It Says",
    description:
      "Train Ballpitt once on your offerings, hours, and tone. Get conversation summaries and transcripts sent directly to your phone.",
    visual: "sliders"
  },
  {
    id: 3,
    icon: (
      <svg
        className="w-12 h-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    title: "High-Intent Leads",
    subtitle: "Get 5–10 New Prospects Every Month",
    description:
      "Our partner network sends you motivated buyers and sellers ready to talk — no cold calling required.",
    visual: "metrics"
  },
];

function ValueCard({ value, index }) {
  const ref = useRef(null);
  const cardRef = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="group relative"
    >
      <motion.div
        ref={cardRef}
        style={{ y }}
        whileHover={{ 
          y: -10,
          transition: { duration: 0.3 }
        }}
        className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 overflow-hidden h-full"
      >
        {/* Animated background gradient on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{ backgroundSize: "200% 200%" }}
        />
        {/* Icon */}
      <div 
        className="relative mb-6 text-purple-600 z-10"
      >
        <motion.div
          animate={{ 
            rotate: value.visual === "sliders" ? [0, 5, -5, 0] : 0,
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {value.icon}
        </motion.div>
      </div>

      {/* Title */}
      <h3 className="relative text-2xl font-bold text-gray-900 mb-2 z-10">
        {value.title}
      </h3>

      {/* Subtitle */}
      <p className="relative text-lg font-semibold text-purple-600 mb-4 z-10">
        {value.subtitle}
      </p>

      {/* Description */}
      <p className="relative text-gray-600 leading-relaxed mb-6 z-10">
        {value.description}
      </p>

      {/* Visual Representation */}
      <div className="relative h-16 mt-auto z-10">
        {value.visual === "signals" && <SignalsVisual />}
        {value.visual === "sliders" && <SlidersVisual />}
        {value.visual === "metrics" && <MetricsVisual />}
      </div>

      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -z-0 transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500 blur-2xl"></div>
    </motion.div>
    </motion.div>
  );
}

// Visual components for each value card
function SignalsVisual() {
  return (
    <div className="flex items-center justify-around h-full">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          animate={{
            height: ["40%", "100%", "60%", "100%", "40%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
          className="w-2 bg-gradient-to-t from-purple-400 to-purple-600 rounded-full"
        />
      ))}
    </div>
  );
}

function SlidersVisual() {
  return (
    <div className="space-y-3">
      {[60, 80, 45].map((value, i) => (
        <div key={i} className="relative h-2 bg-purple-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${value}%` }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="absolute h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
          />
        </div>
      ))}
    </div>
  );
}

function MetricsVisual() {
  return (
    <div className="flex items-end justify-around h-full gap-2">
      {[40, 65, 85, 70, 95].map((height, i) => (
        <motion.div
          key={i}
          initial={{ height: "0%" }}
          animate={{ height: `${height}%` }}
          transition={{
            duration: 1,
            delay: i * 0.15,
            ease: "easeOut"
          }}
          className="flex-1 bg-gradient-to-t from-purple-400 to-purple-600 rounded-t-lg relative overflow-hidden"
        >
          <motion.div
            animate={{
              y: ["0%", "-100%"],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.15 + 1,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-t from-transparent to-white/50"
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function CoreValueSection() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, amount: 0.5 });

  return (
    <section id="features" className="w-full py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white via-[#FAF9F6] to-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            opacity: [0.05, 0.1, 0.05],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-300/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Why Ballpitt Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Three pillars that make Ballpitt the most effective way to capture
            and convert leads.
          </p>
        </motion.div>

        {/* Value cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {VALUES.map((value, index) => (
            <ValueCard key={value.id} value={value} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}