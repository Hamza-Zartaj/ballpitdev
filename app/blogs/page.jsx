"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import NavBar from "@/app/landing/components/NavBar";
import { useEffect } from "react";

const Footer = dynamic(() => import("@/app/landing/components/Footer"), { ssr: false });

import articles from "./articles";

const primaryText = "text-[#1C1629]";
const mutedText = "text-[#5D596B]";
const cardBg =
  "bg-white border border-[#E6E3F5] shadow-[0px_10px_60px_rgba(28,22,41,0.05)]";

const BlogCard = ({ article }) => (
  <Link
    href={`/blogs/${article.slug}`}
    className={`rounded-3xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200 ${cardBg}`}
  >
    <div className="relative w-full aspect-[5/3] overflow-hidden rounded-2xl bg-gradient-to-br from-[#F3F1FF] via-white to-[#E6E8FF]">
      <img
        src={article.heroImage}
        alt={article.title}
        className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
        loading="lazy"
      />
    </div>
    <div className="flex items-center gap-2 flex-wrap text-xs uppercase tracking-wide text-[#6D64F3] font-semibold">
      {article.tags.slice(0, 2).map((tag) => (
        <span
          key={tag}
          className="px-3 py-1 rounded-full bg-[#F2F0FF] text-[#6D64F3]"
        >
          {tag}
        </span>
      ))}
    </div>
    <div className="space-y-2">
      <h3 className={`${primaryText} text-xl font-semibold leading-snug`}>
        {article.title}
      </h3>
      <p className={`${mutedText} text-base leading-relaxed`}>
        {article.excerpt}
      </p>
    </div>
    <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-[#7F7B8C]">
      <span>{article.author}</span>
      <span>{article.readTime}</span>
    </div>
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B55FF]">
      Read article
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
        />
      </svg>
    </span>
  </Link>
);

function BlogHeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F7F6FF] min-h-screen flex flex-col items-center justify-center">
      {/* Background Gradients */}
      <div className="absolute inset-0">
        <div className="w-72 h-72 bg-[#E1DBFF] opacity-70 blur-3xl rounded-full absolute -top-16 -left-10" />
        <div className="w-72 h-72 bg-[#F4E8FF] opacity-80 blur-3xl rounded-full absolute -bottom-24 right-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 text-center space-y-8">
        <div className="flex justify-start">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B55FF] hover:text-[#5B49EF] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to home
          </Link>
        </div>
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-[#6D64F3] font-semibold">
            Blog
          </p>
          <h1 className={`${primaryText} text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight font-cabinet`}>
            Digital Sampling<br />Intelligence
          </h1>
          <p className={`${mutedText} text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed`}>
            Real launch diaries, playbooks, and experiments from brands using
            Ballpitt's AI chat rooms to ship smarter sampling programs and win
            retail conversations.
          </p>
        </div>
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-[0px_20px_60px_rgba(20,10,60,0.09)] border border-[#E1DFFC] text-sm text-[#5B55FF] font-medium">
          <span className="w-2 h-2 bg-[#5B55FF] rounded-full animate-pulse"></span>
          Updated weekly with field-tested learnings
        </div>
      </div>
    </section>
  );
}

function BlogGridSection() {
  return (
    <section className="w-full bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-24">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <BlogCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function BlogIndexPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative">
      <NavBar />
      <BlogHeroSection />
      <BlogGridSection />
      <Footer />
    </div>
  );
}
