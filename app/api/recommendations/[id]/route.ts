import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const snapshot = await prisma.recommendationSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      return NextResponse.json({ error: 'Recommendation snapshot not found' }, { status: 404 });
    }

    return NextResponse.json({
      snapshotId: snapshot.id,
      inputs: snapshot.inputs,
      results: snapshot.results,
      datasetVersion: snapshot.datasetVersion,
      isRelaxed: snapshot.relaxed,
      relaxationLevel: snapshot.relaxationLevel,
      relaxationMessage: snapshot.relaxationMessage,
      createdAt: snapshot.createdAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
