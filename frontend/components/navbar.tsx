"use client"
import {
	Navbar as NextUINavbar,
	NavbarContent,
	NavbarMenu,
	NavbarMenuToggle,
	NavbarBrand,
	NavbarItem,
	NavbarMenuItem,
} from "@nextui-org/navbar";
import { link as linkStyles } from "@nextui-org/theme";
import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import clsx from "clsx";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import type { NavItem } from "@/config/site";
import React from "react";
import { SignInModal } from "./auth/signinmodal";
import { useIsUserInGroup } from "@/context/userCtx";
import { logger } from "@/lib/utils";


export default function Navbar() {
	
	const [navLinks, setNavLinks] = React.useState<NavItem[]>([])
	const [toggleNav, setToggleNav] = React.useState<boolean>(false)
	const grp = useIsUserInGroup()

	React.useEffect(() => {
		function createNavLinks(navbaritems:Array<NavItem>) {
		let navBarItems:Array<NavItem> = [];
		logger('NAVBAR', 'GRP', `User Group: ${grp}`, 'debug')
		  switch (grp) {
			case 'admin':
			  navBarItems = navbaritems.filter((route:NavItem) => route.auth == true || route.admin == true);
			  break
			case 'user':
			  navBarItems = navbaritems.filter((route:NavItem) => route.admin == false && route.auth == true);
			  break
			default:
			  navBarItems = navbaritems.filter((route:NavItem) => route.auth == false && route.admin == false);
			  break
		  }
		  setNavLinks(navBarItems)
		}
		createNavLinks(siteConfig.navItems)
	  }, [grp])

	return (
		<NextUINavbar maxWidth="xl" position="sticky" isMenuOpen={toggleNav}>
			{/* Left Side Desktop Display - Links*/}
			<NavbarContent className="basis-1/5 sm:basis-full" justify="start">
				<NavbarBrand as="li" className="gap-3 max-w-fit">
					<NextLink className="flex justify-start items-center gap-1" href="/">
						<Logo />
						<p className="font-bold text-inherit">{siteConfig.name}</p>
					</NextLink>
				</NavbarBrand>
				<ul className="hidden sm:flex gap-4 justify-start ml-2">
					{navLinks.map((item) => (
						<NavbarItem key={item.href}>
							<NextLink
								className={clsx(
									linkStyles({ color: "foreground" }),
									"data-[active=true]:text-primary data-[active=true]:font-medium"
								)}
								color="foreground"
								href={item.href}
							>
								{item.label}
							</NextLink>
						</NavbarItem>
					))}
				</ul>
			</NavbarContent>

			{/* Right Side Desktop Display - Theme and Login/out Button*/}
			<NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
				<NavbarItem className="hidden sm:flex gap-2">
					<ThemeSwitch/>
				</NavbarItem>
				<NavbarItem className="hidden sm:flex">
					<SignInModal />
				</NavbarItem>
			</NavbarContent>
									
			{/* Mobile Display */}
			<NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
				<ThemeSwitch />
				<NavbarMenuToggle onChange={() => setToggleNav(!toggleNav)}/>
				{/* <NavbarMenuToggle/> */}
			</NavbarContent>

			{/* Mobile Display Hamburger Menu */}
			<NavbarMenu> 
				<div className="mx-4 mt-2 flex flex-col gap-2">
					{navLinks.map((item, index) => (
						<NavbarMenuItem 
							key={`${item}-${index}`} 
							onClick={() => setToggleNav(!toggleNav)}
						>
							<NextLink
								href={item.href}
							>
								{item.label}
							</NextLink>
						</NavbarMenuItem>
					))}
					<SignInModal />
				</div>
			</NavbarMenu>
		</NextUINavbar>
	);
};