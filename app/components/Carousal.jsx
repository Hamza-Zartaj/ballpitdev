"use client"; // Required for React in Next.js (client-side rendering)
import React, { useState, useEffect } from "react";

const Carousel = ({ slides, slideDuration = 3000, resetDuration = 1000 }) => {
    const [activeIndex, setActiveIndex] = useState(0); // Tracks the active/current slide
    const [direction, setDirection] = useState(1); // Tracks the direction of the carousel (1 for forward, -1 for backward)

    // Carousel logic with alternating direction
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => {
                const nextIndex = prevIndex + direction; // Move forward/backward based on direction
                if (nextIndex < 0 || nextIndex >= slides.length) {
                    setDirection((prevDirection) => prevDirection * -1); // Reverse direction at the ends
                    return prevIndex + direction * -1; // Adjust index to stay within bounds
                }
                return nextIndex;
            });
        }, slideDuration); // Set duration for the carousel interval

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [slides.length, direction, slideDuration]);

    return (
        <div className="relative w-full h-[100px] bg-white overflow-hidden">
            <div
                className="flex transition-transform duration-[3000ms] ease-in-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div
                        key={slide.id}
                        className="flex-shrink-0 w-full h-full flex justify-center items-center"
                        style={{ backgroundColor: slide.bgColor }}
                    >
                        <div className="flex overflow-hidden p-[1vh] rounded-2xl h-[95px] w-[90%] pl-[20px]">
                            <div className="flex flex-1 shrink gap-4 items-center self-stretch my-auto w-full basis-0 min-w-[240px]">
                                <div className="flex flex-col flex-1 shrink self-stretch my-auto basis-0 min-w-[240px]">
                                    <div
                                        className={`text-lg font-semibold tracking-tight leading-none ${slide.titleColor}`}
                                    >
                                        {slide.title}
                                    </div>
                                    <div
                                        className={`mt-2 text-base tracking-normal leading-6 ${slide.descriptionColor}`}
                                    >
                                        {slide.description}
                                    </div>
                                </div>
                                <img
                                    loading="lazy"
                                    src={slide.image}
                                    width="80px"
                                    alt=""
                                    className="object-contain shrink-0 self-stretch my-auto aspect-square"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Carousel;