import { useState, useEffect } from "react";
import { Link } from "@heroui/link";
import { useRouter } from "next/router";

import AuthLayout from "@/layouts/auth-layout";
import FormInput from "@/components/auth/form-input";
import SubmitButton from "@/components/auth/submit-button";
import SuccessMessage from "@/components/auth/success-message";
import ErrorMessage from "@/components/auth/error-message";
import { isStrongPassword, updatePassword } from "@/utils/auth";
import { supabase } from "@/config/supabase";

type FormData = {
  password: string;
  confirmPassword: string;
};

type FormErrors = {
  password?: string;
  confirmPassword?: string;
};

const UpdatePassword = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      setCheckingSession(true);
      try {
        console.log("Checking for session...");
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check error:", error);
          setHasSession(false);
          setErrorMessage(
            "Invalid or expired password reset link. Please try again.",
          );
          setSubmitStatus("error");
        } else if (!data.session) {
          console.warn("No session found for password reset");
          setHasSession(false);
          setErrorMessage(
            "Invalid or expired password reset link. Please try again.",
          );
          setSubmitStatus("error");
        } else {
          console.log("Valid session found for password reset");
          setHasSession(true);
        }
      } catch (error) {
        console.error("Error during session check:", error);
        setHasSession(false);
        setErrorMessage("Failed to verify your session. Please try again.");
        setSubmitStatus("error");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    // Log state changes for debugging
    console.log("Form state changed:", {
      isSubmitting,
      submitStatus,
      hasSession,
      isRedirecting,
    });
  }, [isSubmitting, submitStatus, hasSession, isRedirecting]);

  // Handle redirect after successful password update
  useEffect(() => {
    if (submitStatus === "success" && !isRedirecting) {
      console.log("Success state detected, preparing redirect");
      setIsRedirecting(true);

      // Redirect to login page after a short delay
      const redirectTimer = setTimeout(() => {
        console.log("Executing redirect to login page");
        router.push("/auth/login");
      }, 2000);

      // Cleanup timer if component unmounts
      return () => clearTimeout(redirectTimer);
    }
  }, [submitStatus, isRedirecting, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Reset status if user is editing after an error
    if (submitStatus === "error") {
      setSubmitStatus("idle");
      setErrorMessage("");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isStrongPassword(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters and include letters, numbers, and special characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    console.log("Form validated, setting isSubmitting to true");
    setIsSubmitting(true);
    setErrorMessage("");
    setSubmitStatus("idle"); // Reset status before submission

    console.log("Starting password update...");

    try {
      // Use our utility function to update the password
      console.log("Calling updatePassword function");
      await updatePassword(formData.password);
      console.log("Password updated successfully, updating UI state");

      // Make sure we update the state in the correct order
      setSubmitStatus("success");
      setIsSubmitting(false);

      // Redirect is now handled by the useEffect
    } catch (error) {
      console.error("Password update error:", error);
      setSubmitStatus("error");
      setIsSubmitting(false);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <AuthLayout
        description="Setting up your password reset"
        status="idle"
        title="Update password"
      >
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
        <p className="text-center text-foreground-600">
          Verifying your session...
        </p>
      </AuthLayout>
    );
  }

  // Show error state if session is invalid
  if (!hasSession && submitStatus === "error") {
    return (
      <AuthLayout
        description="Set a new password for your account"
        status="error"
        title="Update password"
      >
        <ErrorMessage message={errorMessage} />
        <div className="mt-6 text-center">
          <p className="text-foreground-500">
            <Link
              className="text-primary font-medium"
              href="/auth/reset-password"
            >
              Request a new password reset link
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      description="Set a new password for your account"
      status={submitStatus === "idle" ? "idle" : submitStatus}
      title="Update password"
    >
      {submitStatus === "success" ? (
        <SuccessMessage
          buttonHref="/auth/login"
          buttonText={isRedirecting ? "Redirecting..." : "Log In"}
          message={
            isRedirecting
              ? "Your password has been updated successfully. Redirecting you to the login page..."
              : "Your password has been updated successfully. You can now log in with your new password."
          }
        />
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            error={errors.password}
            label="New Password"
            name="password"
            placeholder="Enter new password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />

          <FormInput
            error={errors.confirmPassword}
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm new password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <SubmitButton
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Updating Password..."
            text="Update Password"
          />

          {submitStatus === "error" && (
            <ErrorMessage
              message={
                errorMessage ||
                "There was an error updating your password. Please try again."
              }
            />
          )}
        </form>
      )}
    </AuthLayout>
  );
};

export default UpdatePassword;
