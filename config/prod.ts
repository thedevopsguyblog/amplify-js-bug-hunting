import { RemovalPolicy } from 'aws-cdk-lib';
import {commonVars as vars} from './common';

const DOMAIN_PREFIX = 'www';
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
  RESOURCE_PREFIX: 'P',
  BRANCH_NAME: 'main',
  FQDN,
  'CALLBACK_URL':`https://${FQDN}/`,
  'LOGOUT_URL':`https://${FQDN}/`
}