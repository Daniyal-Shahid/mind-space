export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "MindSpace",
  description: "Your personal mental wellness companion.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Mood Tracker",
      href: "/mood-tracker",
    },
    {
      label: "Journal",
      href: "/journal",
    },
    {
      label: "Affirmations",
      href: "/affirmations",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Login",
      href: "/auth/login",
    },
    {
      label: "Sign Up",
      href: "/auth/signup",
    },
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Mood Tracker",
      href: "/mood-tracker",
    },
    {
      label: "Journal",
      href: "/journal",
    },
    {
      label: "Affirmations",
      href: "/affirmations",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Login",
      href: "/auth/login",
    },
    {
      label: "Sign Up",
      href: "/auth/signup",
    },
  ],
  links: {
    github: "https://github.com/yourusername/mindspace",
    twitter: "https://twitter.com/mindspace_app",
  },
};
