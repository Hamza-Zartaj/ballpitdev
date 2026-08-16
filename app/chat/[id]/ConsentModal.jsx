"use client";

import React, { useState, useRef, useEffect } from "react";

const ConsentModal = ({ onClose }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollContainerRef = useRef(null);

  // Terms & Conditions content
  const termsContent = `
    <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">Terms and Conditions for Ballpitt</h2>
    <p style="margin-bottom: 0.75rem; color: #666; font-size: 0.875rem;">Effective Date: 1 January 2025</p>
    <p style="margin-bottom: 0.75rem;">
      Welcome to Ballpitt. These Terms and Conditions ("Terms") govern your access to and use of Ballpitt ("the Platform," "we," "us," "our"). By accessing or using Ballpitt, you agree to comply with these Terms. If you do not agree, please refrain from using the Platform.
    </p>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">1. Eligibility</h3>
    <p style="margin-bottom: 0.5rem;">
      You must be at least 13 years old to use Ballpitt. If you are under 18, you must obtain parental or legal guardian consent before using the Platform.
    </p>
    <p style="margin-bottom: 0.75rem;">By using the Platform, you represent and warrant that you meet these requirements.</p>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">2. Account Registration</h3>
    <p style="margin-bottom: 0.5rem;">
      You are required to register an account to access certain features. Registration requires providing accurate personal information, including a valid email address and phone number for verification purposes.
    </p>
    <p style="margin-bottom: 0.75rem;">You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">3. Use of the Platform</h3>
    <p style="margin-bottom: 0.5rem;">
      Ballpitt is designed for gathering user psychology insights to optimize sales and influence. The creators maintain full control over the AI system and influence its outputs. The AI responses are generated based on algorithms and data inputs managed by our team.
    </p>
    <p style="margin-bottom: 0.75rem;">
      You agree not to misuse the Platform, including but not limited to engaging in fraudulent activities, identity theft, or violating any applicable laws.
    </p>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">4. User Conduct</h3>
    <p style="margin-bottom: 0.5rem;">You agree to use Ballpitt in a lawful, respectful, and responsible manner.</p>
    <ul style="list-style-type: disc; margin-left: 1.25rem; margin-bottom: 0.75rem;">
      <li>Uploading harmful, illegal, or offensive content.</li>
      <li>Attempting unauthorized access to the Platform's systems.</li>
      <li>Engaging in fraudulent activities or identity theft.</li>
    </ul>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">5. Data Privacy and Security</h3>
    <p style="margin-bottom: 0.5rem;">
      We collect personal data to improve user experience, provide services, and for research purposes.
    </p>
    <ul style="list-style-type: disc; margin-left: 1.25rem; margin-bottom: 0.75rem;">
      <li><strong>Data Sharing:</strong> We may sell or share aggregated, anonymized data with third parties for research, marketing, and business purposes.</li>
      <li><strong>Parental Consent:</strong> Users under 18 must obtain parental consent. We do not knowingly collect personal information from minors without such consent.</li>
      <li><strong>Verification:</strong> To prevent fraud and identity theft, we require email and phone number verification.</li>
    </ul>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">6. Intellectual Property</h3>
    <p style="margin-bottom: 0.5rem;">
      All content on Ballpitt, including software, text, graphics, and logos, is the property of Ballpitt or its licensors.
    </p>
    <p style="margin-bottom: 0.75rem;">
      Users retain rights to their content but grant Ballpitt a non-exclusive, royalty-free license to use, display, and distribute such content within the Platform.
    </p>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">7. Disclaimers and Limitation of Liability</h3>
    <p style="margin-bottom: 0.75rem;">
      The Platform is provided "as is" without warranties of any kind, either express or implied. Ballpitt is not responsible for any damages arising from your use of the Platform.
    </p>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">8. Arbitration Clause</h3>
    <p style="margin-bottom: 0.5rem;">
      Any disputes arising out of or related to these Terms or the use of Ballpitt shall be resolved through binding arbitration under the rules of the American Arbitration Association.
    </p>
    <p style="margin-bottom: 0.75rem">
      The arbitration will take place in the United Arab Emirates, and the language of arbitration will be English. Both parties waive the right to a jury trial or to participate in a class action.
    </p>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">9. Modifications to Terms</h3>
    <p style="margin-bottom: 0.75rem">
      We reserve the right to modify these Terms at any time. Changes will be effective upon posting on the Platform. Continued use of the Platform after modifications constitutes acceptance of the updated Terms.
    </p>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">10. Contact Information</h3>
    <p style="margin-bottom: 0.75rem">For questions regarding these Terms, please contact us at [Insert Contact Information].</p>

    <h3 style="font-size: 1.1rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">11. Chat Data Storage and Consent</h3>
    <p style="margin-bottom: 0.5rem">
      By using the chat feature on Ballpitt, you acknowledge and consent to the following:
    </p>
    <ul style="list-style-type: disc; margin-left: 1.25rem; margin-bottom: 0.75rem;">
      <li>All chat conversations may be stored on our servers for quality assurance, support purposes, and compliance requirements.</li>
      <li>Chat transcripts may be used for improving our services, training AI models, and providing customer support.</li>
      <li>Your chat data may be shared with third-party service providers (such as CRM systems) as necessary for business operations.</li>
      <li>You have the right to request deletion of your chat data by contacting us.</li>
    </ul>
    <p style="margin-bottom: 1.5rem">
      By clicking "I accept the terms and agreements" below, you confirm that you have read, understood, and agree to be bound by all the terms and conditions outlined above, including the chat data storage and consent provisions.
    </p>
  `;

  // Check if user has scrolled to bottom
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const threshold = 10; // 10px threshold for rounding errors
    const isAtBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + threshold;

    setHasScrolledToBottom(isAtBottom);
  };

  // Check scroll position on mount and when content loads
  useEffect(() => {
    checkScrollPosition();
    // Check again after a short delay to ensure content is rendered
    const timeoutId = setTimeout(checkScrollPosition, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Handle scroll event
  const handleScroll = () => {
    checkScrollPosition();
  };

  // Handle accept button click
  const handleAccept = () => {
    if (hasScrolledToBottom) {
      localStorage.setItem("chat_consent", "true");
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Prevent ESC key from closing modal (compliance requirement)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      // Prevent closing on backdrop click (compliance requirement)
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Do nothing - prevent closing
        }
      }}
    >
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-[480px] mx-2 sm:mx-4 shadow-lg max-h-[85vh] flex flex-col">
        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 text-center">
          Terms and Conditions
        </h2>

        {/* Scrollable Terms Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pr-1 sm:pr-2 mb-3 sm:mb-4 border border-gray-200 rounded-lg p-3 sm:p-4 max-h-[50vh] sm:max-h-[55vh] custom-scrollbar"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e0 #f7fafc",
          }}
        >
          <div
            className="text-sm sm:text-base text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: termsContent }}
          />
        </div>

        {/* Accept Button */}
        <div className="flex justify-center mt-2 sm:mt-4">
          <button
            onClick={handleAccept}
            disabled={!hasScrolledToBottom}
            className={`
              w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium transition-all duration-300
              ${
                hasScrolledToBottom
                  ? "bg-Primary-500 text-white hover:opacity-90 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
              }
            `}
          >
            I accept the terms and agreements
          </button>
        </div>

        {/* Scroll indicator hint (optional) */}
        {!hasScrolledToBottom && (
          <p className="text-xs sm:text-sm text-gray-500 text-center mt-1 sm:mt-2">
            Please scroll to the end to accept
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        /* Custom scrollbar styling for webkit browsers */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
};

export default ConsentModal;
