# Serverless Deployment

This document outlines considerations and potential steps for deploying the backend service to a serverless environment like AWS Lambda, Google Cloud Functions, or Azure Functions.

*Note: The current setup using Fastify and automatic database migrations on startup might require adjustments for a standard serverless deployment model.*

## Key Considerations

1.  **Framework Compatibility:**
    *   Fastify can be adapted for serverless functions, often using wrapper libraries like `aws-lambda-fastify` or equivalent for other platforms.
    *   Alternatively, the core service logic could be extracted and used directly within function handlers, potentially bypassing Fastify for simpler API Gateway integrations.

2.  **Database Connections:**
    *   Serverless functions can struggle with traditional database connection pooling due to their ephemeral nature.
    *   Solutions like **RDS Proxy (AWS)**, **Cloud SQL Auth Proxy (GCP)**, or serverless-aware database services (e.g., **Neon**, **PlanetScale**, **Aurora Serverless**) are often necessary to manage connections efficiently and prevent exhaustion.
    *   Connection logic in `src/db.ts` would need modification to use these proxies or drivers.

3.  **Migrations:**
    *   Running database migrations automatically on function startup is generally not recommended in serverless environments.
    *   Migrations should typically be run as a separate step in a CI/CD pipeline *before* deploying the new function code.
    *   The `migrate(...)` call in `src/server.ts` should be removed or conditionally executed outside the main function handler path.

4.  **File Uploads (`UPLOAD_METHOD=server`):**
    *   Storing uploads directly on the serverless function's temporary filesystem is not viable for persistent storage.
    *   If using `UPLOAD_METHOD=server`, the logic in `services/upload.ts` must be changed to upload directly to a cloud storage service (e.g., AWS S3, Google Cloud Storage).
    *   Alternatively, using `UPLOAD_METHOD=cdn` with UploadThing might be a more natural fit for serverless, offloading the upload processing.

5.  **Configuration:**
    *   Environment variables (`DATABASE_URL`, `JWT_SECRET`, etc.) need to be configured within the serverless platform's function settings.
    *   Loading from `.env` files is not applicable in deployed functions.

6.  **Deployment Packaging:**
    *   The deployment package needs to include the built JavaScript code (`dist` folder), production `node_modules`, and potentially other necessary files.
    *   Serverless framework tools (Serverless Framework, AWS SAM, Terraform) can help manage packaging and deployment.

## Example Steps (Conceptual - AWS Lambda with Serverless Framework)

1.  **Install Dependencies:** `npm install --save-dev serverless serverless-offline aws-lambda-fastify serverless-dotenv-plugin`
2.  **Configure `serverless.yml`:** Define the function, API Gateway trigger, environment variables, and potentially database proxy settings.
    ```yaml
    service: roliascan-backend
    frameworkVersion: '3'

    provider:
      name: aws
      runtime: nodejs20.x
      region: us-east-1 # Your region
      environment:
        DATABASE_URL: ${env:DATABASE_URL} # Loaded via serverless-dotenv-plugin or directly
        JWT_SECRET: ${env:JWT_SECRET}
        # ... other env vars

    plugins:
      - serverless-offline
      - serverless-dotenv-plugin # For local development with .env

    functions:
      api:
        handler: src/lambda.handler # Path to the handler file
        events:
          - httpApi: '*' # Catch-all API Gateway trigger

    # Add VPC/Subnet/SecurityGroup config if needed for DB access
    # Add RDS Proxy config if using
    ```
3.  **Create Lambda Handler (`src/lambda.ts`):** Wrap the Fastify app.
    ```typescript
    import awsLambdaFastify from 'aws-lambda-fastify';
    import { build } from './index'; // Assuming index.ts exports a build function

    // Initialize Fastify app (ensure migrations don't run here)
    const app = build(); 
    const proxy = awsLambdaFastify(app);

    // Export the handler for Lambda
    export const handler = proxy;
    ```
4.  **Adapt `src/index.ts` or `src/server.ts`:** Create an exported `build` function that sets up Fastify *without* running migrations or listening.
5.  **Adapt `src/db.ts`:** Modify connection logic for RDS Proxy or serverless driver if needed.
6.  **Adapt `services/upload.ts`:** If using `UPLOAD_METHOD=server`, rewrite to use AWS S3 SDK.
7.  **Deployment:**
    *   Run migrations via CI/CD.
    *   Deploy using `serverless deploy`.

This provides a high-level overview. The specific implementation details will vary significantly based on the chosen cloud provider and specific services used. 