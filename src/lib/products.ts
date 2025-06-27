import * as yaml from 'js-yaml';
import { Product } from '@/types';
import fs from 'fs';
import path from 'path';

export async function loadProducts(): Promise<Product[]> {
  if (typeof window !== 'undefined') {
    return [];
  }

  try {
    const productsDir = path.join(process.cwd(), 'src/data/products');
    const files = fs.readdirSync(productsDir).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    const products: Product[] = [];
    
    for (const file of files) {
      const filePath = path.join(productsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const productData = yaml.load(fileContent) as Product;
      
      if (productData && productData.id) {
        products.push(productData);
      }
    }
    
    return products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await loadProducts();
  return products.find(product => product.id === id) || null;
}