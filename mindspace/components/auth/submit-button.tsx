import { Button, ButtonProps } from "@heroui/button";
import { motion } from "framer-motion";
import { useEffect } from "react";

interface SubmitButtonProps extends Omit<ButtonProps, "children"> {
  isLoading?: boolean;
  loadingText?: string;
  text: string;
}

/**
 * A styled submit button component with loading state
 */
export const SubmitButton = ({
  isLoading = false,
  loadingText,
  text,
  className = "",
  ...props
}: SubmitButtonProps) => {
  // Add effect to log state changes for debugging
  useEffect(() => {
    console.log("SubmitButton state changed:", {
      isLoading,
      loadingText,
      disabled: props.disabled,
    });
  }, [isLoading, loadingText, props.disabled]);

  return (
    <motion.div className="pt-2" whileTap={{ scale: 0.98 }}>
      <Button
        className={`w-full bg-primary text-white font-medium ${className}`}
        isLoading={isLoading}
        size="lg"
        type="submit"
        {...props}
      >
        {isLoading ? loadingText || `Processing...` : text}
      </Button>
    </motion.div>
  );
};

export default SubmitButton;
