"use client"
import { fetchUserAttributes, FetchUserAttributesOutput, fetchAuthSession } from "aws-amplify/auth";
import { logger } from '@/lib/utils';
import React from 'react';

export const lsProfileProps = 'mysubUsrAttr';


/** User Attributes Context
 * @description A context to store the user's attributes
*/

const UserAttributesCtx = React.createContext<FetchUserAttributesOutput | undefined>(undefined);

export function UserAttributesContextProvider({ children }: { children: React.ReactNode }) {

    const [signedInUserAttributes, setsignedInUserAttributes] = React.useState<FetchUserAttributesOutput | undefined>(undefined);

    React.useEffect(() => {
        const getUserAttributes = async () => {
                try {
                    let userAttributes = await fetchUserAttributes();
                    Object.keys(userAttributes).length === 0 ? setsignedInUserAttributes(undefined) : setsignedInUserAttributes(userAttributes);
                } catch (error) {
                    if (error instanceof Error) {
                        let errorName = error.name;
                        switch (errorName) {
                            case 'UserUnAuthenticatedException':
                                setsignedInUserAttributes(undefined);
                                break;
                            default:
                                logger('CTX', 'UACP', `Known Error user attr:\n${JSON.stringify(error, null, 2)}`, 'debug');
                                setsignedInUserAttributes(undefined);
                        }
                    } else {
                        console.error(`Unknown Error user attr:\n${JSON.stringify(error, null, 2)}`);
                        setsignedInUserAttributes(undefined);
                    }
                }
        }
        getUserAttributes()
    }, [])

    return (
        <UserAttributesCtx.Provider value={signedInUserAttributes}>
            {children}
        </UserAttributesCtx.Provider>
    );
};

// A custom hook to retrieve user attributes
export const useUserAttributesStore = (): FetchUserAttributesOutput | undefined => {
    const context = React.useContext(UserAttributesCtx)
    return context
}

/** Group Context
 * @description A context to store the user's group membership
*/
export type UserGroup = "admin" | "user" | "anon";
const GroupMembershipCtx = React.createContext<UserGroup>('anon');

export function GroupContextProvider({ children }: { children: React.ReactNode }){

    //https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-id-token.html
    const [group, setGroup] = React.useState<UserGroup >('anon');
    const [loading, setLoading] = React.useState<boolean>(true);
    const membership:string[] = []

    React.useEffect(() => {
        const getGroup = async () => {
            try {
                let payload = await (await fetchAuthSession()).tokens?.idToken?.payload['cognito:groups'];
                if (!payload){
                    setGroup('anon')
                } else {
                    membership.push(payload.toString())
                }

            } catch (error) {
                if (error instanceof Error) {
                    switch (error.name) {
                        case 'NotAuthorizedException':
                            logger('CTX', 'GCP', 'Please Sign in', 'debug');
                            break;
                        case 'Network error':
                            logger('CTX', 'GCP', 'Do you have internet access?', 'debug');
                            break;
                        default:
                            logger('CTX', 'GCP', `Known Err: ${error}`, 'debug');
                    }
                } else {
                    logger('CTX', 'GCP', `UnKnown Err: ${JSON.stringify(error, null, 2)}`, 'error');
                }
            }

            if (membership.some(member => new RegExp('.*admin').test(member))) {
                setGroup('admin')
            } else if(membership.some(member => new RegExp('.*user').test(member))) {
                setGroup('user')
            } else {
                setGroup('anon')
            }
        }

        setLoading(false);
        getGroup()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center">
              <div className="text-sm text-grey-500 inline-block text-center">
              </div>
            </div>
          );
    }

    return (
        <GroupMembershipCtx.Provider value={group}>
            {children}
        </GroupMembershipCtx.Provider>
    );
}

export function useIsUserInGroup(): UserGroup {
    const context = React.useContext(GroupMembershipCtx);
    if (!context) {
        throw new Error('\nMake sure the user is actually in a group.\nMake sure useIsUserInGroup() is used within a GroupContextProvider')
    }
    return context as UserGroup;
}