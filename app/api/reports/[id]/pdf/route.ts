import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePdfBuffer, ReportData } from '@/lib/pdf/generate-pdf';
import { ScoredBikeResult, UserPreferences } from '@/lib/matching-engine/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    const { id } = params;

    const snapshot = await prisma.recommendationSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const shareUrl = `${protocol}://${host}/results/${id}`;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const reportNumber = `BikeForU_Report_${dateStr}_${id.slice(-6).toUpperCase()}`;

    const reportData: ReportData = {
      reportId: reportNumber,
      reportDate: new Date().toISOString(),
      shareUrl,
      userPrefs: snapshot.inputs as unknown as UserPreferences,
      results: snapshot.results as unknown as ScoredBikeResult[],
      datasetVersion: snapshot.datasetVersion,
      isRelaxed: snapshot.relaxed,
      relaxationMessage: snapshot.relaxationMessage || undefined,
    };

    const pdfBuffer = await generatePdfBuffer(reportData);
    const durationMs = Date.now() - startTime;
    const sizeKb = Math.round(pdfBuffer.length / 1024);

    // Save report record
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await prisma.report.create({
      data: {
        reportNumber,
        snapshotId: snapshot.id,
        status: 'completed',
        durationMs,
        sizeKb,
        expiresAt,
      },
    }).catch(() => {
      // ignore unique collision or write failure
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'PDF generation failed', details: err.message },
      { status: 500 }
    );
  }
}
