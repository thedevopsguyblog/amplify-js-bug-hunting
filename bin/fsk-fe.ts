import * as fs from 'node:fs'
import {execSync} from 'node:child_process'
import {getEnvContext} from '../config'
import {type ResourcesConfig} from 'aws-amplify'
import * as yaml from 'yaml'

const currentBranch = process.env.AWS_BRANCH || execSync('git branch --show-current').toString().trim()

if (!currentBranch) {
	throw new Error(`No configuration found for branch: ${currentBranch}`)
} 

const envVars = getEnvContext(currentBranch)
console.log('Frontend:',envVars.RESOURCE_PREFIX)

const PREFIX = envVars.RESOURCE_PREFIX
const AC = envVars.APP_CODE
const SRC_FILE = './frontend/amplifyconfiguration.json'
/*
type keyName = `${string}-${string}`
interface IAuth {
    [key:keyName]: {
        UserPoolClientId: string,
        UserPoolId: string,
        unauthenticatedRole: string,
        authenticatedRole: string,
        IdentityPoolId: string,
    }
}

interface IBucket {
    [key:keyName]:{
        BucketName:string,
        BucketRegion:string
    }
}

type CombinedType = {
    [K in keyName]: IAuth[keyName] | IBucket[keyName]
}
*/
let parsedData = {} as any

// Injest JSON Data from CDK Deploy
async function injestJson(){
    
    try {
        console.info('Injesting JSON Amplify Configuration')
        const data = fs.readFileSync(SRC_FILE, 'utf8');
        parsedData = JSON.parse(data);
    } catch (err) {
        if (err instanceof Error) {
            console.log('Known Error')
            switch (err.message.split(':')[0]) {
                case 'ENOENT':
                    console.error("The 'amplifyconfiguration' File is missing - have you deployed your stack(s) yet?")
                    break;
                case 'SyntaxError':
                    console.error('Syntax Error in JSON, please check the file')
                    break;
                default:
                    console.error(err);
                    break;
            }
        } else {
            console.error(err);
        }
    }
}

// Write new aws-exports for Next JS
async function writeExports(){

    // Check the Env Prefix is the same
    if (JSON.stringify(parsedData).charAt(2) !== PREFIX) {
        const errorMessage = [
            `Mismatch between the target environment and the parsed data.`,
            `Current Environment: ${PREFIX}`,
            `Environment Prefix: ${JSON.stringify(parsedData).charAt(2)}`,
            `Please ensure the data corresponds to the current environment.`
        ].join('\n');
    
        throw new Error(errorMessage);
    }

    const authConfig = parsedData[`${PREFIX}FSK-Auth`]
    const apiConfig = parsedData[`${PREFIX}FSK-API`]
    const bucketConfig = parsedData[`${PREFIX}FSK-Bucket`]

    // Check if the required data is present
    if (!authConfig){
        throw new Error('Required config is missing in ParsedData');
    }

    // https://docs.amplify.aws/gen1/javascript/tools/libraries/configure-categories/
    let awsexports: ResourcesConfig = {}

    awsexports = {
        Auth: {
            Cognito: {
                userPoolClientId:authConfig.userPoolClientId,
                userPoolId:authConfig.userPoolId,
                allowGuestAccess: true,
                identityPoolId:authConfig.identityPoolId,
                signUpVerificationMethod: "code",
                loginWith: {
                    email: true,
                    oauth: {
                        domain: authConfig.userPoolDomainName,
                        providers: ["Google"],
                        scopes: [
                          'phone',
                          'email',            
                          'profile',
                          'openid',
                        ],
                        redirectSignIn: PREFIX === 'P' ? [`https://www.prod.com/`] : [ 'http://localhost:3000/', `https://testing.com/`, `https://dev.com/`],
                        redirectSignOut: PREFIX === 'P' ? [`https://www.prod.com/`] : [ 'http://localhost:3000/', `https://testing.com/`, `https://dev.com/`],
                        responseType: "code",
                    }
                }
            }
        },
        API: {
            GraphQL:{
                endpoint: apiConfig.endpoint,
                region: apiConfig.region,
                defaultAuthMode: 'userPool',
            }
        },
        Storage: {
            S3: {
                bucket: bucketConfig.BucketName,
                region: bucketConfig.BucketRegion,
            }
        }
    }

    try {
        fs.writeFileSync('./frontend/aws-exports.ts', `import { type ResourcesConfig }from "aws-amplify"; \n export const awsExports: ResourcesConfig = ${JSON.stringify(awsexports, null, 2)}`)
    } catch (error) {
        console.error('\nError Writting aws-exports file:\n',error)
    }
}

async function updateGqlConfigYml(){

    const gqlConfigFiles = ['./frontend/.graphqlconfig.yml', './api/.graphqlconfig.yml']

    for (const file of gqlConfigFiles){
        try {
            console.log(`Updating ${file}`)
            const config = fs.readFileSync(file, 'utf8')
            const parsedFile = yaml.parse(config)
            // parsedFile.projects['Codegen Project'].extensions.amplify.apiId
            
            
        } catch (error) {
            console.error('\nError Writting graphql config file:\n',error)
        }
    }
}

// Function to watch for changes in the amplifyconfiguration.json file then trigger my script 
async function init(){

    async function watchFile(){
        console.info(`Watching for amplifyconfiguration.json file`)
            fs.watch(SRC_FILE, () => {}).addListener('change', () => {
                console.info('File has changed')
                injestJson()
                writeExports()
            })
    }

    if (fs.existsSync(SRC_FILE) == false){
        console.error('File does not exist - begining watch mode')
        watchFile()
    } else {
        injestJson()
        writeExports()
        updateGqlConfigYml()
    }
}

init()