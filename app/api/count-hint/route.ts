import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VehicleSegment } from '@prisma/client';
import { DEFAULT_CONFIG } from '@/lib/matching-engine/config';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const segment = searchParams.get('segment');
    const budgetMax = searchParams.get('budgetMax') ? parseInt(searchParams.get('budgetMax')!) : 2500000;

    const maxAllowedPrice = Math.round(budgetMax * DEFAULT_CONFIG.hardFilter.maxPriceToleranceRatio);

    const whereClause: any = {
      status: 'active',
      exShowroomPrice: { lte: maxAllowedPrice },
    };

    if (segment && segment !== 'Not sure') {
      if (segment === 'Electric') {
        whereClause.model = {
          bodyType: 'electric',
        };
      } else {
        const adjacent = DEFAULT_CONFIG.adjacentSegments[segment] || [];
        whereClause.model = {
          segment: { in: [segment, ...adjacent] },
          bodyType: { not: 'electric' },
        };
      }
    }

    const count = await prisma.variant.count({
      where: whereClause,
    });

    return NextResponse.json({
      count,
      segment: segment || 'all',
      maxBudget: budgetMax,
      message: count > 0 ? `${count} bike${count === 1 ? '' : 's'} fit your budget in this segment` : 'No bikes in this range. Try adjusting budget or segment.',
    });
  } catch (err: any) {
    return NextResponse.json({ count: 0, error: err.message }, { status: 500 });
  }
}
