import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from './env.js';

export const isRazorpayConfigured = () =>
  Boolean(env.razorpay.keyId && env.razorpay.keySecret);

let client = null;
export function razorpay() {
  if (!isRazorpayConfigured()) return null;
  if (!client)
    client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return client;
}

/**
 * Verifies the checkout signature (BR-NEW-005 / §9).
 * Razorpay signs `order_id|payment_id` with your KEY SECRET. Because only our
 * server knows the secret, a matching signature proves the payment is genuine —
 * a client claiming "payment succeeded" proves nothing.
 * timingSafeEqual avoids leaking the signature via response-time differences.
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!signature || !orderId || !paymentId) return false;
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Verifies a webhook came from Razorpay (signed with the webhook secret). */
export function verifyWebhookSignature({ rawBody, signature }) {
  if (!env.razorpay.webhookSecret || !signature) return false;
  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
