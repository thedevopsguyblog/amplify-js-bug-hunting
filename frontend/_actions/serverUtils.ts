"use server"
import * as gqlMutations from '@/src/graphql/mutations'
import * as gqlQueries from '@/src/graphql/queries'
import { cookieBasedClient } from '@/amplifyServerUtils';
import { parseAbsolute,} from '@internationalized/date';
import { z } from 'zod';
import { CreateRequestInput, RequestStatus, UpdateWatchlistInput } from '@/src/API';
import { error } from 'console';

/**
 * Convert a Date/Time string to localtime of the uer
 * @param date 
 * @returns Date string in ISO 8601 format
 */
function convertDateString(date: string) {
    // not being used yet but will be useful as date/time is stored on the DB in 2024-09-14T09:04:49.733+01:00[Europe/Dublin] format
    try {
        let submittedDate = date.split('[') 
        let timezone = submittedDate[1].slice(0, -1).toString() 
        let datetime = submittedDate[0].toString()
        let parsedDate = parseAbsolute(datetime, timezone).toString()
        return parsedDate;
    } catch (error) {
        console.error(`Error parsing date/time: ${error}`)
    }
}

export async function submitCreateRequest(formData: FormData) {
    try {
        // Convert FormData to a plain object
        const submittedFormData = Object.fromEntries(formData.entries());

        // Parse files if present
        let files;
        if (submittedFormData.files) {
          files = JSON.parse(submittedFormData.files as string);
          console.log(`Files:\n`, files);
        }

        const fileSchema = z.array(z.object({
            name: z.string(),
            etag: z.string(),
        }))

        const formSchema = z.object({
            id: z.undefined(),
            orgid: z.string(),
            class: z.string(),
            description: z.string(),
            requestor: z.string().email(),
            status: z.enum([RequestStatus.open]),
            subDate: z.string({message: "Please enter a valid date and time."}),
            yeargroup: z.number().int().min(0, {message: "Minimum value is 0"}).max(12, {message: "Limit is 12"}),
            location: z.string(),
            image: fileSchema.optional(),
        });

        // Validate the form data
        const validatedData = formSchema.safeParse({
            ...submittedFormData,
            yeargroup: Number(submittedFormData.yeargroup),
            subDate: formData.get('subdate')!.toString(),
            image: files,
        });

        if (validatedData.error) {
            if (error instanceof z.ZodError) {
                console.error('Form Submission Error:', error);
                return { message: `Whoops, \n ${validatedData.error.issues[0].message} \n ${JSON.stringify(validatedData.error.issues[0].path)}` };
            } else {
                console.error('Form Payload Error:', JSON.stringify(submittedFormData, null, 2));
                return { message: `Whoops, \n There was an issues with the ${validatedData.error.issues[0].path} field. ${validatedData.error.issues[0].message}` };
            }
        } else {
            console.debug('Submitted Form Data:', JSON.stringify(validatedData, null, 2))
            const { data, errors, extensions } = await cookieBasedClient.graphql({
                query: gqlMutations.createRequest,
                variables: {
                    input: {
                        id: validatedData.data.id,
                        orgid: validatedData.data.orgid,
                        class: validatedData.data.class,
                        description: validatedData.data.description,
                        requestor: validatedData.data.requestor,
                        status: validatedData.data.status,
                        subDate: validatedData.data.subDate,
                        yeargroup: validatedData.data.yeargroup,
                        location: validatedData.data.location,
                    },
                },
            });

            if (errors) {
                console.error('Error Submitting Form:', JSON.stringify(errors, null, 2));
                throw new Error(errors.map(e => e.message).join(', '));
            }

            if (data.createRequest.id) {
                return { message: 'Request Submitted' };
            } else {
                throw new Error('Failed to create request');
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            switch (error.cause) {
                case 'ValidationError':
                    return { message: `Validation failed: ${error.message}` };
                default:
                    console.error('Form Submission Error:', error);
                    return { message: 'Failed to Submit Request - Please contact support' };
                    break;
            }
        }
        if (error instanceof z.ZodError) {
            return { message: `Validation failed: ${error.errors.map(e => e.message).join(', ')}` };
        }
    }
}

//TODO: Capture all headers in a JSON object and pass it to the API to save to the DB
export async function updateWatchlist(prevState: any, formData: FormData) {

    console.debug(`Form Data:\n${JSON.stringify(formData, null, 2)}`)

    const submittedFormdata = Object.fromEntries(formData.entries());

    console.debug(`Submitted Form Data:\n${JSON.stringify(submittedFormdata, null, 2)}`)

    const formSchema = z.object({
        email: z.string().email(),
    });

    const validatedData = formSchema.safeParse({
        email: submittedFormdata.email,
    });

    if (validatedData.error) {
        console.error('Form Payload Error:\n', JSON.stringify(validatedData.error, null, 2))
    } else {
        try {
            const { data, errors, extensions } = await cookieBasedClient.graphql({
                query: gqlMutations.updateWatchlist,
                authMode: 'apiKey',
                variables: {
                    input: {
                        emailaddress: validatedData.data.email,
                    }
                }
            })
            if (data.updateWatchlist.emailaddress) {
                console.debug(`Watchlist Updated:\n${JSON.stringify(data.updateWatchlist, null, 2)}`)
                return { message: `Thanks for Subscribing!` }
            }
            if (errors) {
                console.error('The Error type is:', errors[0].message)
            }
        } catch (error) {
            console.error(`Form Submission Error:\n${JSON.stringify(error, null, 2)}`)
            return { message: `Whoops, something went wrong.` }
        }
    }
}

export async function getRequestsByUser(userid: string) {
    try {
        const { data } = await cookieBasedClient.graphql({
            query: gqlQueries.getRequestsByUser,
            variables: {
                requestorEmail: userid,
                limit: 10,
                nextToken: undefined
            }
        })
        console.debug(`API Data Response is:${JSON.stringify(data.getRequestsByUser)}`);

        return { data }
    } catch (error) {
        console.error(error)
        return { message: `There was an error getting your requests :( \n ${error}` }
    }
}


export async function getAdminAllRequests(orgid: string, isAdmin: boolean) {
    if (isAdmin == false && !isAdmin) {
        throw new Error('User isn\'t an admin so throwing preventing fetch')
    } else {
        console.info(`${orgid} is an admin - executing getAdminAllRequests`)
        try {
            const { data, errors, extensions } = await cookieBasedClient.graphql({
                query: gqlQueries.getRequestsByOrg,
                authMode: 'userPool',
                variables: {
                    orgid: orgid,
                    status: RequestStatus.open,
                    limit: 20,
                    nextToken: undefined
                }
            })
            console.log(`Server Util getAdminAllRequests() data: ${JSON.stringify(data)}`)
            return data
        } catch (error) {
            throw new Error(`Error getting 'getAdminAllRequests', with error:\n${error}`);

        }
    }
}

export async function assignRequest(formdata: FormData) {
    console.debug(`
        assignment: ${formdata.get('assignment')}
        status: ${formdata.get('status')}
        id: ${formdata.get('id')}
        orgid: ${formdata.get('orgid')}
        `)
    try {
        const { data, errors, extensions } = await cookieBasedClient.graphql({
            query: gqlMutations.updateRequest,
            authMode: 'userPool',
            variables: {
                input: {
                    assignment: formdata.get('assignment') as string,
                    status: formdata.get('status') as RequestStatus,
                    id: formdata.get('id') as string,
                    orgid: formdata.get('orgid') as string
                }
            }
        })

        if (data.updateRequest) {
            return {
                status: 200,
                uid: data.updateRequest.id
            }
        }
    } catch (error) {
        console.error(error)
        throw new Error(`assignRequest() Failed with error:\n${error}`);
    }
}