import { Input, InputProps } from "@heroui/input";
import { motion } from "framer-motion";

interface FormInputProps extends Omit<InputProps, "onChange"> {
  label: string;
  name: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * A styled form input component with error handling
 */
export const FormInput = ({
  label,
  name,
  error,
  onChange,
  placeholder,
  type = "text",
  value,
  ...props
}: FormInputProps) => {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      <Input
        fullWidth
        errorMessage={error}
        isInvalid={!!error}
        label={label}
        name={name}
        placeholder={placeholder}
        type={type}
        value={value}
        variant="bordered"
        onChange={onChange}
        {...props}
      />
    </motion.div>
  );
};

export default FormInput;
