/**
 * @description a build file that finds *.ts files and outputs *.js files that appsync can use
 * Read this {@link https://docs.aws.amazon.com/appsync/latest/devguide/resolver-reference-overview-js.html#additional-utilities|AWS Article} for an explanation of the build script
 */
import {build} from "esbuild"
import { mkdirSync } from "fs"
import {glob} from "glob"

const resolverFiles = await glob([`api/src/resolvers/*.ts`])
const lambdaFiles = await glob([`api/src/lambdas/*.ts`])
console.log('Resolvers are:',resolverFiles,'\nLambdas are:',lambdaFiles,'\nBuilding...')

await build({
    entryPoints: resolverFiles,
    sourcemap:'inline',
    sourcesContent: false,
    format:'esm',
    target:'esnext',
    platform:'node',
    external:['@aws-appsync/utils'],
    outdir:'api/build/resolvers',
    bundle:true
})


await lambdaFiles.forEach((file) => {
    
    let outdir = `api/build/lambdas/${file.split('/').pop().replace('.ts','')}`
    console.log('Building',file, 'to', outdir) 
    mkdirSync(outdir, {recursive:true})

    build({
        entryPoints: [file],
        sourcemap:'inline',
        sourcesContent: false,
        target: 'es2020',
        platform:'node',
        external:['@aws-appsync/utils', '@aws-sdk'],  
        outdir,
        bundle:true,
    })
})