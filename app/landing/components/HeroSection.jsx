"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/auth/signin");
  };

  return (
    <section id="hero" className="relative w-full min-h-screen flex items-center justify-center bg-[#FAF9F6] overflow-hidden">
      {/* AI-style animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Flowing gradient orbs */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0.4, 0.6, 0.4], 
            scale: [0.8, 1.2, 0.8],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-400/40 rounded-full blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0.3, 0.5, 0.3], 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, ease: "easeInOut", repeat: Infinity, delay: 0.5 }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            opacity: [0.2, 0.4, 0.2], 
            scale: [1, 1.5, 1],
          }}
          transition={{ duration: 12, ease: "easeInOut", repeat: Infinity, delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-300/20 rounded-full blur-3xl"
        />
        
        {/* AI nodes/signals */}
        <AINodes />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 md:pt-40 pb-16">
        {/* Two Column Layout: Content Left, Phone Right */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-1 items-center">
          
          {/* Left Column - Headings and CTAs */}
          <div className="text-left space-y-8">
            {/* Main Headline - Large Bold Serif with character stagger */}
            <motion.h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 leading-[1.1] tracking-tight overflow-hidden font-cabinet"
              initial="hidden"
              animate="visible"
            >
              <AnimatedText text="Your Virtual Inside" delay={0} />
              <br />
              <AnimatedText text="Sales Team" delay={0.3} isHighlight />
            </motion.h1>

            {/* Subheading - Sans-serif */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl text-gray-600 leading-relaxed font-normal max-w-xl"
            >
              Drive high-value prospects through your chat portal: it responds, qualifies, and delivers every conversation straight to your SMS.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(147, 51, 234, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 10px 30px rgba(147, 51, 234, 0.2)",
                    "0 10px 40px rgba(147, 51, 234, 0.3)",
                    "0 10px 30px rgba(147, 51, 234, 0.2)"
                  ]
                }}
                transition={{
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-purple-600 rounded-full transition-all duration-300 overflow-hidden"
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600"
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% 100%" }}
                />
                <span className="relative z-10">Get Started Free</span>
                <svg
                  className="relative z-10 ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </motion.button>

              <motion.button
                onClick={handleGetStarted}
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "rgba(243, 232, 255, 0.5)"
                }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-purple-600 bg-white border-2 border-purple-600 rounded-full transition-all duration-300"
              >
                Watch Demo
              </motion.button>
            </motion.div>
          </div>

          {/* Right Column - Phone Mockup with Floating Cards */}
          <motion.div 
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
            className="relative max-w-md mx-auto lg:mx-0 lg:ml-auto"
          >
          {/* Central Phone Mockup */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="relative mx-auto w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px]"
          >
            {/* Phone Frame */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-3 shadow-2xl">
              <div className="bg-[#FAF9F6] rounded-[2.5rem] overflow-hidden aspect-[11/19]">
                {/* Notch */}
                <div className="relative bg-gradient-to-b from-purple-600 to-purple-700 h-24 flex items-end justify-center pb-4">
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full"></div>
                  <span className="text-white text-sm font-semibold">Ballpitt Chat</span>
                </div>
                {/* Screen Content */}
                <div className="p-4 space-y-3">
                  <div className="bg-[#FAF9F6] border border-gray-200 rounded-2xl rounded-tl-none p-3">
                    <p className="text-sm text-gray-800">Hi! Looking for sales automation?</p>
                  </div>
                  <div className="bg-purple-600 rounded-2xl rounded-tr-none p-3 ml-8">
                    <p className="text-sm text-white">Yes! Tell me more</p>
                  </div>
                  <div className="bg-[#FAF9F6] border border-gray-200 rounded-2xl rounded-tl-none p-3">
                    <p className="text-sm text-gray-800">What's your monthly lead volume?</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating UI Cards */}
            {/* Engagement Card - Top Left */}
            <motion.div 
              initial={{ opacity: 0, x: -50, y: -20, rotate: -5, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: -5, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.2, type: "spring", bounce: 0.3 }}
              whileHover={{ rotate: 0, scale: 1.05, y: -5 }}
              className="absolute -top-8 -left-4 sm:-left-12 md:-left-20 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 transform transition-transform w-40 sm:w-48 border border-purple-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </motion.div>
                <span className="text-xs font-medium text-gray-600">Engagement</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">+40%</p>
              <p className="text-xs text-gray-500">This month</p>
            </motion.div>

            {/* Sales Card - Top Right */}
            <motion.div 
              initial={{ opacity: 0, x: 50, y: -20, rotate: 5, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: 5, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.4, type: "spring", bounce: 0.3 }}
              whileHover={{ rotate: 0, scale: 1.05, y: -5 }}
              className="absolute -top-4 -right-4 sm:-right-12 md:-right-20 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 transform transition-transform w-40 sm:w-48 border border-purple-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(147, 51, 234, 0.4)",
                      "0 0 0 10px rgba(147, 51, 234, 0)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </motion.div>
                <span className="text-xs font-medium text-gray-600">Sales</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">47</p>
              <p className="text-xs text-gray-500">Qualified leads</p>
            </motion.div>

            {/* Social Proof Card - Bottom Center */}
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.6, type: "spring", bounce: 0.3 }}
              whileHover={{ y: -5, scale: 1.02, boxShadow: "0 20px 60px rgba(147, 51, 234, 0.3)" }}
              className="absolute -bottom-6 left-[15%] transform -translate-x-1/2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 w-64 sm:w-72 transition-all border border-purple-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">User Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.svg 
                      key={star} 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.4 + star * 0.1, type: "spring" }}
                      className="w-4 h-4 text-yellow-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </motion.svg>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600">1,247 businesses trust Ballpitt</p>
            </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Helper component for character-staggered text animation
function AnimatedText({ text, delay = 0, isHighlight = false }) {
  const words = text.split(" ");
  
  return (
    <span className={isHighlight ? "text-purple-600" : ""}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block">
          {word.split("").map((char, charIndex) => (
            <motion.span
              key={charIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: delay + (wordIndex * 0.05) + (charIndex * 0.02),
                ease: "easeOut"
              }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
          <span className="inline-block">&nbsp;</span>
        </span>
      ))}
    </span>
  );
}

// AI Nodes component for background visual elements
function AINodes() {
  const [nodes, setNodes] = useState(null);

  useEffect(() => {
    // Generate nodes only on client side after hydration
    const generatedNodes = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2
    }));
    setNodes(generatedNodes);
  }, []);

  // Don't render nodes until they're generated on client
  if (!nodes) {
    return <div className="absolute inset-0" />;
  }

  return (
    <div className="absolute inset-0">
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute rounded-full bg-purple-400/20"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: `${node.size}px`,
            height: `${node.size}px`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + node.delay,
            repeat: Infinity,
            delay: node.delay,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Connection lines between nodes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {nodes.slice(0, 6).map((node, i) => {
          const nextNode = nodes[(i + 1) % 6];
          return (
            <motion.line
              key={`line-${i}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${nextNode.x}%`}
              y2={`${nextNode.y}%`}
              stroke="rgba(147, 51, 234, 0.1)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
