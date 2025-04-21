import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";

interface SuccessMessageProps {
  message: string;
  buttonText: string;
  buttonHref: string;
}

/**
 * A styled success message with action button
 */
export const SuccessMessage = ({
  message,
  buttonText,
  buttonHref,
}: SuccessMessageProps) => {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="text-center"
      initial={{ opacity: 0 }}
    >
      <p className="text-success mb-4">{message}</p>
      <Button as={Link} className="font-medium" href={buttonHref}>
        {buttonText}
      </Button>
    </motion.div>
  );
};

export default SuccessMessage;
