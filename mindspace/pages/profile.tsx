import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";

import { useAuth } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/auth/protected-route";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

// Simple card components since @heroui/card may not be available
const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-content1 rounded-xl shadow-sm border border-transparent ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-4 border-b ${className}`}>{children}</div>;

const CardBody = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-4 ${className}`}>{children}</div>;

const CardFooter = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-4 border-t ${className}`}>{children}</div>;

// Avatar component
const Avatar = ({
  src,
  name,
  className = "",
}: {
  src: string | null;
  name: string | null;
  className?: string;
}) => (
  <div
    className={`relative rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold ${className}`}
  >
    {src ? (
      <img
        alt={name || "User"}
        className="w-full h-full rounded-full object-cover"
        src={src}
      />
    ) : (
      <span>{name?.charAt(0) || "U"}</span>
    )}
  </div>
);

// Tabs components
type TabProps = {
  title: string;
};

const Tab = ({ title }: TabProps) => <div>{title}</div>;

type TabsProps = {
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  color?: string;
  variant?: string;
  className?: string;
  children: React.ReactNode;
};

const Tabs = ({
  selectedKey,
  onSelectionChange,
  children,
  className = "",
}: TabsProps) => {
  // Extract tab props from children
  const tabs = React.Children.toArray(children)
    .map((child) => {
      if (React.isValidElement(child)) {
        return {
          id: child.key?.toString().replace(".$", "") || "",
          title: child.props.title,
        };
      }

      return null;
    })
    .filter(Boolean) as { id: string; title: string }[];

  return (
    <div className={`border-b ${className}`}>
      <div className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`pb-2 px-1 ${
              selectedKey === tab.id
                ? "border-b-2 border-primary text-primary font-medium"
                : "text-default-500"
            }`}
            onClick={() => onSelectionChange(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { profile, user, signOut, isLoading } = useAuth();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("profile");

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  // Placeholder data for the tabs
  const tabData: Record<string, React.ReactNode> = {
    profile: (
      <motion.div
        animate="visible"
        className="space-y-6 w-full"
        initial="hidden"
        variants={containerVariants}
      >
        <motion.div className="w-full" variants={itemVariants}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar
                className="w-20 h-20 text-large"
                name={profile?.name?.charAt(0) || "U"}
                src={
                  profile?.profile_image ||
                  "https://i.pravatar.cc/150?u=" + profile?.id
                }
              />
              <div>
                <h1 className="text-2xl font-bold">
                  {profile?.name || "User"}
                </h1>
                <p className="text-default-500">{user?.email}</p>
              </div>
            </div>
            <Button className="text-white" color="primary" variant="flat">
              Edit Profile
            </Button>
          </div>
        </motion.div>

        <Divider className="w-full" />

        <motion.div className="w-full" variants={itemVariants}>
          <Card className="w-full">
            <CardHeader>
              <h3 className="text-xl font-semibold">Profile Information</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-default-500">Name</p>
                  <p>{profile?.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Email</p>
                  <p>{user?.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Member Since</p>
                  <p>
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    ),

    activity: (
      <motion.div
        animate="visible"
        className="space-y-6 w-full"
        initial="hidden"
        variants={containerVariants}
      >
        <motion.div className="w-full" variants={itemVariants}>
          <Card className="w-full">
            <CardHeader>
              <h3 className="text-xl font-semibold">Recent Activity</h3>
            </CardHeader>
            <CardBody className="flex flex-col items-center justify-center py-16">
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                initial={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xl text-default-500 font-medium">
                  Coming Soon
                </p>
                <p className="text-center text-default-400 mt-2">
                  Activity tracking is currently under development
                </p>
              </motion.div>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    ),

    settings: (
      <motion.div
        animate="visible"
        className="space-y-6 w-full"
        initial="hidden"
        variants={containerVariants}
      >
        <motion.div className="w-full" variants={itemVariants}>
          <Card className="w-full">
            <CardHeader>
              <h3 className="text-xl font-semibold">Account Settings</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-default-500">
                      Receive emails about your activity
                    </p>
                  </div>
                  <Button color="primary" variant="light">
                    Configure
                  </Button>
                </div>

                <Divider />

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Privacy Settings</p>
                    <p className="text-sm text-default-500">
                      Manage your data and privacy preferences
                    </p>
                  </div>
                  <Button color="primary" variant="light">
                    Configure
                  </Button>
                </div>

                <Divider />

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-default-500">
                      Update your password
                    </p>
                  </div>
                  <Button color="primary" variant="light">
                    Update
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div className="w-full" variants={itemVariants}>
          <Card className="w-full">
            <CardHeader>
              <h3 className="text-xl font-semibold text-danger">Danger Zone</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-default-500">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button color="danger" variant="flat">
                    Delete
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    ),
  };

  return (
    <ProtectedRoute>
      <motion.div
        animate="visible"
        className="w-full mx-auto pt-0"
        initial="hidden"
        variants={fadeIn}
      >
        <div className="relative">
          {/* Profile Header Banner */}
          <div className="h-40 w-full bg-gradient-to-r from-primary to-secondary" />

          <div className="w-full px-6 pt-4 pb-6">
            <Tabs
              className="mt-6"
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key)}
            >
              <Tab key="profile" title="Profile" />
              <Tab key="activity" title="Activity" />
              <Tab key="settings" title="Settings" />
            </Tabs>

            <div className="mt-6">{tabData[selectedTab]}</div>
          </div>

          <div className="w-full px-6 flex justify-end gap-2 p-4 border-t">
            <Button color="danger" variant="light" onPress={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </motion.div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
