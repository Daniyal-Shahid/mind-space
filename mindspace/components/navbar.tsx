import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { motion } from "framer-motion";

import { useAuth } from "@/contexts/auth-context";
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";

export const Navbar = () => {
  const { session, isLoading } = useAuth();
  const isAuthenticated = !!session;

  // Filter navigation items based on authentication status
  const filteredNavItems = siteConfig.navItems.filter((item) => {
    // Hide login and signup when authenticated
    if (
      isAuthenticated &&
      (item.href === "/auth/login" || item.href === "/auth/signup")
    ) {
      return false;
    }

    return true;
  });

  // Filter menu items for mobile navigation
  const filteredMenuItems = siteConfig.navMenuItems.filter((item) => {
    // Hide login and signup when authenticated
    if (
      isAuthenticated &&
      (item.href === "/auth/login" || item.href === "/auth/signup")
    ) {
      return false;
    }

    return true;
  });

  return (
    <HeroUINavbar
      className="bg-background/70 backdrop-blur-md"
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              MindSpace
            </p>
          </NextLink>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-6">
          {filteredNavItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium text-base hover:text-primary transition-colors",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
          {isAuthenticated && (
            <NavbarItem>
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium text-base hover:text-primary transition-colors",
                  )}
                  color="foreground"
                  href="/profile"
                >
                  Profile
                </NextLink>
              </motion.div>
            </NavbarItem>
          )}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
          {isAuthenticated ? (
            <motion.div
              animate={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                as={Link}
                className="text-sm font-medium bg-primary text-white"
                href="/profile"
                variant="flat"
              >
                My Profile
              </Button>
            </motion.div>
          ) : (
            <Button
              as={Link}
              className="text-sm font-medium bg-primary text-white"
              href="/get-started"
              variant="flat"
            >
              Get Started
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu className="pt-6">
        <div className="mx-4 mt-2 flex flex-col gap-4">
          {filteredMenuItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "text-lg font-medium hover:text-primary transition-colors",
                )}
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarMenuItem>
          ))}
          {isAuthenticated && (
            <NavbarMenuItem>
              <motion.div
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "text-lg font-medium hover:text-primary transition-colors",
                  )}
                  href="/profile"
                >
                  Profile
                </NextLink>
              </motion.div>
            </NavbarMenuItem>
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
