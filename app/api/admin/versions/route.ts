import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const versions = await prisma.datasetVersion.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    return NextResponse.json({ versions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, targetVersion } = await req.json();

    if (action === 'rollback' && targetVersion) {
      // Deactivate all
      await prisma.datasetVersion.updateMany({
        data: { isActive: false },
      });

      // Activate target
      const activated = await prisma.datasetVersion.update({
        where: { version: targetVersion },
        data: { isActive: true },
      });

      // Update variants datasetVersion tag to reflect rollback
      await prisma.variant.updateMany({
        where: { status: 'active' },
        data: { datasetVersion: targetVersion },
      });

      return NextResponse.json({ success: true, activeVersion: activated.version });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
