/**
 * Stripe SDK singleton — server-side only.
 *
 * Usage:
 *   import { stripe } from "@/app/lib/stripe";
 */

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});
