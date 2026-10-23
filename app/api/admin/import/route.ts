import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

interface CsvRow {
  brand: string;
  model: string;
  variant: string;
  segment: string;
  price: string;
  mileage?: string;
  range?: string;
  primary_style: string;
  abs?: string;
  disc_brakes?: string;
  digital_console?: string;
  bluetooth?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { csvContent, mode = 'preview' } = await req.json();

    if (!csvContent) {
      return NextResponse.json({ error: 'Missing CSV content' }, { status: 400 });
    }

    const parsed = Papa.parse<CsvRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'),
    });

    const errors: { row: number; field: string; message: string }[] = [];
    const diffs: {
      action: 'insert' | 'update';
      key: string;
      brand: string;
      model: string;
      variant: string;
      oldPrice?: number;
      newPrice: number;
      priceChangePct?: number;
      isOutlier?: boolean;
    }[] = [];

    // Validation & diff preparation
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const rowIdx = i + 2; // header is row 1

      if (!row.brand) errors.push({ row: rowIdx, field: 'brand', message: 'Brand is required' });
      if (!row.model) errors.push({ row: rowIdx, field: 'model', message: 'Model is required' });
      if (!row.variant) errors.push({ row: rowIdx, field: 'variant', message: 'Variant is required' });
      if (!row.segment) errors.push({ row: rowIdx, field: 'segment', message: 'Segment is required' });

      const price = parseInt(row.price);
      if (isNaN(price) || price < 30000 || price > 2500000) {
        errors.push({ row: rowIdx, field: 'price', message: 'Price must be between 30,000 and 25,00,000' });
        continue;
      }

      // Check existing in DB
      const brandSlug = row.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const modelSlug = `${brandSlug}-${row.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const variantSlug = `${modelSlug}-${row.variant.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      const existing = await prisma.variant.findUnique({
        where: { slug: variantSlug },
      });

      if (!existing) {
        diffs.push({
          action: 'insert',
          key: variantSlug,
          brand: row.brand,
          model: row.model,
          variant: row.variant,
          newPrice: price,
        });
      } else {
        const oldPrice = existing.exShowroomPrice;
        const changePct = Math.round(((price - oldPrice) / oldPrice) * 100);
        const isOutlier = Math.abs(changePct) > 15;

        diffs.push({
          action: 'update',
          key: variantSlug,
          brand: row.brand,
          model: row.model,
          variant: row.variant,
          oldPrice,
          newPrice: price,
          priceChangePct: changePct,
          isOutlier,
        });
      }
    }

    if (mode === 'preview') {
      return NextResponse.json({
        mode: 'preview',
        totalRows: parsed.data.length,
        diffs,
        errors,
        isValid: errors.length === 0,
      });
    }

    // Publish mode
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Cannot publish CSV with validation errors', errors },
        { status: 400 }
      );
    }

    // Create a new dataset version
    const versionCount = await prisma.datasetVersion.count();
    const newVersionTag = `1.${versionCount}.0`;

    // Deactivate previous active version
    await prisma.datasetVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const newDatasetVersion = await prisma.datasetVersion.create({
      data: {
        version: newVersionTag,
        notes: `Bulk CSV import on ${new Date().toLocaleDateString('en-IN')}`,
        recordCount: parsed.data.length,
        isActive: true,
        publishedBy: 'Admin via CSV Import',
      },
    });

    // Apply rows
    for (const row of parsed.data) {
      const brandSlug = row.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        update: { name: row.brand },
        create: { name: row.brand, slug: brandSlug },
      });

      const modelSlug = `${brandSlug}-${row.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const isEv = row.segment.toLowerCase() === 'electric';
      const model = await prisma.model.upsert({
        where: { slug: modelSlug },
        update: { segment: row.segment as any },
        create: {
          name: row.model,
          slug: modelSlug,
          brandId: brand.id,
          segment: row.segment as any,
          bodyType: isEv ? 'electric' : 'motorcycle',
        },
      });

      const variantSlug = `${modelSlug}-${row.variant.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const price = parseInt(row.price);

      await prisma.variant.upsert({
        where: { slug: variantSlug },
        update: {
          name: row.variant,
          exShowroomPrice: price,
          araiMileage: row.mileage ? parseFloat(row.mileage) : null,
          evRange: row.range ? parseFloat(row.range) : null,
          primaryStyle: row.primary_style || 'Sporty',
          datasetVersion: newDatasetVersion.version,
          lastVerifiedAt: new Date(),
        },
        create: {
          name: row.variant,
          slug: variantSlug,
          modelId: model.id,
          exShowroomPrice: price,
          araiMileage: row.mileage ? parseFloat(row.mileage) : null,
          evRange: row.range ? parseFloat(row.range) : null,
          primaryStyle: row.primary_style || 'Sporty',
          datasetVersion: newDatasetVersion.version,
          lastVerifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      mode: 'publish',
      publishedVersion: newDatasetVersion.version,
      recordsUpdatedOrCreated: parsed.data.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
