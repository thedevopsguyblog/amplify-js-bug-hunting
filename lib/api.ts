import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';

interface BackendStackProps extends cdk.StackProps {
  envVars: { [key: string]: string }
}

export class MysubAPI extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const PREFIX = props.envVars.RESOURCE_PREFIX;
    const AC = props.envVars.APP_CODE;

    const orgServiceDDB = cdk.Fn.importValue(`${PREFIX}${AC}OrgServiceDDB`)

    const userPoolIdImport = cdk.aws_ssm.StringParameter.fromStringParameterName(this, 'userPoolIdImport', `/${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}/userpoolid`)
    const userPoolClientIdImport = cdk.aws_ssm.StringParameter.fromStringParameterName(this, 'userPoolClientIdImport', `/${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}/userPoolClientId`)

    const importedUserPool = cdk.aws_cognito.UserPool.fromUserPoolId(this, 'importedUserPool', userPoolIdImport.stringValue)
    const importedUserPoolClient = cdk.aws_cognito.UserPoolClient.fromUserPoolClientId(this, 'userPoolClient', userPoolClientIdImport.stringValue)
    
    const imageUploadBucketImport = cdk.Fn.importValue(`${PREFIX}${AC}BucketName`)
    const importedBucketName = cdk.aws_s3.Bucket.fromBucketName(this, 'bucketName', imageUploadBucketImport)


    //API
    const api = new cdk.aws_appsync.GraphqlApi(this, 'Api', {
      name: `${PREFIX}${AC}-API`,
      definition: cdk.aws_appsync.Definition.fromFile(join('api/schema.graphql')),
      logConfig:{
        retention: cdk.aws_logs.RetentionDays.ONE_DAY,
        fieldLogLevel: cdk.aws_appsync.FieldLogLevel.ALL
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: cdk.aws_appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool:importedUserPool,
          }
        },
        additionalAuthorizationModes: [{
          authorizationType: cdk.aws_appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            name: 'watchlist-subscribers-key',
            description: 'API Key for watchlist subscribers mutation',
            expires: cdk.Expiration.after(cdk.Duration.days(30)), //TODO: automate the refresh of this key
          }
        }]
      }
    })

    const database = new cdk.aws_dynamodb.Table(this, 'datastore', {
      partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'orgid', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.envVars.REMOVALPOLICY as cdk.RemovalPolicy
    })

    const marketingTable = new cdk.aws_dynamodb.Table(this, 'MarketingTable', {
      partitionKey: { name: 'emailaddress', type: cdk.aws_dynamodb.AttributeType.STRING},
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.envVars.REMOVALPOLICY as cdk.RemovalPolicy
    });

    const orgDb = cdk.aws_dynamodb.Table.fromTableName(this, 'orgDb', orgServiceDDB)

    //NOTE:GSI's can't be edited - only deleted and then re-deployed
    database.addGlobalSecondaryIndex({
      indexName: 'user-requests',
      partitionKey: { name: 'requestor', type: cdk.aws_dynamodb.AttributeType.STRING }
    })

    database.addGlobalSecondaryIndex({
      indexName: 'org-requests',
      partitionKey: { name: 'orgid', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: cdk.aws_dynamodb.AttributeType.STRING },
    })
    
    const requestsDS = api.addDynamoDbDataSource('RequestsTableSource', database)
    const marketingTableDS = api.addDynamoDbDataSource('MarketingTable', marketingTable)
    const orgDS = api.addDynamoDbDataSource('OrgDetailsTable', orgDb)

    /* Re-deploying resolvers can cause issues - may need to delete the stack and redeploy it */

    api.createResolver('QueryGetRequestsByUser', {
      typeName: 'Query',
      fieldName: 'getRequestsByUser',
      dataSource: requestsDS,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/getRequestsByUser.js')),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });

    api.createResolver('QueryGetRequestsByOrg', {
      typeName: 'Query',
      fieldName: 'getRequestsByOrg',
      dataSource: requestsDS,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/getRequestsByOrg.js')),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });

    // We create the request in DDB and PUT images in S3
    const mutationCreateRequestFn = new cdk.aws_lambda.Function(this, 'MutationCreateRequestFn', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      description: 'Create a request in DDB and upload images to S3',
      handler: 'createRequest.handler',
      code: cdk.aws_lambda.Code.fromAsset(join('api/build/lambdas/createRequest')),
      environment: {
        TABLE_NAME: database.tableName,
        BUCKET_NAME: importedBucketName.bucketName,
      }
    })

    importedBucketName.grantReadWrite(mutationCreateRequestFn)
    database.grantWriteData(mutationCreateRequestFn)
    const mutationCreateRequestDS = api.addLambdaDataSource('mutationCreateRequestDS', mutationCreateRequestFn)

    api.createResolver('mutationCreateRequestResolver', {
      typeName: 'Mutation',
      fieldName: 'createRequest',
      dataSource: mutationCreateRequestDS,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/createRequest.js')),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });

    api.createResolver('queryGetOrg', {
      typeName: 'Query',
      fieldName: 'getOrganisationDetails',
      dataSource: orgDS,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/getOrg.js')),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });
    
    api.createResolver('MutationUpdateWatchlist', {
      typeName: 'Mutation',
      fieldName: 'updateWatchlist',
      dataSource: marketingTableDS,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/updateWatchlist.js')),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });

    // We are using a lambda function to update the request and send an email to the assignee so we need these 3x steps
    // 1. Define A Lambda function
    const updateReqLambda = new cdk.aws_lambda.Function(this, 'updateReqLambda', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      description: 'Update a request in the database and send an email to the assignee',
      handler: 'updateRequest.handler',
      code: cdk.aws_lambda.Code.fromAsset(join('api/build/lambdas/updateRequest')),
      environment: {
        TABLE_NAME: database.tableName,
        // TEMPLATENAME: `${props.envVars.RESOURCE_PREFIX}AssignmentTemplate`,
        // 'NOREPLAY_ADDRESS': `${props.envVars.emailIds[0]}@${props.envVars.FQDN}`,
        // 'SUPPORT_ADDRESS': `${props.envVars.emailIds[1]}@${props.envVars.FQDN}`,
        // 'SUBSCRIPTIONS_ADDRESS': `${props.envVars.emailIds[2]}@${props.envVars.FQDN}`,
      }
    })

    const policy = new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendTemplatedEmail'],
      resources: ['*'], // adjust this to limit the scope of the policy
    });

    updateReqLambda.addToRolePolicy(policy)
    database.grantWriteData(updateReqLambda)

    // 2. Define the Lambda as a DataSource
    const updateReqLambdaDS = api.addLambdaDataSource('updateRequestDS', updateReqLambda)

    // 3. Define a resolver - to invoke the lambda and pass the payload
    api.createResolver('MutationUpdateRequestResolver', {
      typeName: 'Mutation',
      fieldName: 'updateRequest',
      dataSource: updateReqLambdaDS,
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/updateRequest.js')),
    });

    //cfn Outputs
    new cdk.aws_ssm.StringParameter(this, `${props.envVars.RESOURCE_PREFIX}API_ID`, {
      stringValue: api.apiId,
      parameterName: `/${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}/api/id`,
      description: `${props.envVars.RESOURCE_PREFIX} API ID`
    })

    new cdk.aws_ssm.StringParameter(this, `${props.envVars.RESOURCE_PREFIX}API_URL`, {
      stringValue: api.graphqlUrl,
      parameterName: `/${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}/api/url`,
      description: `${props.envVars.RESOURCE_PREFIX} API URL`
    })

    new cdk.aws_ssm.StringParameter(this, `${props.envVars.RESOURCE_PREFIX}API_KEY`, {
      stringValue: api.apiKey!,
      parameterName: `/${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}/api/key`,
      description: `${props.envVars.RESOURCE_PREFIX} API Key`
    })

    new cdk.CfnOutput(this, `apiID`, {
      exportName: `${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}apiID`,
      value: api.apiId,
    })
    new cdk.CfnOutput(this, `endpoint`, {
      exportName: `${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}endpoint`,
      value: api.graphqlUrl,
    })

    new cdk.CfnOutput(this, `region`, {
      value: this.region,
    })

    new cdk.CfnOutput(this, `apiKey`, {
      exportName: `${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}apiKey`,
      value: api.apiKey!,
    })

    new cdk.CfnOutput(this, `defaultAuthMode`, {
      exportName: `${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}defaultAuthMode`,
      value: api.modes.toString(),
    })
  }
}