"use client"
import { useUserAttributesStore } from "@/context/userCtx"
import React from 'react'
import NewRequest from '@/components/requests'
import { Spinner } from '@nextui-org/spinner'

function RequestsForm() {

  const userAttributes = useUserAttributesStore()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  
  
  React.useEffect(() => {
    if (userAttributes?.email) {
      setLoading(false)
    }
  }, [userAttributes])

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <span><Spinner size='lg' label='Loading Request Form.'></Spinner></span>
        </div>
      </>
    )
  }
// TODO: Add error handling
  if (error) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div>
            <span>Failed to load request form.</span>
            </div>
            <br></br>
          <div><span>Try signing in and out again.</span></div>
        </div>
      </>
    )
  }
  return (
    <>
    <NewRequest userAttributes={userAttributes!}/>
    </>
  )
}

export default RequestsForm