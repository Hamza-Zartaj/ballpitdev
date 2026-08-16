"use client";
import Image from "next/image";
import { motion } from "framer-motion";
const imgRectangle23824 = "/assets/1baf887bfe070ed95a8d1a3928454a7278e90ecc.png";
const img = "/assets/940aee4ccb9813f122129a52730037200f5f8e2c.png";
const img1 = "/assets/b58a37b0ddffa652a44ef20762d7225b13663bb4.png";
const img2 = "/assets/c176058ccceaa54ba53648cf2a8e223210e7ffe9.png";

function TestimonialCard({ testimonial, delay = 0 }) {
  return (
    <motion.div 
      className="bg-white box-border flex flex-col gap-[40px] sm:gap-[50px] lg:gap-[57.6px] p-6 sm:p-8 lg:p-[38.4px] rounded-[19.2px] border border-[#5b49ef]/20"
      initial={{ opacity: 0, rotateX: -20, y: 60 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        type: "spring",
        stiffness: 60,
        damping: 20,
        delay 
      }}
      whileHover={{ 
        y: -8, 
        rotateX: 3,
        boxShadow: "0px 20px 40px rgba(91, 73, 239, 0.3)",
        transition: { duration: 0.3 }
      }}
    >
      <p className="font-sans font-normal leading-relaxed text-gray-800 text-base sm:text-lg lg:text-xl">
        {testimonial.quote}
      </p>
      <div className="flex gap-[9.6px] items-center">
        <div className="relative shrink-0 size-[48px] sm:size-[52px] lg:size-[57.6px]">
          <Image
            fill
            alt={testimonial.name}
            className="rounded-full object-cover"
            src={testimonial.avatar}
            sizes="58px"
          />
        </div>
        <div className="flex flex-col gap-[4.8px] justify-center text-xs sm:text-sm lg:text-base">
          <p className="font-sans font-medium text-gray-900">{testimonial.name}</p>
          <p className="font-sans font-normal text-[#8a8a9e]">{testimonial.title}</p>
        </div>
      </div>
    </motion.div>
  );
}

