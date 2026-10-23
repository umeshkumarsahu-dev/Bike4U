import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const segment = searchParams.get('segment');

    const where: any = {};
    if (segment) {
      where.model = { segment };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { name: { contains: search, mode: 'insensitive' } } },
        { model: { brand: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const variants = await prisma.variant.findMany({
      where,
      include: {
        model: {
          include: { brand: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ variants });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandName,
      modelName,
      variantName,
      segment,
      bodyType = 'motorcycle',
      exShowroomPrice,
      araiMileage,
      evRange,
      primaryStyle,
      secondaryStyle,
      abs = 'none',
      discBrakes = false,
      digitalConsole = false,
      bluetooth = false,
      usbCharging = false,
      electricStart = true,
      ledHeadlamp = false,
      alloyWheels = false,
      tubelessTyres = false,
      heroImage,
    } = body;

    // Upsert Brand
    const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const brand = await prisma.brand.upsert({
      where: { slug: brandSlug },
      update: { name: brandName },
      create: { name: brandName, slug: brandSlug },
    });

    // Upsert Model
    const modelSlug = `${brandSlug}-${modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const model = await prisma.model.upsert({
      where: { slug: modelSlug },
      update: { segment, bodyType },
      create: {
        name: modelName,
        slug: modelSlug,
        brandId: brand.id,
        segment,
        bodyType,
      },
    });

    // Create or Update Variant
    const variantSlug = `${modelSlug}-${variantName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const variant = await prisma.variant.upsert({
      where: { slug: variantSlug },
      update: {
        name: variantName,
        exShowroomPrice: Number(exShowroomPrice),
        araiMileage: araiMileage ? Number(araiMileage) : null,
        evRange: evRange ? Number(evRange) : null,
        primaryStyle,
        secondaryStyle,
        abs,
        discBrakes: Boolean(discBrakes),
        digitalConsole: Boolean(digitalConsole),
        bluetooth: Boolean(bluetooth),
        usbCharging: Boolean(usbCharging),
        electricStart: Boolean(electricStart),
        ledHeadlamp: Boolean(ledHeadlamp),
        alloyWheels: Boolean(alloyWheels),
        tubelessTyres: Boolean(tubelessTyres),
        heroImage,
        lastVerifiedAt: new Date(),
      },
      create: {
        name: variantName,
        slug: variantSlug,
        modelId: model.id,
        exShowroomPrice: Number(exShowroomPrice),
        araiMileage: araiMileage ? Number(araiMileage) : null,
        evRange: evRange ? Number(evRange) : null,
        primaryStyle,
        secondaryStyle,
        abs,
        discBrakes: Boolean(discBrakes),
        digitalConsole: Boolean(digitalConsole),
        bluetooth: Boolean(bluetooth),
        usbCharging: Boolean(usbCharging),
        electricStart: Boolean(electricStart),
        ledHeadlamp: Boolean(ledHeadlamp),
        alloyWheels: Boolean(alloyWheels),
        tubelessTyres: Boolean(tubelessTyres),
        heroImage,
        lastVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, variant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
