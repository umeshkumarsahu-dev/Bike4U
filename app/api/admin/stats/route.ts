import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalVariants = await prisma.variant.count();
    const activeVariants = await prisma.variant.count({ where: { status: 'active' } });

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const verifiedRecent = await prisma.variant.count({
      where: {
        lastVerifiedAt: { gte: sixtyDaysAgo },
        status: 'active',
      },
    });

    const staleRecords = activeVariants - verifiedRecent;
    const verifiedRate = activeVariants > 0 ? Math.round((verifiedRecent / activeVariants) * 100) : 100;

    const totalRecommendations = await prisma.recommendationSnapshot.count();
    const totalPdfReports = await prisma.report.count();
    const helpfulVotes = await prisma.feedback.count({ where: { helpful: true } });
    const totalVotes = await prisma.feedback.count();
    const helpfulnessRate = totalVotes > 0 ? Math.round((helpfulVotes / totalVotes) * 100) : 100;

    const activeVersion = await prisma.datasetVersion.findFirst({
      where: { isActive: true },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({
      totalVariants,
      activeVariants,
      verifiedRecent,
      staleRecords,
      verifiedRate,
      totalRecommendations,
      totalPdfReports,
      helpfulnessRate,
      activeDatasetVersion: activeVersion?.version || '1.0.0',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
