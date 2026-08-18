/**
 * Stripe SDK singleton — server-side only.
 *
 * Usage:
 *   import { stripe } from "@/app/lib/stripe";
 */

import Stripe from "stripe";

let stripeClient;

const getStripeClient = () => {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is required for Stripe operations");
    }

    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    });
  }

  return stripeClient;
};

export const stripe = new Proxy({}, {
  get(_target, property) {
    return getStripeClient()[property];
  },
});
