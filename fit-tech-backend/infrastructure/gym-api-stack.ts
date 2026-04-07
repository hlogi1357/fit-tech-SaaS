import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Runtime, Code, Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";

export class GymApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const gymApiHandler = new LambdaFunction(this, "GymApiHandler", {
      runtime: Runtime.NODEJS_20_X,
      handler: "lambda.handler",
      code: Code.fromAsset("dist-lambda"),
      timeout: Duration.seconds(10),
      memorySize: 512,
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
      },
    });

    const api = new RestApi(this, "GymApi", {
      restApiName: "fit-tech-gym-api",
      deployOptions: {
        stageName: "prod",
      },
    });

    // Proxy-style routing so Fastify can handle /gyms/* and /health internally.
    api.root.addProxy({
      defaultIntegration: new LambdaIntegration(gymApiHandler),
      anyMethod: true,
    });
  }
}
