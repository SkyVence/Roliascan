# Deployment

This section covers different ways to deploy the backend service.

Choose the method that best suits your infrastructure and requirements:

*   **[Docker](./docker.md):** Recommended for containerized environments. Provides consistency and isolation using Docker and Docker Compose.
*   **[Bare Metal](./baremetal.md):** Suitable for deploying directly onto a virtual machine or physical server using process managers like PM2 and a reverse proxy like Nginx.
*   **[Serverless](./serverless.md):** For deploying as scalable functions on platforms like AWS Lambda or Google Cloud Functions (requires significant adaptation). 