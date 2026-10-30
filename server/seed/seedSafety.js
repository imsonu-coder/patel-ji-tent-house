const SAFE_DATABASE_NAME = 'patel_tent_house_dev';
const SAFE_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1']);

class SeedSafetyError extends Error {}

function assertSafeSeedTarget() {
  if (process.env.NODE_ENV === 'production') {
    throw new SeedSafetyError('Seeding is disabled when NODE_ENV=production.');
  }
  if (process.env.SEED_ENV !== 'development') {
    throw new SeedSafetyError('Set SEED_ENV=development to explicitly enable the development seeder.');
  }
  if (process.env.SEED_DATABASE_NAME !== SAFE_DATABASE_NAME) {
    throw new SeedSafetyError(`Set SEED_DATABASE_NAME=${SAFE_DATABASE_NAME}; other database targets are not permitted.`);
  }
  if (process.env.MONGODB_MODE !== 'mongodb') {
    throw new SeedSafetyError('Set MONGODB_MODE=mongodb and use the explicitly approved local development database.');
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new SeedSafetyError('MONGODB_URI must point to the approved local development database.');
  }

  let parsedUri;
  let databaseName;
  try {
    parsedUri = new URL(mongoUri);
    databaseName = decodeURIComponent(parsedUri.pathname.replace(/^\/+/, ''));
  } catch {
    throw new SeedSafetyError('MONGODB_URI must be a valid URI for the approved local development database.');
  }

  if (
    parsedUri.protocol !== 'mongodb:' ||
    !SAFE_DATABASE_HOSTS.has(parsedUri.hostname) ||
    databaseName !== SAFE_DATABASE_NAME
  ) {
    throw new SeedSafetyError(
      `The seeder only permits mongodb://localhost or 127.0.0.1 targeting ${SAFE_DATABASE_NAME}.`
    );
  }
}

function assertConnectedSeedTarget(mongoose) {
  if (
    mongoose.connection.name !== SAFE_DATABASE_NAME ||
    !SAFE_DATABASE_HOSTS.has(mongoose.connection.host)
  ) {
    throw new SeedSafetyError('Connected database does not match the approved local development target.');
  }
}

module.exports = {
  SAFE_DATABASE_NAME,
  SeedSafetyError,
  assertSafeSeedTarget,
  assertConnectedSeedTarget
};
