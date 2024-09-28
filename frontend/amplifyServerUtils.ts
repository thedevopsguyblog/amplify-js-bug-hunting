import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import {awsExports} from "@/aws-exports"
import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data";


/**
 * @link https://docs.amplify.aws/javascript/build-a-backend/graphqlapi/connect-from-server-runtime/
 */
export const cookieBasedClient = generateServerClientUsingCookies({
  config:awsExports,
  cookies,
  authMode: "userPool",
});


export const { runWithAmplifyServerContext } = createServerRunner({
    config: {...awsExports}
});