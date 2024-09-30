import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';

interface BackendStackProps extends cdk.StackProps {
  envVars: { [key: string]: string }
}

export class API extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const PREFIX = props.envVars.RESOURCE_PREFIX;
    const AC = props.envVars.APP_CODE;

    const userPoolIdImport = cdk.aws_ssm.StringParameter.fromStringParameterName(this, 'userPoolIdImport', `/${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}/userpoolid`)
    const userPoolClientIdImport = cdk.aws_ssm.StringParameter.fromStringParameterName(this, 'userPoolClientIdImport', `/${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}/userPoolClientId`)

    const importedUserPool = cdk.aws_cognito.UserPool.fromUserPoolId(this, 'importedUserPool', userPoolIdImport.stringValue)
    const importedUserPoolClient = cdk.aws_cognito.UserPoolClient.fromUserPoolClientId(this, 'userPoolClient', userPoolClientIdImport.stringValue)

    //API
    const api = new cdk.aws_appsync.GraphqlApi(this, 'Api', {
      name: `${PREFIX}${AC}-API`,
      definition: cdk.aws_appsync.Definition.fromFile(join('api/schema.gql')),
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
      }
    })

    const database = new cdk.aws_dynamodb.Table(this, 'datastore', {
      partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.envVars.REMOVALPOLICY as cdk.RemovalPolicy
    })
    
    const todoDS = api.addDynamoDbDataSource('RequestsTableSource', database)

    api.createResolver('createTodo', {
      typeName: 'Mutation',
      fieldName: 'createTodo',
      dataSource: todoDS,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/createTodo.js')),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
    });

    api.createResolver('listTodos', {
      typeName: 'Query',
      fieldName: 'listTodos',
      dataSource: todoDS,
      code: cdk.aws_appsync.Code.fromAsset(join('api/build/resolvers/listTodos.js')),
      runtime: cdk.aws_appsync.FunctionRuntime.JS_1_0_0,
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

    new cdk.CfnOutput(this, `defaultAuthMode`, {
      exportName: `${props.envVars.RESOURCE_PREFIX}${props.envVars.APP_CODE}defaultAuthMode`,
      value: api.modes.toString(),
    })
  }
}