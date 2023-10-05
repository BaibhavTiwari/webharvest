"use server";

import { ScarpeAmazonProduct } from "../scraper";

export async function scrapeAndStoreProduct(productUrl: string) {
  if (productUrl) return;
  try {
    const scrapedProduct = await ScarpeAmazonProduct(productUrl);
  } catch (error: any) {
    throw new Error(`Failed to create/update product :${error.message}`);
  }
}
