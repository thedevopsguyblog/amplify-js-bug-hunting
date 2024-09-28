export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "SaaS Bug Hunting",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Demo",
      href: "/demo",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
  ],
  links: {
    github: "https://github.com/thedevopsguyblog/amplify-js-bug-hunting.git",
  },
};
