import { useState } from "react";
import { Link } from "@heroui/link";
import { useRouter } from "next/router";

import AuthLayout from "@/layouts/auth-layout";
import FormInput from "@/components/auth/form-input";
import SubmitButton from "@/components/auth/submit-button";
import SuccessMessage from "@/components/auth/success-message";
import ErrorMessage from "@/components/auth/error-message";
import { signUp, isStrongPassword, isValidEmail } from "@/utils/auth";
import { supabase } from "@/config/supabase";

type FormData = {
  name: string;
  email: string;
  password: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
};

const SignUp = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
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
    setSubmitStatus("idle"); // Reset status when user changes input
    setErrorMessage("");
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isStrongPassword(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters and include letters, numbers, and special characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Helper function to directly sign up without the custom utility
  const directSignUp = async () => {
    // Try direct Supabase signup as a fallback
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Try using our helper first
      let result;

      try {
        // First attempt: use our custom signup function
        result = await signUp(formData.name, formData.email, formData.password);
      } catch (signupError) {
        console.error("Main signup method failed:", signupError);

        // Last resort: try direct Supabase signup
        result = await directSignUp();
      }

      // Check if email confirmation is required
      if (result?.user && !result.user.confirmed_at) {
        setSubmitStatus("success");
      } else if (result?.user) {
        // If confirmed immediately (might happen in development)
        setSubmitStatus("success");
      } else {
        throw new Error("Signup failed. Please try again.");
      }
    } catch (error) {
      setSubmitStatus("error");
      console.error("All signup attempts failed:", error);

      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes("already registered")) {
          setErrorMessage(
            "This email is already registered. Try logging in instead.",
          );
        } else if (error.message.includes("Database error")) {
          setErrorMessage(
            "There was an issue creating your profile. Please try again or contact support.",
          );
        } else if (
          error.message.includes("response format") ||
          error.message.includes("JSON")
        ) {
          setErrorMessage(
            "Server configuration issue. Please try again later or contact support.",
          );
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="Create your MindSpace account"
      status={submitStatus === "idle" ? "idle" : submitStatus}
      title="Create your account"
    >
      {submitStatus === "success" ? (
        <SuccessMessage
          buttonHref="/auth/login"
          buttonText="Proceed to Login"
          message="Your account has been created! Please check your email to confirm your registration."
        />
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            error={errors.name}
            label="Name"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
          />

          <FormInput
            error={errors.email}
            label="Email"
            name="email"
            placeholder="Enter your email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />

          <FormInput
            error={errors.password}
            label="Password"
            name="password"
            placeholder="Create a password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />

          <SubmitButton
            isLoading={isSubmitting}
            loadingText="Creating Account..."
            text="Sign Up"
          />

          {submitStatus === "error" && (
            <ErrorMessage
              message={
                errorMessage ||
                "There was an error creating your account. Please try again."
              }
            />
          )}
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-foreground-500">
          Already have an account?{" "}
          <Link className="text-primary font-medium" href="/auth/login">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
