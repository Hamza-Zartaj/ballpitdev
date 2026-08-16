import * as React from "react";

function PrivacyContent() {
  return (
    <div className="flex overflow-scroll z-0 flex-col flex-1 px-6 pt-[2vh] w-full h-full ">
      <div className="flex flex-col w-full">
        <div className="mt-2 mb-10 text-base tracking-tight leading-7 text-gray-900">
          
         {/* Terms and Conditions Section */}
         <h2 className="text-2xl font-semibold">Terms and Conditions for Ballpitt</h2>
          <p className="mt-1">Effective Date: 1 January 2025</p>
          <p className="mt-4">
            Welcome to Ballpitt. These Terms and Conditions ("Terms") govern your access to and use of Ballpitt ("the Platform," "we," "us," "our"). By accessing or using Ballpitt, you agree to comply with these Terms. If you do not agree, please refrain from using the Platform.
          </p>

          <h3 className="text-xl font-semibold mt-6">1. Eligibility</h3>
          <p className="mt-2">
            You must be at least 13 years old to use Ballpitt. If you are under 18, you must obtain parental or legal guardian consent before using the Platform.
          </p>
          <p className="mt-2">By using the Platform, you represent and warrant that you meet these requirements.</p>

          <h3 className="text-xl font-semibold mt-6">2. Account Registration</h3>
          <p className="mt-2">
            You are required to register an account to access certain features. Registration requires providing accurate personal information, including a valid email address and phone number for verification purposes.
          </p>
          <p className="mt-2">You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

          <h3 className="text-xl font-semibold mt-6">3. Use of the Platform</h3>
          <p className="mt-2">
            Ballpitt is designed for gathering user psychology insights to optimize sales and influence. The creators maintain full control over the AI system and influence its outputs. The AI responses are generated based on algorithms and data inputs managed by our team.
          </p>
          <p className="mt-2">
            You agree not to misuse the Platform, including but not limited to engaging in fraudulent activities, identity theft, or violating any applicable laws.
          </p>

          <h3 className="text-xl font-semibold mt-6">4. User Conduct</h3>
          <p className="mt-2">You agree to use Ballpitt in a lawful, respectful, and responsible manner.</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Uploading harmful, illegal, or offensive content.</li>
            <li>Attempting unauthorized access to the Platform’s systems.</li>
            <li>Engaging in fraudulent activities or identity theft.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">5. Data Privacy and Security</h3>
          <p className="mt-2">
            We collect personal data to improve user experience, provide services, and for research purposes.
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>
              <strong>Data Sharing:</strong> We may sell or share aggregated, anonymized data with third parties for research, marketing, and business purposes.
            </li>
            <li>
              <strong>Parental Consent:</strong> Users under 18 must obtain parental consent. We do not knowingly collect personal information from minors without such consent.
            </li>
            <li>
              <strong>Verification:</strong> To prevent fraud and identity theft, we require email and phone number verification.
            </li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">6. Intellectual Property</h3>
          <p className="mt-2">
            All content on Ballpitt, including software, text, graphics, and logos, is the property of Ballpitt or its licensors.
          </p>
          <p className="mt-2">
            Users retain rights to their content but grant Ballpitt a non-exclusive, royalty-free license to use, display, and distribute such content within the Platform.
          </p>

          <h3 className="text-xl font-semibold mt-6">7. Disclaimers and Limitation of Liability</h3>
          <p className="mt-2">
            The Platform is provided "as is" without warranties of any kind, either express or implied. Ballpitt is not responsible for any damages arising from your use of the Platform.
          </p>

          <h3 className="text-xl font-semibold mt-6">8. Arbitration Clause</h3>
          <p className="mt-2">
            Any disputes arising out of or related to these Terms or the use of Ballpitt shall be resolved through binding arbitration under the rules of the American Arbitration Association.
          </p>
          <p className="mt-2">
            The arbitration will take place in the United Arab Emirates, and the language of arbitration will be English. Both parties waive the right to a jury trial or to participate in a class action.
          </p>

          <h3 className="text-xl font-semibold mt-6">9. Modifications to Terms</h3>
          <p className="mt-2">
            We reserve the right to modify these Terms at any time. Changes will be effective upon posting on the Platform. Continued use of the Platform after modifications constitutes acceptance of the updated Terms.
          </p>

          <h3 className="text-xl font-semibold mt-6">10. Contact Information</h3>
          <p className="mt-2">For questions regarding these Terms, please contact us at [Insert Contact Information].</p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyContent;