"use client"
import React from 'react';
import { logger } from '@/lib/utils';
import * as gqlQueries from '@/src/graphql/queries'
import type { Organisation } from '@/src/API';
import {useUserAttributesStore} from './userCtx'
import {generateClient} from 'aws-amplify/api'

const client = generateClient()
/**
 * @description A context to store information about the current organization, such as the organization's name, who the admins are, and other details.
 */

const OrgCtx = React.createContext<Organisation | undefined>(undefined);

export function OrgContextProvider({ children }: { children: React.ReactNode}) {
    
    const orgIdFromApiCall = useUserAttributesStore();
    const [orgId, setOrgId] = React.useState<string | undefined>(undefined);
    const [orgDetails, setOrgDetails] = React.useState<Organisation | undefined>(undefined);

    React.useEffect(() => {
        if (orgIdFromApiCall) {
            logger('CTX', 'OrgCTX', `Org ID from API call: ${JSON.stringify(orgIdFromApiCall, null, 2)}`, 'debug');
            setOrgId(orgIdFromApiCall["custom:orgId"]);
        }
    })


        React.useEffect(() => {
            const getOrgDetails = async () => {
                try {
                    logger('CTX', 'OrgCTX-I', `Fetching org ${orgId}`, 'debug');
                    const response = await client.graphql({
                        query: gqlQueries.getOrganisationDetails,
                        variables:{
                            // orgId: orgId,
                            orgId: orgId!
                        }
                    })
                    
                    if (response.data.getOrganisationDetails) {    
                      setOrgDetails(response.data.getOrganisationDetails);
                    } else {
                      setOrgDetails(undefined);
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        let errorName = error.name;
                        switch (errorName) {
                            default:
                                logger('CTX', 'OrgCTX-II', `Known Error org details:\n${JSON.stringify(error, null, 2)}`, 'debug');
                                setOrgDetails(undefined);
                        }
                    } else {
                        logger('CTX', 'OrgCTX-III', `Unknown Error org details:\n${JSON.stringify(error, null, 2)}`, 'error');
                        setOrgDetails(undefined);
                    }
                }
            }
            getOrgDetails()
        }, [orgId])
    
        return (
            <OrgCtx.Provider value={orgDetails}>
                {children}
            </OrgCtx.Provider>
        );
}

export const useOrgStore = (): Organisation | undefined => {
    const context = React.useContext(OrgCtx)
    logger('CTX', 'OrgCTX', `Org context: ${JSON.stringify(context, null, 2)}`, 'debug')
    return context
}


