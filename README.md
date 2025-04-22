# RoliaScan (Turborepo)

This project is the successor to the original OpenMediaScan, rebuilt using a modern stack within a Turborepo monorepo structure.

## Status

Currently, there is no production-hosted version of RoliaScan available. Development is ongoing.

## Project Structure

This repository uses [Turborepo](https://turbo.build/repo) to manage the monorepo, which includes:

-   `apps/backend`: The fastify backend api.
-   `apps/frontend`: The Next.js frontend application.
-   `packages/`: Shared packages (e.g., UI components, configs, types). // Not using currently bc im dumb and didnt set it up correctly. PR is accepted.

## Backend

For detailed information about the backend API, services, database structure, and deployment, please refer to the [backend documentation](./apps/backend/docs/README.md).

## Frontend (Standalone)

If you wish to run or build the frontend application independently:

**Development Server:**

```bash
cd apps/frontend
npm install # or yarn install or pnpm install
npm run dev # or yarn dev or pnpm dev
```

**Build for Production:**

```bash
cd apps/frontend
npm install # or yarn install or pnpm install
npm run build # or yarn build or pnpm build
```

## Development with Turborepo

To run the entire application (backend and frontend) using Turborepo:

**Install Dependencies:**

From the root of the project:

```bash
npm install # or yarn install or pnpm install
```

**Run Development Servers:**

This command will start the development servers for both the backend and frontend concurrently.

```bash
turbo dev
or
npm run dev # or yarn dev or pnpm dev // Must be at the root 
```

**Build All Applications:**

This command will build all applications within the monorepo.

```bash
turbo build
or
npm run build # or yarn build or pnpm build // Must be at the root 
``` 
