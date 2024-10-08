"use client"
import { MDXProvider } from '@mdx-js/react'
import { button as buttonStyles } from "@nextui-org/theme";
import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives"
import { GithubIcon } from "@/components/icons"
import { Link } from "@nextui-org/link"
import {MDXPresentationParser} from '@/components/MDXPresentationParser'
import {ProceduralSteps} from "@/components/steps"

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>issues/13710&nbsp;</span><br/>
        <span className={title({ color: "violet" })}>Fullstack Serverless Starter Project</span><br/><br/>
        <span className={title()}>CDK + Next JS 14 + Amplify&nbsp;</span><br/>
      </div>

      <ProceduralSteps/>

      <MDXProvider>
      <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Folder Structure</h1>
      <MDXPresentationParser />
      </div>
      </MDXProvider>
      
      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.github}
        >
          <GithubIcon size={20} />
          GitHub
        </Link>
      </div>
    </section>
  )
}