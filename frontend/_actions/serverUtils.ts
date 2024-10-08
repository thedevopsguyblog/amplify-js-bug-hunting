"use server"
import { cookieBasedClient } from '@/amplifyServerUtils';
import { parseAbsolute,} from '@internationalized/date';
import { CreateTodoMutation, Todo, TodoStatus} from '@/src/API';
import { z } from 'zod';
import { error } from 'console';
import { createTodo } from '@/src/graphql/mutations';


export async function submitCreateRequest(formData: FormData) {
    try {
        // Convert FormData to a plain object
        const submittedFormData = Object.fromEntries(formData.entries());

        // Parse files if present
        let file;
        if (submittedFormData.files) {
          file = JSON.parse(submittedFormData.files as string);
          console.log(`Files being submitted are:\n`, file);
        }

        const fileSchema = z.array(z.object({
            name: z.string(),
            etag: z.string(),
        }))

        const formSchema = z.object({
            title: z.string(),
            description: z.string(),
            status: z.enum([TodoStatus.open]),
            requestor: z.string().email(),
            file: fileSchema.optional(),
        });

        // Validate the form data
        const validatedData = formSchema.safeParse({
            ...submittedFormData,
            file: file,
        });

        if (validatedData.error) {
            if (error instanceof z.ZodError) {
                console.error('Form Submission Error:', error);
                return { message: `Whoops, \n ${validatedData.error.issues[0].message} \n ${JSON.stringify(validatedData.error.issues[0].path)}` };
            } else {
                console.error('Form Payload Error:', JSON.stringify(submittedFormData, null, 2));
                return { message: `Whoops, \n The ${validatedData.error.issues[0].path} field, \n is ${validatedData.error.issues[0].message}` };
            }
        } else {
            console.debug('Submitted Form Data:', JSON.stringify(validatedData, null, 2))
            const { data, errors, extensions } = await cookieBasedClient.graphql({
                query: createTodo,
                variables: {
                    input:{
                        requestor: validatedData.data.requestor,
                        title: validatedData.data.title,
                        status: validatedData.data.status,
                        description: validatedData.data.description,
                        file: file,
                    }
                },
            });

            if (errors) {
                console.error('Error Submitting Form:', JSON.stringify(errors, null, 2));
                throw new Error(errors.map(e => e.message).join(', '));
            }

            if (data.createTodo.id) {
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
