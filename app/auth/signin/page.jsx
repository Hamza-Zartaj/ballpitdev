"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { firebaseSignIn } from "../../utils/firebase/firebaseAuth";
import { useNewNotification } from "@/app/contexts/NewNotificationProvider";
import { MdRestartAlt } from "react-icons/md";
import { AiOutlineHome } from "react-icons/ai";

const SIGNUP_STEPS = [
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

const SIGNIN_STEPS = [
  {
    id: 1,
    question: "What's your email address?",
    type: "email",
    placeholder: "e.g., your@email.com",
    field: "email",
  },
  {
    id: 2,
    question: "Enter your password",
    type: "password",
    placeholder: "Your password",
    field: "password",
  },
];

const FORGOT_PASSWORD_STEPS = [
  {
    id: 1,
    question: "What's your email address?",
    type: "email",
    placeholder: "e.g., your@email.com",
    field: "email",
  },
  {
    id: 2,
    question: "Verify your identity",
    type: "text",
    placeholder: "Verification code",
    field: "verificationCode",
  },
  {
    id: 3,
    question: "Create a new password",
    type: "password",
    placeholder: "Min 8 chars, 1 symbol, 1 capital letter",
    field: "newPassword",
  },
  {
    id: 4,
    question: "Confirm your new password",
    type: "password",
    placeholder: "Re-enter your password",
    field: "confirmPassword",
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

// Numeric field filtering
const isNumericField = (stepIndex, mode) => {
  if (mode === "forgotPassword") {
    // Step 2 (index 1) is verification code only
    return stepIndex === 1;
  }
  return false;
};

const filterNumericInput = (value, stepIndex, mode) => {
  if (mode === "forgotPassword") {
    if (stepIndex === 1) {
      // Verification code: allow only digits
      return value.replace(/[^\d]/g, '');
    }
  }
  return value;
};

export default function AuthPage() {
  const router = useRouter();
  const { showNotification } = useNewNotification();
  const [mode, setMode] = useState(null); // null | 'signup' | 'signin'
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/dashboard"); // Default callback URL
  const [formData, setFormData] = useState({
    businessName: "",
    businessUrl: "",
    qualificationCriteria: "",
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [messages, setMessages] = useState([
    { type: "bot", text: "Ready to supercharge your sales?", isHeading: true },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0); // Countdown timer for resend
  const [canResend, setCanResend] = useState(false); // Whether resend is available
  const [isSendingCode, setIsSendingCode] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Extract callbackUrl from query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callback = params.get("callbackUrl");
    if (callback) {
      setCallbackUrl(decodeURIComponent(callback));
    } else if (mode === "signup") {
      // Default to checkout for new users
      setCallbackUrl("/checkout");
    } else {
      // Default to dashboard for existing users
      setCallbackUrl("/dashboard");
    }
  }, [mode]);

  // Lock body scroll so the fixed frame never moves when keyboard opens on mobile
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
      document.documentElement.style.overflow = "";
    };
  }, []);

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Countdown timer for resend code button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && (
      (mode === "signup" && currentStep === 4) ||
      (mode === "forgotPassword" && currentStep === 1)
    )) {
      setCanResend(true);
    }
  }, [resendCountdown, mode, currentStep]);



  const handleModeSelection = async (selectedMode) => {
    setMode(selectedMode);
    
    const userResponse = selectedMode === "signup" 
      ? "I'm new, Let's Get Started" 
      : "I already have an account";
    
    setMessages((prev) => [...prev, { type: "user", text: userResponse }]);
    
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsTyping(false);

    const steps = selectedMode === "signup" ? SIGNUP_STEPS : SIGNIN_STEPS;
    setMessages((prev) => [...prev, { type: "bot", text: steps[0].question }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const steps = mode === "signup" ? SIGNUP_STEPS : mode === "signin" ? SIGNIN_STEPS : FORGOT_PASSWORD_STEPS;
    const currentField = steps[currentStep].field;
    const currentValue = formData[currentField];

    if (!currentValue.trim()) return;

    // Validation for signup mode
    if (mode === "signup") {
      // Email validation (step 4, index 3)
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

      // Verification code validation (step 5, index 4)
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
    }

    // Validation for forgot password mode
    if (mode === "forgotPassword") {
      // Email validation (step 0, index 0)
      if (currentStep === 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(currentValue)) {
          setEmailError('Please enter a valid email address');
          return;
        }
        setEmailError(null);
      }

      // Verification code validation (step 2, index 1)
      if (currentStep === 1) {
        if (!/^\d{4,}$/.test(currentValue)) {
          setCodeError('Verification code must contain only numbers (at least 4 digits)');
          return;
        }
        setCodeError(null);
      }

      // Password validation (step 3, index 2)
      if (currentStep === 2) {
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
    }

    // Add user message
    setMessages((prev) => [...prev, { type: "user", text: currentValue }]);
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsTyping(false);

    // Handle signup flow (can have special email/code handling)
    if (mode === "signup") {
      if (currentStep < steps.length - 1) {
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: steps[currentStep + 1].question },
        ]);
        setCurrentStep(currentStep + 1);
      } else {
        // Last step - sign up user
        await handleSignup();
      }
      return;
    }

    // Handle forgot password flow
    if (mode === "forgotPassword") {
      if (currentStep === 0) {
        // Email step - fetch phone and send verification code
        // handleForgotPasswordSubmit() will handle step transition
        await handleForgotPasswordSubmit();
      } else if (currentStep < steps.length - 1) {
        // Show next step
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: steps[currentStep + 1].question },
        ]);
        setCurrentStep(currentStep + 1);
      } else {
        // Last step - reset password
        await handleForgotPasswordComplete();
      }
      return;
    }

    // Move to next step or complete for signin and regular signup steps
    if (currentStep < steps.length - 1) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: steps[currentStep + 1].question },
      ]);
      setCurrentStep(currentStep + 1);
    } else {
      // Complete flow
      if (mode === "signup") {
        await handleSignup();
      } else {
        await handleSignin();
      }
    }
  };

  const handleSignup = async () => {
    setIsProcessing(true);
    setMessages((prev) => [
      ...prev,
      { type: "bot", text: "Perfect! Creating your account..." },
    ]);

    try {
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          businessUrl: formData.businessUrl,
          qualificationCriteria: formData.qualificationCriteria,
        }),
      });

      if (signupResponse.ok) {
        // Automatically sign in the user after successful signup
        await firebaseSignIn(formData.email, formData.password);

        setTimeout(() => {
          setIsProcessing(false);
          setMessages((prev) => [
            ...prev,
            { type: "bot", text: "Account created! Redirecting..." },
          ]);
          setTimeout(() => {
            showNotification("Welcome to Ballpitt!", "success");
            router.push(callbackUrl);
          }, 1500);
        }, 2000);
      } else {
        const error = await signupResponse.json();
        setIsProcessing(false);

        // Parse error and determine which field failed
        const errorMessage = error.message || error.fullError || "Something went wrong. Please try again.";
        const errorCode = error.code || "";
        
        let fieldError = null;
        let stepToGo = null;
        let fieldToClear = null;

        // Check both error code and message for reliability
        if (errorCode === "auth/email-already-in-use" || errorMessage.includes("email-already-in-use") || errorMessage.includes("already registered")) {
          fieldError = "This email is already registered. Please use a different email.";
          setEmailError(fieldError);
          stepToGo = 3; // Go back to email step (index 3)
          fieldToClear = "email";
        } else if (errorCode === "auth/invalid-email" || errorMessage.includes("invalid-email") || errorMessage.includes("valid email")) {
          fieldError = "Please enter a valid email address.";
          setEmailError(fieldError);
          stepToGo = 3; // Go back to email step
          fieldToClear = "email";
        } else if (errorCode === "auth/weak-password" || errorMessage.includes("weak-password") || errorMessage.includes("6 characters")) {
          fieldError = "Password must be at least 8 characters. Please create a stronger password.";
          setPasswordError(fieldError);
          stepToGo = 5; // Go back to password step (index 5)
          fieldToClear = "password";
        } else {
          fieldError = errorMessage;
        }

        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `⚠ ${fieldError}`,
          },
        ]);

        // If it's an email or password error, go back to that step
        if (stepToGo !== null) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              text: `Please try again with a different ${fieldToClear}.`,
            },
            { type: "bot", text: SIGNUP_STEPS[stepToGo].question },
          ]);

          // Clear the problematic field
          setFormData((prev) => ({ ...prev, [fieldToClear]: "" }));
          setCurrentStep(stepToGo);
        }
      }
    } catch (error) {
      setIsProcessing(false);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Sorry, there was an error. Please try again." },
      ]);
    }
  };

  const handleSignin = async () => {
    setIsProcessing(true);
    setMessages((prev) => [
      ...prev,
      { type: "bot", text: "Signing you in..." },
    ]);

    try {
      await firebaseSignIn(formData.email, formData.password);

      setTimeout(() => {
        setIsProcessing(false);
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: "Welcome back! Redirecting..." },
        ]);
        setTimeout(() => {
          showNotification("Welcome back to Ballpitt!", "success");
          router.push(callbackUrl);
        }, 1500);
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Invalid credentials. Please check your email and password." },
      ]);
      // Reset to email step
      setCurrentStep(0);
      setFormData((prev) => ({
        ...prev,
        email: "",
        password: "",
      }));
    }
  };

  const handleForgotPasswordClick = async () => {
    setMode("forgotPassword");
    const userResponse = "I forgot my password";
    setMessages((prev) => [...prev, { type: "user", text: userResponse }]);
    
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsTyping(false);

    setMessages((prev) => [...prev, { type: "bot", text: FORGOT_PASSWORD_STEPS[0].question }]);
    setCurrentStep(0);
  };

  const handleForgotPasswordSubmit = async () => {
    setIsProcessing(true);
    setEmailError(null);
    setMessages((prev) => [
      ...prev,
      { type: "bot", text: "Searching user..." },
    ]);

    try {
      // Send verification code directly to email
      const sendCodeResponse = await fetch("/api/auth/send-password-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      if (!sendCodeResponse.ok) {
        const error = await sendCodeResponse.json();
        setIsProcessing(false);
        setEmailError(error.error || "Account not found");
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `Error: ${error.error || "Account not found. Please check your email."}`,
          },
        ]);
        return;
      }

      setTimeout(() => {
        setIsProcessing(false);
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: `✓ Verification code sent to ${formData.email}` },
        ]);
        // Move to verification code step
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { type: "bot", text: `${FORGOT_PASSWORD_STEPS[1].question}\n(Code sent to ${formData.email})` },
          ]);
          setCurrentStep(1);
          setResendCountdown(60); // Start 60 second countdown
          setCanResend(false);
        }, 500);
      }, 1500);
    } catch (error) {
      setIsProcessing(false);
      setEmailError(error.message);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error looking up account. Please try again." },
      ]);
    }
  };

  const handleResendCode = async () => {
    setIsProcessing(true);
    setMessages((prev) => [
      ...prev,
      { type: "bot", text: "Resending verification code..." },
    ]);

    try {
      const response = await fetch("/api/auth/send-password-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      if (response.ok) {
        setTimeout(() => {
          setIsProcessing(false);
          setMessages((prev) => [
            ...prev,
            { type: "bot", text: `✓ Code resent to ${formData.email}` },
          ]);
          setResendCountdown(60); // Restart the 60 second countdown
          setCanResend(false);
        }, 1500);
      } else {
        const error = await response.json();
        setIsProcessing(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `Error: ${error.error || "Could not resend code. Try again."}`,
          },
        ]);
      }
    } catch (error) {
      setIsProcessing(false);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error resending code. Please try again." },
      ]);
    }
  };

  const handleSendSignupVerificationCode = async () => {
    setIsSendingCode(true);
    setEmailError(null);
    
    setMessages((prev) => [
      ...prev,
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
            { type: "bot", text: `${SIGNUP_STEPS[4].question}\n(Code sent to ${formData.email})` },
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
            { type: "bot", text: SIGNUP_STEPS[5].question },
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

  const handleResendSignupCode = async () => {
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

  const handleForgotPasswordComplete = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Passwords don't match. Please try again." },
      ]);
      return;
    }

    setIsProcessing(true);
    setMessages((prev) => [
      ...prev,
      { type: "bot", text: "Resetting your password..." },
    ]);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          verificationCode: formData.verificationCode,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        setTimeout(() => {
          setIsProcessing(false);
          setMessages((prev) => [
            ...prev,
            { type: "bot", text: "Password reset successfully! Redirecting to sign in..." },
          ]);
          setTimeout(() => {
            showNotification("Password reset successfully!", "success");
            handleRestart();
            setMode("signin");
            setCurrentStep(0);
            setFormData((prev) => ({
              ...prev,
              email: "",
              password: "",
              verificationCode: "",
              newPassword: "",
              confirmPassword: "",
            }));
          }, 2000);
        }, 1500);
      } else {
        const error = await response.json();
        setIsProcessing(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: `Error: ${error.message || "Could not reset password."}`,
          },
        ]);
      }
    } catch (error) {
      setIsProcessing(false);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error resetting password. Please try again." },
      ]);
    }
  };

  const handleInputChange = (value) => {
    const steps = mode === "signup" ? SIGNUP_STEPS : mode === "signin" ? SIGNIN_STEPS : FORGOT_PASSWORD_STEPS;
    const currentField = steps[currentStep].field;
    
    // Apply numeric filtering for verification code field (password reset)
    let filteredValue = value;
    if (mode === "forgotPassword" && isNumericField(currentStep, "forgotPassword")) {
      filteredValue = filterNumericInput(value, currentStep, "forgotPassword");
    }
    
    setFormData((prev) => ({ ...prev, [currentField]: filteredValue }));
  };

  const handleRestart = () => {
    setMode(null);
    setCurrentStep(0);
    setFormData({
      businessName: "",
      businessUrl: "",
      qualificationCriteria: "",
      email: "",
      password: "",
      newPassword: "",
      confirmPassword: "",
    });
    setMessages([
      { type: "bot", text: "Ready to supercharge your sales?", isHeading: true },
    ]);
    setCodeError(null);
    setEmailError(null);
    setPasswordError(null);
    setResendCountdown(0);
    setCanResend(false);
  };

  const steps = mode === "signup" ? SIGNUP_STEPS : mode === "signin" ? SIGNIN_STEPS : mode === "forgotPassword" ? FORGOT_PASSWORD_STEPS : [];
  const currentStepData = steps[currentStep];
  const currentValue = currentStepData ? (formData[currentStepData.field] || "") : "";

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 fixed inset-0 flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="w-full max-w-[350px] md:max-w-[400px] flex flex-col">
        {/* Phone frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 rounded-[3rem] p-4 shadow-2xl border-[6px] border-gray-800 relative flex flex-col"
        >
          {/* Side Buttons */}
          <div className="absolute top-24 -left-[9px] w-[3px] h-10 bg-gray-700 rounded-l-md"></div>
          <div className="absolute top-40 -left-[9px] w-[3px] h-16 bg-gray-700 rounded-l-md"></div>
          <div className="absolute top-32 -right-[9px] w-[3px] h-20 bg-gray-700 rounded-r-md"></div>

          <div className="bg-white rounded-[2.2rem] overflow-hidden relative flex flex-col">
            {/* Processing Overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full border-t-2 border-r-2 border-purple-500 mb-4"
                  />
                  <motion.h3 className="text-white font-bold text-xl mb-2">
                    {isSendingCode && mode === "signup" ? "Sending verification code..." : isSendingCode ? "Sending verification code..." : mode === "signup" ? "Creating Account..." : mode === "forgotPassword" ? "Searching user..." : "Signing In..."}
                  </motion.h3>
                  <motion.div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-300"
                    />
                  </motion.div>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestart}
                  className="text-gray-600 hover:text-purple-600 transition-colors p-2"
                  title="Restart signin/signup process"
                >
                  <MdRestartAlt size={24} />
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="text-gray-600 hover:text-purple-600 transition-colors p-2"
                  title="Back to Home"
                >
                  <AiOutlineHome size={24} />
                </button>
              </div>
            </div>

            {/* Chat container */}
            <div
              ref={chatContainerRef}
              className="h-[300px] md:h-[400px] overflow-y-auto p-4 space-y-4 bg-[#FAF9F6] scroll-smooth"
            >
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
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

              {/* Mode selection buttons */}
              {mode === null && !isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3 mt-4"
                >
                  <button
                    onClick={() => handleModeSelection("signup")}
                    className="bg-purple-600 text-white rounded-2xl px-5 py-3 text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    ✨ I'm new, Let's Get Started
                  </button>
                  <button
                    onClick={() => handleModeSelection("signin")}
                    className="bg-white text-gray-800 rounded-2xl px-5 py-3 text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
                  >
                    🔐 I already have an account
                  </button>
                </motion.div>
              )}

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
            {mode !== null && (
              <form onSubmit={handleSubmit} className="bg-white border-t border-gray-100 p-3">
                <div className="flex flex-col gap-2">
                  {/* Error message for email in forgot password */}
                  {emailError && mode === "forgotPassword" && currentStep === 0 && (
                    <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                      {emailError}
                    </div>
                  )}
                  
                  {/* Resend code button for signup verification */}
                  {(mode === "signup" && currentStep === 4) && (
                    <div className="px-4 py-2 text-center">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendSignupCode}
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

                  {/* Error message for verification code in signup */}
                  {codeError && mode === "signup" && currentStep === 4 && (
                    <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                      {codeError}
                    </div>
                  )}
                  
                  {/* Error message for verification code in forgot password */}
                  {codeError && mode === "forgotPassword" && currentStep === 1 && (
                    <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                      {codeError}
                    </div>
                  )}

                  {/* Helper text for verification code in forgot password */}
                  {mode === "forgotPassword" && currentStep === 1 && (
                    <div className="px-4 py-1 text-xs text-gray-500">
                      Numbers only: Enter the verification code
                    </div>
                  )}

                  {/* Resend code button for forgot password only */}
                  {(mode === "forgotPassword" && currentStep === 1) && (
                    <div className="px-4 py-2 text-center">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={isProcessing}
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

                  {/* Error message for email in signup */}
                  {emailError && mode === "signup" && currentStep === 3 && (
                    <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                      {emailError}
                    </div>
                  )}

                  {/* Error message for password */}
                  {passwordError && ((mode === "signup" && currentStep === 5) || (mode === "forgotPassword" && currentStep === 2)) && (
                    <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                      {passwordError}
                    </div>
                  )}

                  {/* Password requirements checklist for signup */}
                  {mode === "signup" && currentStep === 5 && currentValue && (
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

                  {/* Password requirements checklist for forgot password */}
                  {mode === "forgotPassword" && currentStep === 2 && currentValue && (
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
                    {currentStepData?.type === "textarea" ? (
                      <textarea
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onTouchStart={handleInputFocus}
                        value={currentValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={currentStepData.placeholder}
                        disabled={isSendingCode}
                        rows={1}
                        className="flex-1 bg-gray-50 border-0 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 resize-none min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ height: "44px" }}
                      />
                    ) : (
                      <input
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onTouchStart={handleInputFocus}
                        type={currentStepData?.type || "text"}
                        value={currentValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={currentStepData?.placeholder}
                        disabled={isSendingCode}
                        className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="submit"
                      disabled={
                        !currentValue.trim() ||
                        isSendingCode ||
                        isProcessing ||
                        (mode === "signup" && currentStep === 5 && !isPasswordValid(currentValue)) ||
                        (mode === "forgotPassword" && currentStep === 2 && !isPasswordValid(currentValue))
                      }
                      className="bg-purple-600 text-white rounded-full p-3 hover:bg-purple-700 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-purple-200"
                    >
                      {isSendingCode || isProcessing ? (
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
                
                {/* Forgot password link for signin mode at email step */}
                {mode === "signin" && currentStep === 0 && (
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </motion.div>

        {/* Progress indicator */}
        {mode !== null && steps.length > 0 && !isFocused && (
          <div className="mt-2 flex justify-center space-x-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${
                  index <= currentStep ? "bg-purple-600 w-12" : "bg-gray-200 w-4"
                }`}
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}