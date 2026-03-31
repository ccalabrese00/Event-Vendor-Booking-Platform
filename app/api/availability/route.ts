import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET - Get vendor's availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const availability = await prisma.availability.findMany({
      where: { vendorId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Availability fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add availability slot (vendor only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, isAvailable = true, note } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const availability = await prisma.availability.create({
      data: {
        vendorId: session.user.id,
        date: new Date(date),
        isAvailable,
        note,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    console.error('Availability creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update availability slot
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isAvailable, note } = body;

    const availability = await prisma.availability.updateMany({
      where: {
        id,
        vendorId: session.user.id,
      },
      data: {
        isAvailable,
        note,
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Availability update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove availability slot
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.availability.deleteMany({
      where: {
        id,
        vendorId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Availability deleted' });
  } catch (error) {
    console.error('Availability deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
