import React from 'react'
import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { Divider } from "@nextui-org/divider"
import TreeGraph from './TreeGraph.mdx'

export const MDXPresentationParser: React.FC = () => {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-small text-default-500">This template has some important folders and files documented below</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <div className="prose dark:prose-invert max-w-none">
          <TreeGraph />
        </div>
      </CardBody>
    </Card>
  )
}