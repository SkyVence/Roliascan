import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface EnvironmentVariables {
  JWT_SECRET: string;
  // Add other environment variables here as needed
}

function getEnvVariable(key: keyof EnvironmentVariables, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const config: EnvironmentVariables = {
  JWT_SECRET: getEnvVariable('JWT_SECRET'),
  // Initialize other variables here
};

// You can perform more complex validation here if needed
if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
  // You might want a more specific check depending on your secret complexity requirements
  console.warn('WARNING: JWT_SECRET is missing or too short. Please provide a strong secret in your .env file.');
  // Depending on your application's needs, you might want to throw an error here instead of just warning
  // throw new Error('JWT_SECRET is missing or insecure.');
} 