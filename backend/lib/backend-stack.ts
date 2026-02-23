import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'CommentTable', {
      partitionKey: { name: 'video_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'playback_time_ms', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 個人開発用: スタック削除時にテーブルも削除
    });

    // Lambda Function
    const commentHandler = new lambda_nodejs.NodejsFunction(this, 'CommentHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/comment.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant Lambda permissions to read/write DynamoDB
    table.grantReadWriteData(commentHandler);

    // Lambda Function URL
    const fnUrl = commentHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // 公開アクセス (必要に応じて後で制限)
      cors: {
        allowedOrigins: ['*'], // 開発用
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['Content-Type'],
      },
    });

    // Output the URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: fnUrl.url,
    });
  }
}
