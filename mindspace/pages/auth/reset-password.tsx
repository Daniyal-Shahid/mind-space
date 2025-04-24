import { useState } from "react";
import { Link } from "@heroui/link";

import AuthLayout from "@/layouts/auth-layout";
import FormInput from "@/components/auth/form-input";
import SubmitButton from "@/components/auth/submit-button";
import SuccessMessage from "@/components/auth/success-message";
import ErrorMessage from "@/components/auth/error-message";
import { isValidEmail, sendPasswordResetEmail } from "@/utils/auth";

type FormData = {
  email: string;
};

type FormErrors = {
  email?: string;
};

const ResetPassword = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Reset status when user changes input
    if (submitStatus !== "idle") {
      setSubmitStatus("idle");
      setErrorMessage("");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await sendPasswordResetEmail(formData.email);
      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
      console.error("Reset password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="We&apos;ll send you a link to reset your password"
      status={submitStatus === "idle" ? "idle" : submitStatus}
      title="Reset password"
    >
      {submitStatus === "success" ? (
        <SuccessMessage
          buttonHref="/auth/login"
          buttonText="Return to Login"
          message="Password reset instructions have been sent to your email"
        />
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            error={errors.email}
            label="Email"
            name="email"
            placeholder="Enter your account email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />

          <SubmitButton
            isLoading={isSubmitting}
            loadingText="Sending Reset Link..."
            text="Reset Password"
          />

          {submitStatus === "error" && (
            <ErrorMessage
              message={
                errorMessage ||
                "There was an error sending the reset link. Please try again."
              }
            />
          )}
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-foreground-500">
          Remember your password?{" "}
          <Link className="text-primary font-medium" href="/auth/login">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
