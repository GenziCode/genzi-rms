import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
    env: {
      ACCESS_TOKEN: process.env.CYPRESS_ACCESS_TOKEN || '',
      TENANT: process.env.CYPRESS_TENANT || '',
    },
  },
  video: false,
  screenshotOnRunFailure: true,
});


