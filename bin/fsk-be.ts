#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {API } from '../lib/api';
import { AuthStack } from '../lib/auth-stack';
import { execSync } from 'node:child_process';
import { getEnvContext } from '../config';

const app = new cdk.App();
const currentBranch = process.env.AWS_BRANCH || execSync('git branch --show-current').toString().trim()

if (!currentBranch) {
	throw new Error(`No configuration found for branch: ${currentBranch}`)
} 

const envVars = getEnvContext(currentBranch)

console.log(envVars)

let RA = `${envVars.RESOURCE_PREFIX}${envVars.APP_CODE}`

const authStack = new AuthStack(app, `${RA}-Auth`, {
  stackName:`${RA}-Auth`,
  description: `Auth for ${RA}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  enVars: envVars,
  tags: {
    app: `${RA}Auth`,
    repoName: envVars.REPO
  }
});

const apistack = new API(app, `${RA}-API`, {
  stackName:`${RA}-API`,
  description: `Appsync and DBs for ${RA}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  envVars: envVars,
  tags: {
    app: `${RA}-API-DB`,
    repoName: envVars.REPO
  }
})

apistack.addDependency(authStack)