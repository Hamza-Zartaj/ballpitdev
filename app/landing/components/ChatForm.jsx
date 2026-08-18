"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MdRestartAlt } from "react-icons/md";

const portfolioMode =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_PORTFOLIO_MODE === "true";

const STEPS = [
  {
    id: 1,
    question: "First, what's the name of your business?",
    type: "text",
    placeholder: "e.g., Acme Real Estate",
    field: "businessName",
  },
  {
    id: 2,
    question: "Give your agent a brain. Where should it learn about your business?",
    type: "text",
    placeholder: "Website or Instagram URL",
    field: "businessUrl",
  },
  {
    id: 3,
    question: "Set your pre-qualification logic. Which 3 details must the agent collect before texting you the lead?",
    type: "textarea",
    placeholder: "e.g., Budget, Timeline, Current Challenges",
    field: "qualificationCriteria",
  },
  {
    id: 4,
    question: "What's your email address?",
    type: "email",
    placeholder: "e.g., your@email.com",
    field: "email",
  },
  {
    id: 5,
    question: "Verify your email address",
    type: "text",
    placeholder: "Enter verification code",
    field: "verificationCode",
  },
  {
    id: 6,
    question: "Create a password",
    type: "password",
    placeholder: "Min 8 chars, 1 symbol, 1 capital letter",
    field: "password",
  },
];

// Password validation function
const validatePassword = (password) => {
  return {
    minLength: password.length >= 8,
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    hasCapital: /[A-Z]/.test(password),
  };
};

const isPasswordValid = (password) => {
  const validation = validatePassword(password);
  return validation.minLength && validation.hasSymbol && validation.hasCapital;
};



