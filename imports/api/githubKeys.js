import dotenv from 'dotenv';

dotenv.config({ silent: true });

export const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} = process.env;
