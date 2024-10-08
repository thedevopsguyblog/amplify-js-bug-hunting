import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

interface BucketStackProps extends cdk.StackProps {
	enVars: { [key: string]: string };
}

export class Bucket extends cdk.Stack {
	constructor(scope: Construct, id: string, props: BucketStackProps) {
		super(scope, id, props);

		const PREFIX = props.enVars.RESOURCE_PREFIX;
        const AC = props.enVars.APP_CODE;

		const FQDN = props.enVars.FQDN
		const authedRoleArn = cdk.aws_ssm.StringParameter.valueForStringParameter(this, `/${PREFIX}${AC}/authedRole`)

		const bucket = new cdk.aws_s3.Bucket(this, `${PREFIX}${AC}-objectStore`, {
			bucketName: `${PREFIX}${AC}-objectStore`.toLowerCase(),
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
			cors:[{
				allowedMethods: [
					cdk.aws_s3.HttpMethods.GET,
					cdk.aws_s3.HttpMethods.HEAD,
					cdk.aws_s3.HttpMethods.PUT,
					cdk.aws_s3.HttpMethods.POST,
					cdk.aws_s3.HttpMethods.DELETE
				],
				allowedOrigins: PREFIX === 'P' ? [`https://${FQDN}`] : [`https://${FQDN}`, 'http://localhost:3000*'],
				allowedHeaders: ['*'],
				exposedHeaders: [
					'x-amz-server-side-encryption',
					'x-amz-request-id',
					'x-amz-id-2',
					'ETag',
				],
			}]
		})

		const authedRoleImport = cdk.aws_iam.Role.fromRoleArn(this, `AuthedIdentityPoolRole_${PREFIX}_${AC}`, authedRoleArn)

		bucket.grantReadWrite(authedRoleImport)

		new cdk.CfnOutput(this, 'BucketName', {
			value: bucket.bucketName,
			description: 'The name of the bucket',
			exportName: `${PREFIX}${AC}BucketName`
		})

		new cdk.CfnOutput(this, 'BucketRegion', {
			value: this.region,
			description: 'The region of the bucket',
			exportName: `${PREFIX}${AC}BucketRegion`
		})

	}
}