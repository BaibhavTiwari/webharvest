import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scarpeAmazonProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import {
  getLowestPrice,
  getHighestPrice,
  getAveragePrice,
  getEmailNotifType,
} from "@/lib/utils";

export const maxDuration = 1000;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    connectToDB();
    const products = await Product.find({});

    if (!products) {
      throw new Error("No product fetched");
    }

    const updatedProducts = [];
    const emailNotifications = [];

    for (const currentProduct of products) {
      const scrapedProduct = await scarpeAmazonProduct(currentProduct.url);

      if (scrapedProduct) {
        const updatedPriceHistory = [
          ...currentProduct.priceHistory,
          {
            price: scrapedProduct.currentPrice,
          },
        ];

        const product = {
          ...scrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };

        const updatedProduct = await Product.findOneAndUpdate(
          { url: product.url },
          product
        );

        const emailNotifType = getEmailNotifType(
          scrapedProduct,
          currentProduct
        );

        if (emailNotifType && updatedProduct.users.length > 0) {
          emailNotifications.push({
            product: updatedProduct,
            emailNotifType,
          });
        }

        updatedProducts.push(updatedProduct);
      }
    }

    const emailPromises = emailNotifications.map(async (notification) => {
      const { product, emailNotifType } = notification;
      const productInfo = {
        title: product.title,
        url: product.url,
      };

      const emailContent = await generateEmailBody(productInfo, emailNotifType);
      const userEmails = product.users.map((user: any) => user.email);

      return sendEmail(emailContent, userEmails);
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      message: "Ok",
      data: updatedProducts,
    });
  } catch (error: any) {
    throw new Error(`Failed to get all products: ${error.message}`);
  }
}
