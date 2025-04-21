import { motion } from "framer-motion";

interface ErrorMessageProps {
  message: string;
}

/**
 * A styled error message component with animation
 */
export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className="text-danger text-center text-sm mt-2"
      initial={{ opacity: 0, y: -5 }}
    >
      {message}
    </motion.p>
  );
};

export default ErrorMessage;
