import React, { useState } from "react";
import { motion } from "framer-motion";
import review1 from "../../app/assets/review-image/review1.png";
import review2 from "../../app/assets/review-image/review2.png";
import review3 from "../../app/assets/review-image/review3.png";
import review4 from "../../app/assets/review-image/review4.png";
import review5 from "../../app/assets/review-image/review5.png";
import review6 from "../../app/assets/review-image/review6.png";
import review7 from "../../app/assets/review-image/review7.png";
import review8 from "../../app/assets/review-image/review8.png";
import review9 from "../../app/assets/review-image/review9.png";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

// Icon components
const StarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ShieldCheckIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const ArrowTopRightOnSquareIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

// Motion utilities
const fadeIn = (direction, type, delay, duration) => ({
  hidden: {
    x: direction === "left" ? 100 : direction === "right" ? -100 : 0,
    y: direction === "up" ? 100 : direction === "down" ? -100 : 0,
    opacity: 0,
  },
  show: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      type,
      delay,
      duration,
      ease: "easeOut",
    },
  },
});

const staggerContainer = (staggerChildren, delayChildren) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: staggerChildren || 0.1,
      delayChildren: delayChildren || 0,
    },
  },
});

// Sample testimonials data
const testimonials = [
  {
    quote:
      "What a great service Dinar Exchange provides. They went above and beyond to help with my first purchase. Can highly recommend them to do business with. Big thank you to Russel.",
    author: "John M.",
    source: "Verified Google Review",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
  {
    quote:
      "Great service, Great prices and speedy delivery. I had a few issues as i use a building society but the lovely customer service lady on Dinar exchange was more than happy to help me out. It is so nice to talk to a real human nowadays and not just a voice recording. I am on my second order now and i feel very confident using Dinar exchange. I highly recommend",
    author: "Shelley Maxted",
    source: "Verified Google Review",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
  },
  {
    quote:
      "Always great experience and most importantly confidence in the whole process! Service is absolutely amazing, especially Sonya that communicates no matter what the time it is, and what I might need and also Sherlyn. They are all very professional and quick! They also give you a call once Your notes have been shipped ! I would have give them 7stars Review if I could! Shop with confidence and fairness 🌟🌟🌟🌟🌟🌟🌟Thank you ladies so much ! I appreciate you! Great service as Always!!!",
    author: "Maya Maryanovich",
    source: "Verified Google Review",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
  },
  {
    quote:
      "Courteous and helpful staff. Thorough follow-up. Safe delivery of purchases. No complaints at all, just praise.",
    author: "Beverley Currie",
    source: "Verified Google Review",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
  {
    quote:
      "Great people to deal with. Very helpful, very efficient and professional. Thanks Dinar Exchange.",
    author: "Fiona J",
    source: "Verified Google Review",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face",
  },
  {
    quote:
      "2nd time using Dinar Exchange. Quick process, quick deliveries, A+ communication.",
    author: "Craig Lees",
    source: "Verified Google Review",
    rating: 5,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
  },
];

export function Testimonials3DCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleReview = (index) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const isLongReview = (text) => text.length > 150;

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
    setTimeout(() => setIsAnimating(false), 600);
  };

  const goToSlide = (index) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const getSlidePosition = (index) => {
    const diff = index - currentIndex;
    const totalSlides = testimonials.length;

    let normalizedDiff = diff;
    if (normalizedDiff > totalSlides / 2) {
      normalizedDiff -= totalSlides;
    } else if (normalizedDiff < -totalSlides / 2) {
      normalizedDiff += totalSlides;
    }

    return normalizedDiff;
  };

  const getSlideStyle = (index) => {
    const position = getSlidePosition(index);
    const isActive = position === 0;
    const isVisible = Math.abs(position) <= 2; // Show 5 items total (center + 2 on each side)

    if (!isVisible) {
      return {
        opacity: 0,
        transform: "translateX(200%) rotateY(90deg) scale(0.5)",
        zIndex: 0,
        pointerEvents: "none",
       
      };
    }

    // Calculate positioning for 5 items
    const translateX = position * 85; // Reduced spacing to fit 5 items
    const rotateY = position * 20; // Slightly reduced rotation

    // Scale and opacity based on position
    let scale,
      opacity,
      blur = 0;

    if (position === 0) {
      // Center item - fully visible and clear
      scale = 1;
      opacity = 1;
      blur = 0;
    } else if (Math.abs(position) === 1) {
      // Adjacent items - clear but smaller
      scale = 0.85;
      opacity = 1;
      blur = 0;
    } else if (Math.abs(position) === 2) {
      // Outer items - blurred and smaller
       scale = 0.7;
      opacity = 1;
      blur = 0;
    }

    const zIndex = 10 - Math.abs(position);

    return {
      transform: `translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
     
      pointerEvents: Math.abs(position) <= 1 ? "auto" : "none", // Only center and adjacent items are clickable
    };
  };


  return (
    <section className="py-4 bg-gradient-to-r from-blue-100 to-orange-100 overflow-hidden min-h-[80vh]">
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="container mx-auto px-4 max-w-7xl"
      >
        {/* Header Section */}
        <motion.div
          variants={fadeIn("up", "tween", 0.1, 1)}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full px-4 mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              VERIFIED REVIEWS
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What Our <span className="text-orange-700">Customers</span> Say
          </h2>

          <div className="flex justify-center items-center gap-3 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-7 h-7 text-amber-400" />
              ))}
            </div>
            <span className="text-3xl font-bold text-gray-800">4.8</span>
          </div>

          
        </motion.div>

        {/* 3D Carousel Container */}
        <motion.div
          variants={fadeIn("up", "tween", 0.2, 1)}
          className="relative h-[400px] mb-8"
          style={{ perspective: "1200px" }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="absolute w-72 h-96 transition-all duration-500 ease-out cursor-pointer"
                style={getSlideStyle(index)}
                onClick={() => goToSlide(index)}
                whileHover={
                  getSlidePosition(index) === 0
                    ? {
                        scale: 1.03,
                        boxShadow:
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }
                    : {}
                }
              >
                <div
                  className={`
    bg-gradient-to-br from-blue-50 to-orange-50
    p-6 rounded-xl shadow-lg border border-gray-100
    h-full transform-gpu backdrop-blur-sm
    relative overflow-hidden
  `}
                >
                  {/* Gradient accent bar */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-orange-500" />

                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-5 h-5 text-amber-400" />
                    ))}
                  </div>

                  <div className="relative mb-4 h-40 overflow-y-auto">
                    <p className="text-gray-700 italic text-sm leading-relaxed">
                      {isLongReview(testimonial.quote) &&
                      !expandedReviews[index] ? (
                        <>
                          {`${testimonial.quote.substring(0, 150)}... `}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReview(index);
                            }}
                            className="text-blue-600 hover:text-orange-600 font-medium transition-colors"
                          >
                            Read More
                          </button>
                        </>
                      ) : (
                        <>
                          {testimonial.quote}
                          {isLongReview(testimonial.quote) &&
                            expandedReviews[index] && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReview(index);
                                }}
                                className="text-blue-600 hover:text-orange-600 font-medium block mt-2 transition-colors"
                              >
                                Show Less
                              </button>
                            )}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-auto pt-4 border-t border-gray-100">
                    <div className="relative">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-5 h-5 text-blue-500 bg-white rounded-full p-0.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          {testimonial.author.split(" ")[0]}
                        </p>
                        <ShieldCheckIcon className="w-3 h-3 text-blue-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Purchased {testimonial.quantity} dinars •{" "}
                        {testimonial.source}
                      </p>
                    </div>
                  </div>

                  {/* Blue-orange accent corner */}
                  <div className="absolute bottom-0 right-0 w-16 h-16">
                    <div
                      className="absolute bottom-0 right-0 w-0 h-0 
        border-l-[40px] border-l-transparent
        border-b-[40px] border-b-blue-500
        opacity-10 rounded-br-xl"
                    />
                    <div
                      className="absolute bottom-0 right-0 w-0 h-0 
        border-l-[30px] border-l-transparent
        border-b-[30px] border-b-orange-500
        opacity-20 rounded-br-xl"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={prevSlide}
            disabled={isAnimating}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Pagination Dots */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? "bg-orange-600 scale-125 shadow-lg"
                    : "bg-gray-300 hover:bg-gray-400"
                } disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={isAnimating}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

      

        {/* Mobile responsive note */}
        <div className="text-center mt-4 md:hidden">
          <p className="text-xs text-gray-400">
            Swipe left or right to navigate on mobile
          </p>
        </div>
      </motion.div>
    </section>
  );
}
