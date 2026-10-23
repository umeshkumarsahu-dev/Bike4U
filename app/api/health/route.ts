import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    let dbStatus = 'ok';
    let redisStatus = 'ok';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e: any) {
      dbStatus = `error: ${e.message}`;
    }

    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.ping();
      } else {
        redisStatus = 'in-memory-fallback';
      }
    } catch (e: any) {
      redisStatus = `error: ${e.message}`;
    }

    const isHealthy = dbStatus === 'ok';

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        redis: redisStatus,
        version: '1.0.0',
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}
