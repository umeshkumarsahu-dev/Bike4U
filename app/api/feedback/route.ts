import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { snapshotId, helpful, reasonCode, comments } = await req.json();

    if (!snapshotId || helpful === undefined) {
      return NextResponse.json({ error: 'Missing snapshotId or helpful flag' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        snapshotId,
        helpful: Boolean(helpful),
        reasonCode: reasonCode || null,
        comments: comments || null,
      },
    });

    return NextResponse.json({ success: true, feedbackId: feedback.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
