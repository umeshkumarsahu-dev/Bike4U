import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCachedJson, setCachedJson } from '@/lib/redis';
import { getRecommendations } from '@/lib/matching-engine/engine';
import { BikeCandidate, UserPreferences, VehicleSegment } from '@/lib/matching-engine/types';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    let {
      segment = 'Commuter',
      budgetMin = 30000,
      budgetMax = 2500000,
      styles = [],
      mileageMin = undefined,
      features = [],
    } = body;

    // Normalize & validate
    budgetMin = Number(budgetMin) || 30000;
    budgetMax = Number(budgetMax) || 2500000;

    // Auto-correct swapped budget values
    if (budgetMin > budgetMax) {
      const temp = budgetMin;
      budgetMin = budgetMax;
      budgetMax = temp;
    }

    // Ensure minimum gap of 20,000 as per FR-105
    if (budgetMax - budgetMin < 20000) {
      budgetMax = budgetMin + 20000;
    }

    if (mileageMin !== undefined && mileageMin !== null) {
      mileageMin = Number(mileageMin);
      if (isNaN(mileageMin) || mileageMin <= 0) mileageMin = undefined;
    }

    const userPrefs: UserPreferences = {
      segment: segment as VehicleSegment,
      budgetMin,
      budgetMax,
      styles: Array.isArray(styles) ? styles : [],
      mileageMin,
      features: Array.isArray(features) ? features : [],
    };

    // Cache key based on hashed inputs and latest dataset version
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(userPrefs))
      .digest('hex')
      .substring(0, 16);

    const cacheKey = `rec:${hash}`;
    const cachedResponse = await getCachedJson<any>(cacheKey);

    if (cachedResponse) {
      return NextResponse.json({
        ...cachedResponse,
        fromCache: true,
        latencyMs: Date.now() - startTime,
      });
    }

    // Query active variants from PostgreSQL
    const variants = await prisma.variant.findMany({
      where: {
        status: 'active',
      },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
      },
    });

    // Map to BikeCandidate
    const candidates: BikeCandidate[] = variants.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      modelYear: v.modelYear,
      status: v.status as any,
      modelId: v.modelId,
      modelName: v.model.name,
      modelSlug: v.model.slug,
      brandId: v.model.brand.id,
      brandName: v.model.brand.name,
      segment: v.model.segment as any,
      bodyType: v.model.bodyType as any,
      exShowroomPrice: v.exShowroomPrice,
      referenceCity: v.referenceCity,
      priceEffectiveDate: v.priceEffectiveDate,
      araiMileage: v.araiMileage,
      realWorldMileage: v.realWorldMileage,
      evRange: v.evRange,
      batteryCapacity: v.batteryCapacity,
      chargingTime: v.chargingTime,
      engineCc: v.engineCc,
      maxPower: v.maxPower,
      maxTorque: v.maxTorque,
      gearbox: v.gearbox,
      topSpeed: v.topSpeed,
      motorPower: v.motorPower,
      primaryStyle: v.primaryStyle,
      secondaryStyle: v.secondaryStyle,
      abs: v.abs as any,
      discBrakes: v.discBrakes,
      digitalConsole: v.digitalConsole,
      bluetooth: v.bluetooth,
      usbCharging: v.usbCharging,
      electricStart: v.electricStart,
      ledHeadlamp: v.ledHeadlamp,
      alloyWheels: v.alloyWheels,
      tubelessTyres: v.tubelessTyres,
      kerbWeight: v.kerbWeight,
      seatHeight: v.seatHeight,
      groundClearance: v.groundClearance,
      fuelTankCapacity: v.fuelTankCapacity,
      heroImage: v.heroImage,
      gallery: v.gallery,
      brochureUrl: v.brochureUrl,
      colors: v.colors,
      lastVerifiedAt: v.lastVerifiedAt,
      datasetVersion: v.datasetVersion,
    }));

    // Run deterministic matching engine
    const output = getRecommendations(candidates, userPrefs);

    // Persist RecommendationSnapshot in PostgreSQL (FR-203, FR-307)
    const snapshot = await prisma.recommendationSnapshot.create({
      data: {
        datasetVersion: output.datasetVersion,
        inputs: userPrefs as any,
        results: output.results as any,
        relaxed: output.isRelaxed,
        relaxationLevel: output.relaxationLevel,
        relaxationMessage: output.relaxationMessage,
        totalCandidates: output.totalActiveEvaluated,
        passedHardFilters: output.candidatesPassedHardFilter,
      },
    });

    const responsePayload = {
      snapshotId: snapshot.id,
      results: output.results,
      datasetVersion: output.datasetVersion,
      isRelaxed: output.isRelaxed,
      relaxationLevel: output.relaxationLevel,
      relaxationMessage: output.relaxationMessage,
      totalActiveEvaluated: output.totalActiveEvaluated,
      candidatesPassedHardFilter: output.candidatesPassedHardFilter,
      unlockHint: output.unlockHint,
      inputs: userPrefs,
      createdAt: snapshot.createdAt,
    };

    // Cache in Redis for fast repeated requests (1 hour TTL)
    await setCachedJson(cacheKey, responsePayload, 3600);

    return NextResponse.json({
      ...responsePayload,
      fromCache: false,
      latencyMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Recommendation API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute recommendations', details: error.message },
      { status: 500 }
    );
  }
}
