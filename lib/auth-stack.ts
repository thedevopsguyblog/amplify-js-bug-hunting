import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface AuthStackProps extends cdk.StackProps {
  enVars: { [key: string]: string }
}

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const PREFIX = props.enVars.RESOURCE_PREFIX;
    const AC = props.enVars.APP_CODE;

    /* Authentication */
    const userPool = new cdk.aws_cognito.UserPool(this, 'userPool', {
      userPoolName: `${props.enVars.RESOURCE_PREFIX}${AC}-auth`,
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true }
      },
      removalPolicy: props.enVars.REMOVALPOLICY as cdk.RemovalPolicy,
      customAttributes: {
        orgName: new cdk.aws_cognito.StringAttribute({ mutable: true }),
        orgId: new cdk.aws_cognito.StringAttribute({ mutable: true })
      }
    })

    const userPoolDomainName = userPool.addDomain(`${PREFIX}DomainName`, {
      cognitoDomain:{
        domainPrefix: `${PREFIX}`.toLocaleLowerCase()
      }
    })

    const userPoolClient = userPool.addClient(`${PREFIX}userPoolClient`, {
      userPoolClientName: `${PREFIX}${AC}webclient`,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cdk.aws_cognito.OAuthScope.PROFILE,
          cdk.aws_cognito.OAuthScope.EMAIL,
          cdk.aws_cognito.OAuthScope.OPENID,
          cdk.aws_cognito.OAuthScope.PHONE,
        ],
        callbackUrls: props.enVars.CALLBACK_URL.split(',') as string[],
        logoutUrls: props.enVars.LOGOUT_URL.split(',') as string[],
      },
      supportedIdentityProviders: [
        cdk.aws_cognito.UserPoolClientIdentityProvider.COGNITO,
        cdk.aws_cognito.UserPoolClientIdentityProvider.GOOGLE,
      ]
    })

    const identityPool = new cdk.aws_cognito.CfnIdentityPool(this, 'identityPool', {
      identityPoolName: `${PREFIX}${AC}identityPool`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: userPoolClient.userPoolClientId,
        providerName: userPool.userPoolProviderName,
      }],
    })

    identityPool.node.addDependency(userPoolClient)

    const authedRole = new cdk.aws_iam.Role(this, 'authedRole', {
      description: `${PREFIX}${AC} Default role for all authenticated users`,
      assumedBy: new cdk.aws_iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AWSAppSyncInvokeFullAccess'),
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
      ]
    });

    new cdk.aws_cognito.CfnIdentityPoolRoleAttachment(this, 'idpRoleAttachment', {
      identityPoolId: identityPool.attrId,
      roles: {
        authenticated: authedRole.roleArn,
      },
      roleMappings: {
        mapping: {
          type: 'Token',
          ambiguousRoleResolution: 'AuthenticatedRole',
          identityProvider: `cognito-idp.${cdk.Stack.of(this).region
          }.amazonaws.com/${userPool.userPoolId}:${userPoolClient.userPoolClientId
          }`,
        },
      },
    },
    );

    /* SSM Outputs */
    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthUserPoolId`, {
      stringValue: userPool.userPoolId,
      parameterName: `/${PREFIX}${AC}/userpoolid`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthUserPoolDomainName`, {
      stringValue: `${userPoolDomainName.domainName}.auth.${this.region}.amazoncognito.com`,
      parameterName: `/${PREFIX}${AC}/userPoolDomainName`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthUserPoolDomainNameRedirect`, {
      stringValue: `https://${userPoolDomainName.domainName}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
      parameterName: `/${PREFIX}${AC}/userPoolDomainNameRedirect`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthUserPoolClientId`, {
      stringValue: `${userPoolClient.userPoolClientId}`,
      parameterName: `/${PREFIX}${AC}/userPoolClientId`
    })

    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}AuthIdentityPoolId`, {
      stringValue: `${identityPool.attrId}`,
      parameterName: `/${PREFIX}${AC}/identityPoolId`
    })
    
    new cdk.aws_ssm.StringParameter(this, `${PREFIX}${AC}authedRole`, {
      stringValue: `${authedRole.roleArn}`,
      parameterName: `/${PREFIX}${AC}/authedRole`
    })

    /* CfnOutputs used by frontend Project */
    new cdk.CfnOutput(this, `userPoolId`, {
      value: userPool.userPoolId,
    })
    new cdk.CfnOutput(this, `userPoolDomainName`, {
      value: `${userPoolDomainName.domainName}.auth.${this.region}.amazoncognito.com`,
    })
    new cdk.CfnOutput(this, `userPoolDomainNameRedirect`, {
      value: `https://${userPoolDomainName.domainName}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
    })
    new cdk.CfnOutput(this, `userPoolClientId`, {
      value: userPoolClient.userPoolClientId
    })
    new cdk.CfnOutput(this, `identityPoolId`, {
      value: identityPool.attrId
    })
  }
}