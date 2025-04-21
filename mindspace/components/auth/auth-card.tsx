import { motion } from "framer-motion";

type AuthCardProps = {
  children: React.ReactNode;
  status?: "success" | "error" | "idle";
};

/**
 * A card component used in authentication pages with optional animation states
 */
export const AuthCard = ({ children, status = "idle" }: AuthCardProps) => {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`bg-content1 p-8 rounded-xl shadow-sm border ${
        status === "error"
          ? "border-danger/20"
          : status === "success"
            ? "border-success/20"
            : "border-transparent"
      }`}
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default AuthCard;
