import { Link } from "@nextui-org/link";
import { Textarea } from "@nextui-org/input";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>AWS CDK + &nbsp;</span><br/>
        <span className={title()}>Next + &nbsp;</span><br/>
        <span className={title()}>Amplify Gen1&nbsp;</span><br/>
        <span className={title({ color: "violet" })}>Fullstack Serverless Starter Project</span>
        <br />
        <div className={subtitle({ class: "mt-4" })}>
          This template consumes infra provisioned my the CDK, and dynamically generates amplify configuration files. Then the app is able to make client side and server side calls to serverices like S3 and AppSync.
          <br/><br/>To get started, clone the repo and follow the instructions below.
        </div>
      </div>

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

      <div className="mt-8">
        <Textarea variant="bordered" inputMode='text'>
          <p>
            XXX
          </p>
        </Textarea>
      </div>
    </section>
  );
}
