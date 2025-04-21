import { motion } from "framer-motion";
import NextLink from "next/link";
import Head from "next/head";

import { Logo } from "@/components/icons";
import AuthCard from "@/components/auth/auth-card";

type AuthLayoutProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  status?: "success" | "error" | "idle";
};

export const AuthLayout = ({
  children,
  title,
  description,
  status = "idle",
}: AuthLayoutProps) => {
  return (
    <>
      <Head>
        <title>{title} - MindSpace</title>
        <meta content={description} name="description" />
      </Head>
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-6">
            <NextLink className="flex items-center gap-1" href="/">
              <Logo />
              <p className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                MindSpace
              </p>
            </NextLink>
          </div>

          <AuthCard status={status}>
            <h1 className="text-2xl font-bold text-center mb-6">{title}</h1>
            {children}
          </AuthCard>
        </motion.div>
      </div>
    </>
  );
};

export default AuthLayout;
