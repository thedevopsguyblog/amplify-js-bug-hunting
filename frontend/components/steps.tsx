import React from 'react'
import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { Divider } from "@nextui-org/divider"
import { Chip } from "@nextui-org/chip"
import { Snippet } from "@nextui-org/snippet"

export function ProceduralSteps() {
  const steps = [
    {
      title: "Sign into AWS",
      code: "asp (profileName)",
    },
    {
      title: "Deploy the Fullstack Project",
      description: "Open your terminal and execute:",
      code: "npm run dev:fullstack",
    },
    {
      title: "Start the frontend server",
      description: "Navigate to the frontend directory and run:",
      code: "cd frontend && npm run dev",
    },
  ]

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md">Getting Started</p>
          <p className="text-small text-default-500">Follow these steps to replicate GH Issue: 13710 <br/></p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        {steps.map((step, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <Chip color="primary" variant="flat">{index + 1}</Chip>
              <h3 className="text-lg font-semibold">{step.title}</h3>
            </div>
            <p className="text-default-500 ml-10">{step.description}</p>
            {step.code && (
              <Snippet className="ml-10 mt-2" color="primary">
                {step.code}
              </Snippet>
            )}
            {index < steps.length - 1 && <Divider className="my-4" />}
          </div>
        ))}
      </CardBody>
    </Card>
  )
}