function FeaturedTestimonial() {
  const gradientBg = "linear-gradient(111.119deg, rgba(91, 73, 239, 0.3) 29.552%, rgba(138, 56, 245, 0.3) 93.796%), url('data:image/svg+xml;utf8,<svg viewBox=\"0 0 1344 645\" xmlns=\"http://www.w3.org/2000/svg\" preserveAspectRatio=\"none\"><rect x=\"0\" y=\"0\" height=\"100%\" width=\"100%\" fill=\"url(%23grad)\" opacity=\"0.800000011920929\"/><defs><radialGradient id=\"grad\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"10\" gradientTransform=\"matrix(42.597 60.446 -51.544 49.955 246.03 40.536)\"><stop stop-color=\"rgba(91,73,239,1)\" offset=\"0\"/><stop stop-color=\"rgba(74,46,240,1)\" offset=\"0.5\"/><stop stop-color=\"rgba(57,18,241,1)\" offset=\"1\"/></radialGradient></defs></svg>'), linear-gradient(90deg, rgb(18, 18, 43) 0%, rgb(18, 18, 43) 100%)";

  return (
    <div 
      className="h-auto sm:h-[500px] lg:h-[645px] relative rounded-[28px] overflow-hidden"
      style={{ backgroundImage: gradientBg }}
    >
      <div className="flex flex-col lg:flex-row w-full h-full rounded-[inherit] p-[15px] gap-[24px]">
        {/* Image section - LEFT side, 70% width */}
        <div className="w-full lg:w-[70%] bg-[#12122b] h-full min-h-[300px] lg:min-h-full relative rounded-[24px]">
          <Image
            fill
            alt="Featured testimonial"
            className="object-cover pointer-events-none rounded-[24px]"
            src={imgRectangle23824}
            sizes="(max-width: 1024px) 100vw, 70vw"
            priority
          />
        </div>
        
        {/* Text section - RIGHT side, 30% width */}
        <div className="w-full lg:w-[30%] box-border flex flex-col gap-6 items-center justify-center leading-[1.45] px-5 sm:px-[25px] lg:px-[30px] py-10 sm:py-[60px] lg:py-20 rounded-3xl text-center text-white">
          <p className="text-lg sm:text-2xl lg:text-4xl font-light leading-relaxed">
            Ballpitt reduced our lead-to-opportunity time by 61%. The AI qualifies better than our SDRs.
          </p>
          <p className="font-sans text-xs sm:text-sm lg:text-base">
            — VP Sales, Georgia-Pacific
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const testimonials = [
    {
      quote: "\"Ballpitt's AI qualification cut our SDR workload in half. We're closing more high-intent leads faster than ever\"",
      name: "Michael Hayes",
      title: "Chief Executive Officer",
      avatar: img,
    },
    {
      quote: "\"The integration with Salesforce Einstein was seamless. Within a week, we were scoring leads in real time with zero manual input.\"",
      name: "Sophia Carter",
      title: "Chief Operating Officer",
      avatar: img1,
    },
    {
      quote: "\"Our TikTok ad traffic used to be noisy. Ballpitt filters everything — now 80% of the leads we get are ready for sales calls.\"",
      name: "Emma Roberts",
      title: "Chief Marketing Officer",
      avatar: img2,
    },
    {
      quote: "\"This platform feels like a supercharged SDR. It talks, qualifies, and hands off clean data straight into our CRM.\"",
      name: "James Bennett",
      title: "Chief Financial Officer",
      avatar: img2,
    },
    {
      quote: "\"We reduced our cost per qualified lead by 38% using Ballpitt's AI chat on Google Ads campaigns.\"",
      name: "Daniel Foster",
      title: "Chief Technology Officer",
      avatar: img2,
    },
    {
      quote: "\"Ballpitt's comprehensive lead database has helped us connect with more clients in weeks than ever before. The platform is intuitive, and the results have been truly impressive!\"",
      name: "Olivia Brooks",
      title: "Chief HR Officer",
      avatar: img2,
    },
  ];

  return (
    <div className="bg-[#f5f1ed] w-full py-12 sm:py-20 lg:py-[115.2px]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-[48px]">
        <div className="flex flex-col gap-12 sm:gap-16 lg:gap-[76.8px]">
          {/* Section Title */}
          <motion.div 
            className="content-stretch flex flex-col gap-[28.8px] items-center text-center w-full"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              type: "spring",
              stiffness: 80,
              damping: 15,
              duration: 0.8 
            }}
          >
            <motion.h2 
              className="font-sans font-semibold leading-tight text-3xl sm:text-4xl lg:text-5xl tracking-tight w-full"
              style={{
                backgroundImage: "linear-gradient(90deg, #5b49ef 0%, #8a38f5 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Trusted by Businesses Worldwide
            </motion.h2>
            <p className="font-sans font-normal leading-relaxed text-gray-700 text-base sm:text-lg lg:text-xl max-w-[652.8px] mx-auto">
              Ballpitt is trusted globally to streamline outreach, boost engagement, and deliver scalable, measurable results.
            </p>
          </motion.div>

          {/* Featured Testimonial */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ 
              type: "spring",
              stiffness: 50,
              damping: 20,
              duration: 1,
              delay: 0.2 
            }}
            whileHover={{
              scale: 1.02,
              rotateY: 2,
              transition: { duration: 0.4 }
            }}
          >
            <FeaturedTestimonial />
          </motion.div>

          {/* Testimonial Cards Grid */}
          <div className="flex flex-col gap-8 sm:gap-10 lg:gap-[38.4px]">
            {/* Row 1: Large-Small Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[537.6px_1fr] gap-8 lg:gap-[38.4px]">
              <TestimonialCard testimonial={testimonials[0]} delay={0.1} />
              <TestimonialCard testimonial={testimonials[1]} delay={0.2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
