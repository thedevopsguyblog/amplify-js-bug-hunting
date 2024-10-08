export type SiteConfig = typeof siteConfig;

export type NavItem = {
	label: string;
	href: string;
	auth: boolean;
	admin: boolean;
};

export const siteConfig = {
	name: "Amplify JS Starter",
	title: "A project to get you started with Amplify Gen 1 + CDK and Next JS",
	description: "A project to get you started with Amplify Gen 1 + CDK and Next JS",
	url: "https://domain.com",
	navItems: [
		{
			label: "Home",
			href: "/",
			auth:false,
			admin: false
		},
		{
			label: "Profile",
			href: "/profile",
			auth:true,
			admin: false
		},
		{
			label: "Create Todo",
			href: "/create",
			auth: true,
			admin: false
		},
		{
			label: "List Todos",
			href: "/list",
			auth:true,
			admin: false
		}
	],
	links: {
		email: "support@domain.com",
		github: "https://github.com/thedevopsguyblog/amplify-js-bug-hunting.git",
	},
};