export default {
  options: {
    session: {
      // Set SESSION_SECRET in production. The fallback is for local and sandbox runs.
      secret: process.env.SESSION_SECRET || 'organo-ri-dev-only-secret'
    }
  }
};
