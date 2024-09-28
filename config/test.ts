import { RemovalPolicy } from 'aws-cdk-lib';
import {commonVars as vars} from './common';

const DOMAIN_PREFIX = 'test';
const FQDN = `${DOMAIN_PREFIX}.${vars.DOMAINNAME}`;

export const commonvars = {
  REGION: vars.REGION,
  ACCOUNT: vars.ACCOUNT,
  APP_CODE: vars.APP_CODE,
  PRODUCTNAME: vars.PRODUCTNAME,
  OWNER: vars.OWNER,
  REPO: vars.REPO,
  GHSECRET: vars.GHSECRET,
  DOMAINNAME:vars.DOMAINNAME,
  REMOVALPOLICY: RemovalPolicy.DESTROY,
  DOMAIN_PREFIX,
  FQDN,
  RESOURCE_PREFIX: 'T',
  BRANCH_NAME: 'main',
  'CALLBACK_URL':`http://localhost:3000/,https://${FQDN}/`,
  'LOGOUT_URL':`http://localhost:3000/,https://${FQDN}/`
}