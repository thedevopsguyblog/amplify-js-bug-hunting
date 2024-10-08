"use client"
import { generateClient } from 'aws-amplify/api'
import { listTodos } from "@/src/graphql/queries"
import React from 'react'
import { useUserAttributesStore } from '@/context/userCtx'
import { Card, CardBody, CardFooter, CardHeader } from '@nextui-org/react'
import { ListTodosQuery } from '@/src/API'
import { logger } from '@/lib/utils'


const client = generateClient()

export default function UserDashboard() {
    const userAttributes = useUserAttributesStore()
    const [isLoading, setIsLoading] = React.useState<boolean>(true)
    const [error, setError] = React.useState({ state: false, errorMsg: "" })
    const [requestsData, setRequestsData] = React.useState<{ payload:ListTodosQuery | null }>({ payload: null })

    React.useEffect(() => {
        if (!userAttributes) return;

        const fetchRequests = async () => {
            try {
                const { data, errors } = await client.graphql({
                    query: listTodos,
                });
                logger("LIST", "Fetching requests", JSON.stringify(error), "debug")
                if (data.listTodos!.length === 0) {
                    console.log("No todos found")
                }
                setRequestsData({ payload: data! });
                setIsLoading(false)
            } catch (error) {
                console.error(JSON.stringify(error, null, 2));
                setIsLoading(false)
                setError({ state: true, errorMsg: JSON.stringify(error, null, 2) });
            }
        }

        fetchRequests()
    }, [userAttributes])


  return (
    <>
    <h1>Run a scan operation on DynamoDB</h1>
    {userAttributes && <h2>Logged in as: {userAttributes.email}</h2>}
    {isLoading && <p>Loading...</p>}
    {error.state && <p>Error: {error.errorMsg}</p>}
    {requestsData.payload && requestsData.payload.listTodos!.map((todo) => (
        <Card key={todo?.id}>
            <CardHeader>{todo?.title}</CardHeader>
            <CardBody>
                {todo?.description}
                {todo?.id}
                {todo?.requestor}
                {todo?.status}
                </CardBody>
                <CardFooter>
                {todo?.file}
                </CardFooter>
        </Card>
    ))}

    </>
  )
}