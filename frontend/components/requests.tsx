'use client'

import React from 'react'
import { Button, Input, Card, CardBody, CardHeader, Divider } from '@nextui-org/react'
import { submitCreateRequest } from '@/_actions/serverUtils'
import { FetchUserAttributesOutput } from 'aws-amplify/auth'
import { useFormState, useFormStatus } from 'react-dom'
import { uploadData } from 'aws-amplify/storage'
import { logger } from '@/lib/utils'
import {MdOutlineDeleteOutline} from "react-icons/md"

const initialState = {
  message: "",
  isSubmitting: false
}

const formattedDate = new Date().toLocaleDateString('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit' }).replaceAll('/', '-')

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className='w-full'
      disabled={pending}
      variant='flat'
      color={pending ? 'warning' : 'default'}
      isLoading={pending}
    >
      {pending ? 'Submitting...' : 'Submit Request'}
    </Button>
  )
}

export default function MyForm({ userAttributes }: { userAttributes: FetchUserAttributesOutput }) {
  const [files, setFiles] = React.useState<File[]>([])
  const formRef = React.useRef<HTMLFormElement>(null)

  const handleCreateRequest = async (prevState: typeof initialState, formData: FormData) => {
    let newState = { ...prevState, isSubmitting: true }


    if (files.length > 0) {
      const fileUploadResults: { name: string, etag: string }[] = []
      const uploadFiles = files.map(async (f) => {
        try {
          await uploadData({
            data: f,
            path: (identityId) => `protected/${identityId.identityId}/${formattedDate}/${f.name}`
          }).result.then(
            (uploadedFile) => {
              fileUploadResults.push({ name: uploadedFile.path, etag: uploadedFile.eTag! })
            }
          )
        } catch (error) {
          logger('REQ', 'UP', `Error:\n ${error}\nUploading file: ${f.name}`, 'error')
        }
      })

      await Promise.all(uploadFiles)

      logger('REQ', 'UP', `Final Obj:${fileUploadResults.length} vs ${files.length}`, 'debug')
      if (fileUploadResults.length === files.length) {
        logger('REQ', 'UP', `Appending`, 'debug')
        formData.append('files', JSON.stringify(fileUploadResults))
      } else {
        console.log('Failed to append data')
      }
    }

    try {
      const result = await submitCreateRequest(formData)
      newState = { ...newState, message: result!.message, isSubmitting: false }
    } catch (error) {
      if (error instanceof Error) {
        logger('REQ', 'Known Err UP-F', `Error submitting Form: ${JSON.stringify(error, null, 2)}`, 'debug')
      } else {
        logger('REQ', 'UnKnown Err UP-F', `Error submitting Form: ${error}`, 'error')
      }
      newState = { ...newState, message: 'Failed to submit request', isSubmitting: false }
    }

    return newState
  }

  const [state, formAction] = useFormState(handleCreateRequest, initialState)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prevFiles => [...prevFiles, ...newFiles])
    }
  }

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md">Create a Todo Item</p>
          <p className="text-small text-default-500">Fill out the form below to create a Todo Item</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <form ref={formRef} action={formAction} className='flex flex-col space-y-6'>
          <input name="orgid" type='hidden' value={userAttributes.email?.split('@')[1]} />
          <input name="status" type='hidden' value="open" />

            <Input
              label="Requestor"
              name="requestor"
              type='email'
              readOnly
              value={userAttributes.email}
            />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title"
              isRequired
              name="title"
              type='text'
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Description"
              isRequired
              name="description"
              type='text'
            />
          </div>


          <div className="space-y-2">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
              Upload Files
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="file-upload"
                name="file"
                type="file"
                multiple
                onChange={handleFileChange}
                className="sr-only"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
              >
                {/* <UploadIcon className="mr-2 h-5 w-5 text-gray-400" aria-hidden="true" /> */}
                <span>Choose files</span>
              </label>
              <span className="text-sm text-gray-500">{files.length} file(s) selected</span>
            </div>
            {files.length > 0 && (
              <ul className="mt-2 divide-y divide-gray-200">
                {files.map((file, index) => (
                  <li key={index} className="py-2 flex justify-between items-center">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      onClick={() => removeFile(file)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <MdOutlineDeleteOutline className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>


          <SubmitButton />

          {state?.message && (
            <div className={`mt-4 p-3 rounded-md ${state.message === "Request Submitted" ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {state.message}
            </div>
          )}
        </form>
      </CardBody>
    </Card>
  )
}