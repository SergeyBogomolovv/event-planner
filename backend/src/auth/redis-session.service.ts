import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisSessionService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis({
      host: config.get<string>('REDIS_HOST'),
      port: config.get<number>('REDIS_PORT'),
    });
  }

  setRefreshSession(userId: string, token: string, ttlSeconds: number) {
    return this.redis.set(this.key(userId), token, 'EX', ttlSeconds);
  }

  getRefreshSession(userId: string) {
    return this.redis.get(this.key(userId));
  }

  async deleteRefreshSession(userId: string) {
    await this.redis.del(this.key(userId));
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  private key(userId: string) {
    return `refresh-session:${userId}`;
  }
}
