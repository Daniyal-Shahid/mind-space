import { useState, useEffect } from "react";
import { Link } from "@heroui/link";
import { useRouter } from "next/router";

import AuthLayout from "@/layouts/auth-layout";
import FormInput from "@/components/auth/form-input";
import SubmitButton from "@/components/auth/submit-button";
import SuccessMessage from "@/components/auth/success-message";
import ErrorMessage from "@/components/auth/error-message";
import { signIn, isValidEmail } from "@/utils/auth";

type FormData = {
  email: string;
  password: string;
};

type FormErrors = {
  email?: string;
  password?: string;
};

const Login = () => {
  const router = useRouter();
  const { returnUrl } = router.query;
  
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [redirectPath, setRedirectPath] = useState<string>("/");

  // Set the redirect path based on the returnUrl query parameter
  useEffect(() => {
    if (returnUrl && typeof returnUrl === 'string') {
      setRedirectPath(returnUrl);
    }
  }, [returnUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
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
      // Call Supabase login function
      const { user, session } = await signIn(formData.email, formData.password);

      if (user && session) {
        setSubmitStatus("success");
        // Redirect to the appropriate page after a short delay
        setTimeout(() => {
          router.push(redirectPath);
        }, 1500);
      }
    } catch (error) {
      setSubmitStatus("error");
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="Log in to your MindSpace account"
      status={submitStatus === "idle" ? "idle" : submitStatus}
      title="Welcome back"
    >
      {submitStatus === "success" ? (
        <SuccessMessage
          buttonHref={redirectPath}
          buttonText={redirectPath === "/profile" ? "Go to Profile" : "Go to Dashboard"}
          message="You have successfully logged in! Redirecting..."
        />
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            error={errors.email}
            label="Email"
            name="email"
            placeholder="Enter your email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />

          <div>
            <FormInput
              error={errors.password}
              label="Password"
              name="password"
              placeholder="Enter your password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
            <div className="flex justify-end mt-1">
              <Link
                className="text-xs text-primary"
                href="/auth/reset-password"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <SubmitButton
            isLoading={isSubmitting}
            loadingText="Logging In..."
            text="Log In"
          />

          {submitStatus === "error" && (
            <ErrorMessage
              message={
                errorMessage || "Incorrect email or password. Please try again."
              }
            />
          )}
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-foreground-500">
          Don&apos;t have an account?{" "}
          <Link className="text-primary font-medium" href="/auth/signup">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
