"use client";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function VideoExplainer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <section
      ref={sectionRef}
      id="video"
      className="w-full py-24 sm:py-32 bg-[#FAF9F6] relative overflow-hidden"
    >
      {/* Ambient background glow for section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-100/30 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight font-cabinet">
            See Ballpitt in Action
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Watch how Ballpitt handles conversations, qualifies leads, and
            delivers them straight to your phone — all in under 90 seconds.
          </p>
        </motion.div>

        {/* Video container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={
            isInView
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.9, y: 40 }
          }
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 aspect-video group"
        >
          {/* Edge Glow */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-white/20 pointer-events-none z-20"></div>

          {/* Shadow/Glow behind video */}
          <div className="absolute -inset-4 bg-purple-600/30 blur-2xl -z-10 group-hover:bg-purple-600/40 transition-colors duration-500"></div>

          {!isPlaying ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 relative">
              {/* Abstract Video Placeholder Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

              <motion.button
                onClick={handlePlay}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 z-30"
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-purple-500/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <svg
                  className="relative w-6 h-6 sm:w-10 sm:h-10 text-white ml-1 drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </motion.button>

              {/* Thumbnail overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10"></div>
              <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 text-white z-20">
                <p className="text-sm sm:text-lg font-bold mb-1">
                  How Ballpitt Works
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                  <span className="bg-purple-600 px-2 py-0.5 rounded text-xs font-semibold text-white">
                    DEMO
                  </span>
                  <span>1:30</span>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/MYXcwHehPJk"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          )}
        </motion.div>
      </div>
    </section>
  );
}
