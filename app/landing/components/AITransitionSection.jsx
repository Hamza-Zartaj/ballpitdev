"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function AITransitionSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const dataFlows = [
    { from: { x: 10, y: 20 }, to: { x: 50, y: 50 }, delay: 0 },
    { from: { x: 90, y: 30 }, to: { x: 50, y: 50 }, delay: 0.2 },
    { from: { x: 20, y: 80 }, to: { x: 50, y: 50 }, delay: 0.4 },
    { from: { x: 80, y: 70 }, to: { x: 50, y: 50 }, delay: 0.6 },
  ];

  return (
    <section 
      ref={sectionRef}
      className="w-full py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white via-purple-50/30 to-[#FAF9F6] relative overflow-hidden"
    >
      {/* Background animated elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            opacity: [0.05, 0.15, 0.05],
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            AI-Powered Lead Qualification
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how Ballpitt processes conversations in real-time, extracting insights and qualifying leads instantly.
          </p>
        </motion.div>

        {/* AI Processing Visualization */}
        <div className="relative h-96 max-w-3xl mx-auto">
          {/* Center AI Core */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute top-[35%] left-[42%] transform -translate-x-1/2 -translate-y-1/2 translate-y-1 z-20"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 40px rgba(147, 51, 234, 0.4)",
                  "0 0 80px rgba(147, 51, 234, 0.6)",
                  "0 0 40px rgba(147, 51, 234, 0.4)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-10 h-10 sm:w-16 sm:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* SVG for connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(147, 51, 234, 0)" />
                <stop offset="50%" stopColor="rgba(147, 51, 234, 0.8)" />
                <stop offset="100%" stopColor="rgba(147, 51, 234, 0)" />
              </linearGradient>
            </defs>
            
            {dataFlows.map((flow, index) => (
              <motion.line
                key={index}
                x1={`${flow.from.x}%`}
                y1={`${flow.from.y}%`}
                x2={`${flow.to.x}%`}
                y2={`${flow.to.y}%`}
                stroke="url(#flowGradient)"
                strokeWidth="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { 
                  pathLength: [0, 1, 1],
                  opacity: [0, 1, 0]
                } : {}}
                transition={{
                  duration: 2,
                  delay: flow.delay,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </svg>

          {/* Data nodes */}
          {[
            { x: 10, y: 10, label: "Name", icon: "👤", delay: 0.5 },
            { x: 90, y: 10, label: "Budget", icon: "💰", delay: 0.7, adjustMobile: true },
            { x: 9, y: 80, label: "Timeline", icon: "📅", delay: 0.9 },
            { x: 80, y: 70, label: "Needs", icon: "✨", delay: 1.1 },
          ].map((node, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: node.delay }}
              className="z-10 absolute"
              style={{ 
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  y: { duration: 3, repeat: Infinity, delay: node.delay }
                }}
                className={`bg-white rounded-xl shadow-lg p-4 border-2 border-purple-200 ${node.adjustMobile ? 'sm:-translate-x-0 -translate-x-12' : ''}`}
              >
                <div className="text-2xl mb-1">{node.icon}</div>
                <div className="text-xs font-semibold text-gray-700">{node.label}</div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Results Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            {
              title: "Instant Analysis",
              description: "AI extracts key information from every conversation",
              icon: "⚡",
              delay: 1.3
            },
            {
              title: "Smart Qualification",
              description: "Automatically scores and routes high-intent leads",
              icon: "🎯",
              delay: 1.5
            },
            {
              title: "Real-Time Delivery",
              description: "Qualified leads sent to your phone instantly",
              icon: "📱",
              delay: 1.7
            }
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: card.delay }}
              whileHover={{ 
                y: -5,
                boxShadow: "0 20px 40px rgba(147, 51, 234, 0.2)"
              }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100"
            >
              <motion.div 
                className="text-4xl mb-3"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: card.delay + 0.2 }}
              >
                {card.icon}
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-gray-600">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
