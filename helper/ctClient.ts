import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import { ClientBuilder, HttpMiddlewareOptions } from "@commercetools/sdk-client-v2";

export const getClient = async () => {
    const projectKey = `${process.env.CTP_PROJECT_KEY}`;
    // Create a httpMiddleware for the your project AUTH URL
    const authMiddleware: any = {
        host: `${process.env.CTP_AUTH_URL}`,
        projectKey: `${process.env.CTP_PROJECT_KEY}`,
        credentials: {
            clientId: `${process.env.CTP_CLIENT_ID}`,
            clientSecret: `${process.env.CTP_CLIENT_SECRET}`,
        },
        scopes: [`${process.env.CTP_SCOPES}`],
        httpClient: fetch,
    };

    // Create a httpMiddleware for the your project API URL
    const httpMiddleware: HttpMiddlewareOptions = {
        host: `${process.env.CTP_API_URL}`,
    };

    const ctpClient = new ClientBuilder()
        .withProjectKey(projectKey) // .withProjectKey() is not required if the projectKey is included in authMiddlewareOptions
        .withClientCredentialsFlow(authMiddleware)
        .withHttpMiddleware(httpMiddleware)
        .withLoggerMiddleware() // Include middleware for logging
        .build();

    const apiRoot = createApiBuilderFromCtpClient(ctpClient)
        .withProjectKey({ projectKey: projectKey });
    return apiRoot;
}