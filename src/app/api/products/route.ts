import { NextResponse } from 'next/server';
import { loadProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await loadProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error loading products:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}