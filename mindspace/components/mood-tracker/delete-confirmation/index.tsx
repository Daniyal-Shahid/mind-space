import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/button";

interface DeleteConfirmationProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmation({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: DeleteConfirmationProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      key="delete-backdrop"
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        key="delete-content"
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-background rounded-xl shadow-lg p-6 max-w-md w-full"
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <motion.h3
          layout
          className="text-xl font-semibold text-default-900 mb-2"
        >
          Delete Mood Entry?
        </motion.h3>
        
        <p className="text-default-600 mb-6">
          This mood entry contains notes that will be permanently deleted. Are you sure you want to continue?
        </p>

        <div className="flex justify-end gap-2">
          <Button
            color="default"
            disabled={isLoading}
            variant="flat"
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            className="relative"
            color="danger"
            disabled={isLoading}
            onPress={onConfirm}
          >
            {isLoading ? (
              <>
                <span className="opacity-0">Delete</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
} 