export default function ChatForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [emailError, setEmailError] = useState(null);
  const [codeError, setCodeError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [signupError, setSignupError] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessUrl: "",
    qualificationCriteria: "",
    email: "",
    verificationCode: "",
    password: "",
  });
  const [messages, setMessages] = useState([
    { type: "bot", text: "Build your AI chat link in 5 minutes", isHeading: true },
    { type: "bot", text: STEPS[0].question },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const phoneFrameRef = useRef(null);

  // Lock body scroll when input is focused so keyboard can't push the frame
  useEffect(() => {
    if (isFocused) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.dataset.scrollY = scrollY;
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isFocused]);

  // Countdown timer for resend code button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && currentStep === 4) {
      setCanResend(true);
    }
  }, [resendCountdown, currentStep]);

  const handleInputFocus = () => {
    setIsFocused(true);
    // Scroll frame into view so it's fully visible before keyboard opens
    if (phoneFrameRef.current) {
      phoneFrameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentField = STEPS[currentStep].field;
    const currentValue = formData[currentField];

    if (!currentValue.trim()) return;

    // Email validation (step 3, index 3)
    if (currentStep === 3) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(currentValue)) {
        setEmailError('Please enter a valid email address');
        return;
      }
      setEmailError(null);
      
      // Send verification code instead of moving to next step
      await handleSendSignupVerificationCode();
      return;
    }

    // Verification code validation (step 4, index 4)
    if (currentStep === 4) {
      if (!/^\d{4,}$/.test(currentValue)) {
        setCodeError('Verification code must contain only numbers (at least 4 digits)');
        return;
      }
      setCodeError(null);
      
      // Verify the code
      await handleVerifySignupCode();
      return;
    }

    // Password validation (step 6, index 5)
    if (currentStep === 5) {
      if (!isPasswordValid(currentValue)) {
        const validation = validatePassword(currentValue);
        let errors = [];
        if (!validation.minLength) errors.push("at least 8 characters");
        if (!validation.hasSymbol) errors.push("at least 1 symbol");
        if (!validation.hasCapital) errors.push("at least 1 capital letter");
        
        setPasswordError(`Password must have ${errors.join(", ")}`);
        return;
      }
      setPasswordError(null);
    }

    // Add user message
    setMessages((prev) => [...prev, { type: "user", text: currentValue }]);
    
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsTyping(false);

    // Move to next step
    if (currentStep < STEPS.length - 1) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: STEPS[currentStep + 1].question },
      ]);
      setCurrentStep(currentStep + 1);
    } else {
      // Form complete - Sign up the user
      await handleSignup();
    }
  };

  const handleSendSignupVerificationCode = async () => {
    setIsSendingCode(true);
    setEmailError(null);
    
    setMessages((prev) => [
      ...prev,
      { type: "user", text: formData.email },
      { type: "bot", text: "Sending verification code..." },
    ]);

    try {
      const response = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        const error = await response.json();
        setIsSendingCode(false);
        setEmailError(error.error || "Failed to send verification code");
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `Error: ${error.error || "Failed to send code. Please try again."}`,
          },
        ]);
        return;
      }

      setTimeout(() => {
        setIsSendingCode(false);
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: `✓ Verification code sent to ${formData.email}` },
        ]);
        
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { type: "bot", text: `${STEPS[4].question}\n(Code sent to ${formData.email})` },
          ]);
          setCurrentStep(4);
          setResendCountdown(60);
          setCanResend(false);
        }, 500);
      }, 1500);
    } catch (error) {
      setIsSendingCode(false);
      setEmailError(error.message);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error sending code. Please try again." },
      ]);
    }
  };

  const handleVerifySignupCode = async () => {
    setIsSendingCode(true);
    setCodeError(null);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setIsSendingCode(false);
        setCodeError(error.error || "Invalid verification code");
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `Error: ${error.error || "Invalid verification code. Please try again."}`,
          },
        ]);
        return;
      }

      setTimeout(() => {
        setIsSendingCode(false);
        setMessages((prev) => [
          ...prev,
          { type: "user", text: formData.verificationCode },
          { type: "bot", text: "✓ Email verified successfully!" },
        ]);
        
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { type: "bot", text: STEPS[5].question },
          ]);
          setCurrentStep(5);
        }, 500);
      }, 1000);
    } catch (error) {
      setIsSendingCode(false);
      setCodeError(error.message);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error verifying code. Please try again." },
      ]);
    }
  };

  const handleResendCode = async () => {
    setIsSendingCode(true);
    setMessages((prev) => [
      ...prev,
      { type: "bot", text: "Resending verification code..." },
    ]);

    try {
      const response = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setTimeout(() => {
          setIsSendingCode(false);
          setMessages((prev) => [
            ...prev,
            { type: "bot", text: `✓ Code resent to ${formData.email}` },
          ]);
          setResendCountdown(60);
          setCanResend(false);
        }, 1500);
      } else {
        const error = await response.json();
        setIsSendingCode(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `Error: ${error.error || "Could not resend code. Try again."}`,
          },
        ]);
      }
    } catch (error) {
      setIsSendingCode(false);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error resending code. Please try again." },
      ]);
    }
  };

  const handleSignup = async () => {
    setIsSigningUp(true);
    setSignupError(null);
    setEmailError(null);
    setPasswordError(null);
    
    setMessages((prev) => [
      ...prev,
      {
        type: "bot",
        text: "Perfect! Creating your account...",
      },
    ]);

    if (portfolioMode) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Demo account ready. Welcome to your dashboard!" },
      ]);
      setIsSigningUp(false);
      setTimeout(() => router.push("/dashboard"), 800);
      return;
    }
    
    try {
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          businessUrl: formData.businessUrl,
          qualificationCriteria: formData.qualificationCriteria,
        }),
      });

      if (signupResponse.ok) {
        const { firebaseSignIn } = await import("@/app/utils/firebase/firebaseAuth");
        await firebaseSignIn(formData.email, formData.password);

        setIsSigningUp(false);
        setTimeout(() => {
          router.push("/checkout");
        }, 3000);
      } else {
        const error = await signupResponse.json();
        setIsSigningUp(false);

        const errorMessage = error.message || error.fullError || "Something went wrong. Please try again.";
        const errorCode = error.code || "";
        
        let fieldError = null;
        let stepToGo = null;
        let fieldToClear = null;

        if (errorCode === "auth/email-already-in-use" || errorMessage.includes("email-already-in-use") || errorMessage.includes("already registered")) {
          fieldError = "This email is already registered. Please use a different email.";
          setEmailError(fieldError);
          stepToGo = 3;
          fieldToClear = "email";
        } else if (errorCode === "auth/invalid-email" || errorMessage.includes("invalid-email") || errorMessage.includes("valid email")) {
          fieldError = "Please enter a valid email address.";
          setEmailError(fieldError);
          stepToGo = 3;
          fieldToClear = "email";
        } else if (errorCode === "auth/weak-password" || errorMessage.includes("weak-password") || errorMessage.includes("6 characters")) {
          fieldError = "Password must be at least 8 characters. Please create a stronger password.";
          setPasswordError(fieldError);
          stepToGo = 5;
          fieldToClear = "password";
        } else {
          fieldError = errorMessage;
          setSignupError(fieldError);
        }

        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `⚠ ${fieldError}`,
          },
        ]);

        if (stepToGo !== null) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              text: `Please try again with a different ${fieldToClear}.`,
            },
            { type: "bot", text: STEPS[stepToGo].question },
          ]);

          setFormData((prev) => ({ ...prev, [fieldToClear]: "" }));
          setCurrentStep(stepToGo);
        }
      }
    } catch (error) {
      setIsSigningUp(false);
      const errorMsg = error.message || "Network error. Please try again.";
      setSignupError(errorMsg);
      
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: `⚠ ${errorMsg}`,
        },
        {
          type: "bot",
          text: "Please check your connection and try again.",
        },
      ]);
    }
  };

  const handleInputChange = (value) => {
    const currentField = STEPS[currentStep].field;
    setFormData((prev) => ({ ...prev, [currentField]: value }));
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setFormData({
      businessName: "",
      businessUrl: "",
      qualificationCriteria: "",
      email: "",
      verificationCode: "",
      password: "",
    });
    setMessages([
      { type: "bot", text: "Build your AI chat link in 5 minutes", isHeading: true },
      { type: "bot", text: STEPS[0].question },
    ]);
    setEmailError(null);
    setCodeError(null);
    setPasswordError(null);
    setSignupError(null);
    setResendCountdown(0);
    setCanResend(false);
  };

  const currentStepData = STEPS[currentStep];
  const currentValue = formData[currentStepData.field];

  return (
    <section id="chat-form" className="w-full py-5 sm:py-5 md:py-5 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-beige-200 rounded-full blur-3xl opacity-50 -z-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Phone-style container */}
        <motion.div 
            initial={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto max-w-[360px] md:max-w-[400px]"
        >
          {/* Phone frame */}
          <div ref={phoneFrameRef} className="bg-gray-900 mt-32 rounded-[3rem] p-4 shadow-2xl border-[6px] border-gray-800 relative z-10">
            {/* Side Buttons */}
            <div className="absolute top-24 -left-[9px] w-[3px] h-10 bg-gray-700 rounded-l-md"></div>
            <div className="absolute top-40 -left-[9px] w-[3px] h-16 bg-gray-700 rounded-l-md"></div>
            <div className="absolute top-32 -right-[9px] w-[3px] h-20 bg-gray-700 rounded-r-md"></div>

            <div className="bg-white rounded-[2.2rem] overflow-hidden relative">
                
              {/* Computing/Transition Overlay */}
              <AnimatePresence>
                {isSigningUp && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 rounded-full border-t-2 border-r-2 border-purple-500 mb-4"
                        />
                        <motion.h3 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-white font-bold text-xl mb-2"
                        >
                            Creating Account...
                        </motion.h3>
                        <motion.div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-300"
                            />
                        </motion.div>
                        <p className="text-gray-400 text-sm mt-4">Setting up your AI sales agent...</p>
                    </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="bg-white pt-10 pb-4 px-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">Ballpitt Agent</h3>
                        <p className="text-xs text-green-500 font-medium">● Online</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRestart}
                    className="text-gray-600 hover:text-purple-600 transition-colors p-2"
                    title="Restart the form"
                  >
                    <MdRestartAlt size={24} />
                  </button>
              </div>

              {/* Chat container */}
              <div ref={chatContainerRef} className="h-[320px] overflow-y-auto p-4 space-y-4 bg-[#FAF9F6] scroll-smooth">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                      }}
                      className={`flex ${
                        message.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                          message.type === "user"
                            ? "bg-purple-600 text-white rounded-br-none"
                            : message.isHeading
                            ? "bg-purple-100 text-purple-900 font-semibold text-center w-full"
                            : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                        }`}
                      >
                        {message.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                      <div className="flex space-x-1.5 h-4 items-center">
                        <motion.div 
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                        <motion.div 
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div 
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <form
                onSubmit={handleSubmit}
                className="bg-white border-t border-gray-100 p-3"
              >
                <div className="flex flex-col gap-2">
                  {/* Error message for email */}
                  {emailError && currentStep === 3 && (
                    <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                      {emailError}
                    </div>
                  )}

                  {/* Error message for verification code */}
                  {codeError && currentStep === 4 && (
                    <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                      {codeError}
                    </div>
                  )}

                  {/* Helper text and resend button for verification code */}
                  {currentStep === 4 && (
                    <div className="px-4 py-2 text-center">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={isSendingCode}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors disabled:opacity-50"
                        >
                          Resend code
                        </button>
                      ) : resendCountdown > 0 ? (
                        <p className="text-xs text-gray-500">
                          Resend code in {resendCountdown}s
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Error message for password */}
                  {passwordError && currentStep === 5 && (
                    <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                      {passwordError}
                    </div>
                  )}

                  {/* Password requirements checklist */}
                  {currentStep === 5 && currentValue && (
                    <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-2">
                      <p className="font-semibold text-blue-900 mb-2">Password Requirements:</p>
                      <div className="space-y-1.5">
                        <div className={`flex items-center gap-2 ${validatePassword(currentValue).minLength ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${validatePassword(currentValue).minLength ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                            {validatePassword(currentValue).minLength ? '✓' : '○'}
                          </span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${validatePassword(currentValue).hasSymbol ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${validatePassword(currentValue).hasSymbol ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                            {validatePassword(currentValue).hasSymbol ? '✓' : '○'}
                          </span>
                          <span>At least 1 symbol (!@#$%^&*...)</span>
                        </div>
                        <div className={`flex items-center gap-2 ${validatePassword(currentValue).hasCapital ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${validatePassword(currentValue).hasCapital ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                            {validatePassword(currentValue).hasCapital ? '✓' : '○'}
                          </span>
                          <span>At least 1 capital letter (A-Z)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    {currentStepData.type === "textarea" ? (
                      <textarea
                        value={currentValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder={currentStepData.placeholder}
                        rows={1}
                        className="flex-1 bg-gray-50 border-0 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 resize-none min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ height: '44px' }}
                      />
                    ) : (
                      <input
                        type={currentStepData.type}
                        value={currentValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder={currentStepData.placeholder}
                        className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="submit"
                      disabled={
                        !currentValue.trim() ||
                        isSendingCode ||
                        isSigningUp ||
                        (currentStep === 5 && !isPasswordValid(currentValue))
                      }
                      className="bg-purple-600 text-white rounded-full p-3 hover:bg-purple-700 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-purple-200"
                    >
                      {isSendingCode || isSigningUp ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 translate-x-0.5 -translate-y-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      )}
                    </motion.button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Progress indicator */}
        <div className="mt-12 flex justify-center space-x-3">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${
                  index <= currentStep
                    ? "bg-purple-600 w-12"
                    : "bg-gray-200 w-4"
                }`}
              ></div>
            ))}
        </div>
      </div>


    </section>
  );
}
