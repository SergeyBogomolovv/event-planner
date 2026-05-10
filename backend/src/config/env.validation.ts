type Env = Record<string, string | undefined>;
type ValidatedEnv = {
  PORT: number;
  FRONTEND_ORIGIN: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  TYPEORM_SYNC: boolean;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  COOKIE_SECURE: boolean;
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
  MAIL_FROM: string;
  NODE_ENV: string;
};

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
  TYPEORM_SYNC: false,
  JWT_ACCESS_SECRET: 'dev-access-secret-change-me',
  JWT_REFRESH_SECRET: 'dev-refresh-secret-change-me',
  COOKIE_SECURE: false,
  MAIL_HOST: '',
  MAIL_PORT: 587,
  MAIL_USER: '',
  MAIL_PASSWORD: '',
  MAIL_FROM: '',
  NODE_ENV: 'development',
};

export function validateEnv(env: Env): ValidatedEnv {
  const validated: ValidatedEnv = {
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
    MAIL_HOST: env.MAIL_HOST ?? defaults.MAIL_HOST,
    MAIL_PORT: numberValue(env.MAIL_PORT, defaults.MAIL_PORT),
    MAIL_USER: env.MAIL_USER ?? defaults.MAIL_USER,
    MAIL_PASSWORD: env.MAIL_PASSWORD ?? defaults.MAIL_PASSWORD,
    MAIL_FROM: env.MAIL_FROM ?? defaults.MAIL_FROM,
    NODE_ENV: env.NODE_ENV ?? defaults.NODE_ENV,
  };

  assertProductionSecrets(validated);
  return validated;
}

function assertProductionSecrets(env: ValidatedEnv) {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  if (
    env.JWT_ACCESS_SECRET === defaults.JWT_ACCESS_SECRET ||
    env.JWT_REFRESH_SECRET === defaults.JWT_REFRESH_SECRET
  ) {
    throw new Error('JWT secrets must be configured in production');
  }

  if (env.COOKIE_SECURE !== true) {
    throw new Error('COOKIE_SECURE must be true in production');
  }
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
  if (!['true', 'false'].includes(value)) {
    throw new Error(`Expected boolean env value, got "${value}"`);
  }
  return value === 'true';
}
