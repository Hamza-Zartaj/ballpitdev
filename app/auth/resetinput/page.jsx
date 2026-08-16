"use client";

import { useState } from "react";
import { z } from "zod"; // Import Zod
import { useRouter } from "next/navigation";
import StyleSolidTypeRounded from "../../components/StyleSolidTypeRounded";
import { auth } from "@/app/config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNewNotification } from "@/app/contexts/NewNotificationProvider";

function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const { showNotification } = useNewNotification();

  const Next = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      showNotification(
        "Password reset link was sent to your email. Check your inbox please.",
        "info"
      );
    } catch (e) {
      
    } finally {
      router.push("/auth/signin");
    }
  };

  // Define Zod schema for email validation
  const emailSchema = z.string().email("Invalid email address");

  // Handle email validation dynamically
  const validateEmail = (value) => {
    try {
      emailSchema.parse(value); // Validate the email using Zod
      setEmailError(""); // Clear any error if valid
    } catch (error) {
      setEmailError(error.errors[0].message); // Set the error message
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value); // Update email state
    validateEmail(value); // Validate the email as the user types
  };

  return (
    <div className="relative flex-grow flex flex-col animate-slide-in-right p-4 pb-6">
      <div className="px-5 flex flex-col flex-grow mt-[35%]">
        <h1 className="text-[41px] font-semibold mb-3 text-gray-900">
          Forgot Password
        </h1>
        <p className="text-2xl text-gray-500 mb-8 mt-0">
          Enter your email address to reset password
        </p>

        <div className="space-y-10">
          <div>
            {/* Email Input */}
            <label className="block font-semibold text-xl text-black mb-2">
              Email:
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange} // Validate email dynamically as user types
              className={`pl-6 pr-6 w-full py-[17px] px-[17px] border-2 ${
                emailError && email.length !== 0
                  ? "border-red-500"
                  : "border-[#E5E5E5]"
              } rounded-[29px] text-base text-left focus:border-[#7C5CFC] focus:outline-none`}
            />

            {/* Email Validation Error */}
            {emailError && email.length !== 0 && (
              <div className="flex items-center gap-2 pl-2 mt-2">
                <StyleSolidTypeRounded className="w-5 h-5" color="#EF4949" />
                <div className="text-red-500">{emailError}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-grow items-end">
          <button
            className="w-full bg-Primary-500 text-white py-4 rounded-full text-base font-medium cursor-pointer transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={emailError || email.length === 0}
            onClick={Next}
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
