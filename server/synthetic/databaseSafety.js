/**
 * Database Safety & Target Validation Module
 *
 * Enforces strict, non-negotiable safety rules for synthetic data generation:
 * 1. Target database is strictly validated to be 'patel_tent_house'.
 * 2. Rejects any URI pointing to unauthorized, system (admin, local, config), or unintended databases.
 * 3. Never falls back to another database.
 * 4. Strictly forbids destructive operations (no dropDatabase, no dropCollection, no bulk wipes).
 */

const PERMITTED_TARGET_DATABASE = 'patel_tent_house';
const FORBIDDEN_DATABASE_NAMES = new Set([
  'admin',
  'local',
  'config',
  'test'
]);

class DatabaseSafetyError extends Error {
  constructor(message) {
    super(`[DATABASE SAFETY VIOLATION] ${message}`);
    this.name = 'DatabaseSafetyError';
  }
}

/**
 * Extracts and strictly validates the database name from a MongoDB connection string.
 * Supports standard mongodb:// and SRV mongodb+srv:// URIs.
 *
 * @param {string} uri
 * @returns {string} The validated database name
 */
function extractAndValidateDatabaseName(uri) {
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    throw new DatabaseSafetyError('No connection URI provided. MONGODB_URI or SYNTHETIC_MONGODB_URI must be configured.');
  }

  const trimmed = uri.trim();
  let parsed;
  try {
    // Handle both mongodb:// and mongodb+srv://
    parsed = new URL(trimmed.replace(/^mongodb\+srv:\/\//i, 'http://').replace(/^mongodb:\/\//i, 'http://'));
  } catch (err) {
    throw new DatabaseSafetyError(`Malformed MongoDB URI: ${err.message}`);
  }

  const dbName = decodeURIComponent(parsed.pathname.replace(/^\/+/, '').split('?')[0]);

  if (!dbName) {
    throw new DatabaseSafetyError(
      `URI does not specify a target database in the path. Target must explicitly be "${PERMITTED_TARGET_DATABASE}".`
    );
  }

  if (FORBIDDEN_DATABASE_NAMES.has(dbName.toLowerCase())) {
    throw new DatabaseSafetyError(
      `Connection blocked! Target database "${dbName}" is a forbidden system database.`
    );
  }

  if (dbName !== PERMITTED_TARGET_DATABASE) {
    throw new DatabaseSafetyError(
      `Target database "${dbName}" is not permitted. The only allowed database is "${PERMITTED_TARGET_DATABASE}".`
    );
  }

  return dbName;
}

/**
 * Validates the runtime environment before allowing any database connection.
 * @returns {{ uri: string, databaseName: string }}
 */
function validateSyntheticEnvironment() {
  const uri = process.env.SYNTHETIC_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new DatabaseSafetyError(
      'Neither SYNTHETIC_MONGODB_URI nor MONGODB_URI is set. Refusing to connect to any database.'
    );
  }

  const databaseName = extractAndValidateDatabaseName(uri);
  return { uri, databaseName };
}

/**
 * Verifies that the connected Mongoose instance matches the permitted target.
 * @param {import('mongoose')} mongooseInstance
 */
function assertSafeActiveConnection(mongooseInstance) {
  const connectedDb = mongooseInstance.connection.name;
  if (connectedDb !== PERMITTED_TARGET_DATABASE) {
    throw new DatabaseSafetyError(
      `Active Mongoose connection database "${connectedDb}" does not match required "${PERMITTED_TARGET_DATABASE}". Aborting.`
    );
  }
}

module.exports = {
  PERMITTED_TARGET_DATABASE,
  FORBIDDEN_DATABASE_NAMES,
  DatabaseSafetyError,
  extractAndValidateDatabaseName,
  validateSyntheticEnvironment,
  assertSafeActiveConnection
};
