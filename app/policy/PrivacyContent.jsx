import * as React from "react";

function PrivacyContent() {
  return (
    <div className="flex overflow-scroll z-0 flex-col flex-1 px-6 pt-[2vh] w-full h-full ">
      <div className="flex flex-col w-full">
        <div className="mt-2 mb-10 text-base tracking-tight leading-7 text-gray-900">
          
          {/* Privacy Policy Section */}
          <h2 className="text-2xl font-semibold">Privacy Policy for Ballpitt</h2>
          <p className="mt-1">Effective Date: 1 January 2025</p>
          <p className="mt-4">
            Ballpitt ("we," "us," "our") values your privacy. This Privacy Policy explains how we collect, use, and protect your personal information.
          </p>

          <h3 className="text-xl font-semibold mt-6">1. Information We Collect</h3>
          <ul className="list-disc ml-6 mt-2">
            <li>
              <strong>Personal Information:</strong> Name, email, phone number, demographic data, and other identifying details.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact with the Platform, including device information and cookies.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">2. How We Use Your Information</h3>
          <ul className="list-disc ml-6 mt-2">
            <li>To provide and improve our services.</li>
            <li>For research, analytics, and marketing purposes.</li>
            <li>To ensure security and prevent fraud or identity theft.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">3. Data Sharing and Selling</h3>
          <p className="mt-2">
            We may sell or share aggregated, anonymized data with third parties. Personal data may be shared with service providers for operational purposes.
          </p>

          <h3 className="text-xl font-semibold mt-6">4. Children’s Privacy</h3>
          <p className="mt-2">
            Users under 18 must obtain parental consent before using the Platform. We do not knowingly collect personal data from minors without such consent.
          </p>

          <h3 className="text-xl font-semibold mt-6">5. Data Security</h3>
          <p className="mt-2">
            We implement security measures to protect your data, including email and phone verification to prevent fraud and identity theft.
          </p>

          <h3 className="text-xl font-semibold mt-6">6. Your Rights</h3>
          <p className="mt-2">You have the right to access, correct, or delete your personal data.</p>

          <h3 className="text-xl font-semibold mt-6">7. Changes to This Policy</h3>
          <p className="mt-2">
            We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyContent;