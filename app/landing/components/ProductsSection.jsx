"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const PRODUCTS = [];

const ProductsSection = () => {
  const [visibleCards, setVisibleCards] = useState(new Set());
  const [isHeadingVisible, setIsHeadingVisible] = useState(false);
  const cardRefs = useRef([]);
  const headingRef = useRef(null);

  useEffect(() => {
    let headingObserver = null;

    // Observe heading
    if (headingRef.current) {
      headingObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsHeadingVisible(true);
            }
          });
        },
        { threshold: 0.2 }
      );
      headingObserver.observe(headingRef.current);
    }

    // Observe cards
    const observers = cardRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCards((prev) => new Set(prev).add(index));
            }
          });
        },
        { threshold: 0.15 }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      if (headingObserver) {
        headingObserver.disconnect();
      }
      observers.forEach((observer) => {
        if (observer) observer.disconnect();
      });
    };
  }, []);

  return (
    <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#F5F4FB] to-transparent rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F5F4FB] to-transparent rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        {/* Heading */}
        <div
          ref={headingRef}
          className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16 xl:mb-20"
          style={{
            opacity: isHeadingVisible ? 1 : 0,
            transform: isHeadingVisible ? "translateY(0)" : "translateY(20px)",
            transition:
              "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1), transform 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="inline-flex items-center justify-center rounded-full bg-[#F5F4FB] border border-[#ffffff] px-3 sm:px-3.5 md:px-4 lg:px-4.5 xl:px-5 py-1.5 sm:py-1.5 md:py-2 lg:py-2 xl:py-2.5 shadow-[0px_2px_15px_0px_#00000014] mb-4 sm:mb-5 md:mb-6">
            <span className="text-[#1C1629] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[13px] xl:text-[14px] font-medium tracking-wide">
              • OUR PRODUCTS
            </span>
          </div>
          <h2
            className="text-[#1C1629] text-[32px] sm:text-[38px] md:text-[48px] lg:text-[58px] xl:text-[68px] 2xl:text-[72px] font-medium leading-tight tracking-tight mb-3 sm:mb-4 md:mb-4 lg:mb-5 xl:mb-6 px-4"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            Discover Our Solutions
          </h2>
          <p className="text-[#494651] font-normal text-[14px] sm:text-[15px] md:text-[16px] lg:text-[17px] xl:text-[18px] 2xl:text-[19px] leading-relaxed max-w-[300px] sm:max-w-[400px] md:max-w-[520px] lg:max-w-[640px] xl:max-w-[760px] mx-auto px-4">
            Explore our innovative products designed to help your business grow
            and succeed in the digital age.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16">
          {PRODUCTS.map((product, index) => (
            <div
              key={product.id}
              ref={(el) => (cardRefs.current[index] = el)}
              className="group relative"
              style={{
                opacity: visibleCards.has(index) ? 1 : 0,
                transform: visibleCards.has(index)
                  ? "translateY(0)"
                  : "translateY(30px)",
                transition: `opacity 800ms cubic-bezier(0.4, 0, 0.2, 1) ${
                  index * 200
                }ms, transform 800ms cubic-bezier(0.4, 0, 0.2, 1) ${
                  index * 200
                }ms`,
              }}
            >
              <div
                className="relative h-full rounded-[32px] sm:rounded-[40px] md:rounded-[48px] overflow-hidden shadow-[0px_4px_20px_0px_#00000014] transition-all duration-500 ease-out group-hover:shadow-[0px_8px_30px_0px_#00000020] group-hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${product.bgColor} 0%, ${product.bgColor}dd 100%)`,
                }}
              >
                {/* Decorative gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-90`}
                ></div>

                {/* Content */}
                <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 flex flex-col h-full min-h-[400px] sm:min-h-[450px] md:min-h-[500px]">
                  {/* Product Name */}
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <h3
                      className="text-white text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] xl:text-[44px] 2xl:text-[48px] font-medium leading-tight mb-2 sm:mb-3"
                      style={{ fontFamily: "Satoshi, sans-serif" }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-white/80 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[17px] font-normal">
                      {product.tagline}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-white/90 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[17px] leading-relaxed mb-6 sm:mb-8 md:mb-10 flex-grow">
                    {product.description}
                  </p>

                  {/* Features */}
                  <div className="mb-6 sm:mb-8 md:mb-10">
                    <ul className="space-y-3 sm:space-y-4">
                      {product.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-center text-white/90 text-[13px] sm:text-[14px] md:text-[15px]"
                        >
                          <div
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-3 sm:mr-4 flex-shrink-0"
                            style={{ backgroundColor: product.iconBg }}
                          ></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={product.link}
                    className="inline-flex items-center justify-center rounded-full bg-white text-[#1C1629] px-6 sm:px-7 md:px-8 lg:px-9 xl:px-10 py-3 sm:py-3.5 md:py-4 lg:py-4.5 text-[14px] sm:text-[15px] md:text-[16px] font-medium transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg w-full sm:w-auto"
                  >
                    Learn More
                    <svg
                      className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>

                {/* Decorative corner element */}
                <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 opacity-10">
                  <div
                    className="absolute top-0 right-0 w-full h-full rounded-bl-full"
                    style={{
                      background: `linear-gradient(135deg, transparent 0%, ${product.iconBg} 100%)`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
