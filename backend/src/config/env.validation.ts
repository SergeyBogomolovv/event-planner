type Env = Record<string, string | undefined>;

const defaults = {
  PORT: 3000,
  FRONTEND_ORIGIN: 'http://localhost:3001',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: 5432,
  POSTGRES_USER: 'event_planner',
  POSTGRES_PASSWORD: 'event_planner',
  POSTGRES_DB: 'event_planner',
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
  TYPEORM_SYNC: true,
  JWT_ACCESS_SECRET: 'dev-access-secret-change-me',
  JWT_REFRESH_SECRET: 'dev-refresh-secret-change-me',
  COOKIE_SECURE: false,
};

export function validateEnv(env: Env) {
  return {
    PORT: numberValue(env.PORT, defaults.PORT),
    FRONTEND_ORIGIN: env.FRONTEND_ORIGIN ?? defaults.FRONTEND_ORIGIN,
    POSTGRES_HOST: env.POSTGRES_HOST ?? defaults.POSTGRES_HOST,
    POSTGRES_PORT: numberValue(env.POSTGRES_PORT, defaults.POSTGRES_PORT),
    POSTGRES_USER: env.POSTGRES_USER ?? defaults.POSTGRES_USER,
    POSTGRES_PASSWORD: env.POSTGRES_PASSWORD ?? defaults.POSTGRES_PASSWORD,
    POSTGRES_DB: env.POSTGRES_DB ?? defaults.POSTGRES_DB,
    REDIS_HOST: env.REDIS_HOST ?? defaults.REDIS_HOST,
    REDIS_PORT: numberValue(env.REDIS_PORT, defaults.REDIS_PORT),
    TYPEORM_SYNC: booleanValue(env.TYPEORM_SYNC, defaults.TYPEORM_SYNC),
    JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET ?? defaults.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET ?? defaults.JWT_REFRESH_SECRET,
    COOKIE_SECURE: booleanValue(env.COOKIE_SECURE, defaults.COOKIE_SECURE),
  };
}

function numberValue(value: string | undefined, fallback: number) {
  if (value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected numeric env value, got "${value}"`);
  }
  return parsed;
}

function booleanValue(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === '') {
    return fallback;
  }
  return value === 'true';
}
