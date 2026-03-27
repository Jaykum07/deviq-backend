const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_EXPIRE',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRE',
  ];
  
  const validateEnv = () => {
    const missing = requiredEnvVars.filter((key) => !process.env[key]);
  
    if (missing.length > 0) {
      console.error('Missing required environment variables:');
      missing.forEach((key) => console.error(`   - ${key}`));
      console.error('Check your .env file');
      process.exit(1);
    }
  
    console.log('Environment variables validated');
  };
  
  module.exports = validateEnv;