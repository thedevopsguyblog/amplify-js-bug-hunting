import { runWithAmplifyServerContext } from '@/amplifyServerUtils'
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { logger } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request:NextRequest){
    
    let response = NextResponse.next();

    let authenticated = await runWithAmplifyServerContext({
        nextServerContext: {request, response},
        operation: async (contextSpec) => {
            try {
                let session = await fetchAuthSession(contextSpec)
                let date = session.tokens?.accessToken.payload.exp
                date ? logger('MW','',`[SESH] Token expires at: ${new Date(date * 1000).toLocaleString()}`, 'debug') : logger('MW','',`[SESH] - No Session found`, 'debug')
                return (
                    session.tokens?.accessToken !== undefined 
                    && session.tokens?.idToken !== undefined
                );
            } catch (error) {
                if (error instanceof Error) {
                    switch (error.name) {
                        case 'NotAuthorizedException':
                            logger('MW','Knwon Err',`${error.name}`, 'debug')
                            break;
                        default:
                            logger('MW','Known Err', `${JSON.stringify(error, null, 2)}`, 'debug')
                    }
                } else {
                    logger('MW','UnKnown Err', `${JSON.stringify(error, null, 2)}`, 'error')
                }
            }
        }
    })

    if (authenticated) {
        return response
    } else {
        return NextResponse.redirect(new URL('/', request.url));
    }
}

export const config = {
    matcher: '/((?!api|_next/static|_next/image|feedback|favicon.ico|$).*)',
  };