"use server";

import { scarpeAmazonProduct } from "../scraper";

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) return;
  try {
    const scrapedProduct = await scarpeAmazonProduct(productUrl);
    if (!scrapedProduct) return;
  } catch (error: any) {
    throw new Error(`Failed to create/update product :${error.message}`);
  }
}
