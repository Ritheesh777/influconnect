import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Administrator-configurable platform settings (v2 §11, §13, §16, §33).
 *
 * The spec is explicit that none of this may be hardcoded: "The discount must
 * not be permanently hardcoded" (§10) and rank names/thresholds "should be
 * configurable" (§13). This is a singleton — always load it via `getSettings()`.
 */
const rankDefSchema = new Schema(
  {
    key: { type: String, required: true }, // 'rookie'
    name: { type: String, required: true }, // 'Rookie'
    min: { type: Number, required: true }, // inclusive lower bound
    max: { type: Number, default: null }, // inclusive upper bound; null = no ceiling
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const platformSettingsSchema = new Schema(
  {
    // Singleton guard: only one document may ever exist.
    singleton: { type: String, default: 'settings', unique: true, immutable: true },

    pricing: {
      firstSubscriptionPercent: { type: Number, default: 70, min: 0, max: 100 },
      // §11 — "maximum discount cap so combined discounts cannot unintentionally
      // make the subscription free or negative"
      maxCombinedPercent: { type: Number, default: 80, min: 0, max: 100 },
      minChargeablePaise: { type: Number, default: 100, min: 1 },
    },

    // §13/§16 — thresholds and their rank discounts, both configurable
    ranks: {
      type: [rankDefSchema],
      default: () => [
        { key: 'rookie', name: 'Rookie', min: 0, max: 3, discountPercent: 0 },
        { key: 'bronze', name: 'Bronze', min: 4, max: 7, discountPercent: 5 },
        { key: 'silver', name: 'Silver', min: 8, max: 15, discountPercent: 10 },
        { key: 'gold', name: 'Gold', min: 16, max: 25, discountPercent: 15 },
        { key: 'platinum', name: 'Platinum', min: 26, max: null, discountPercent: 20 },
      ],
    },

    // §4/§5 — free collaborations before a subscription is required
    freeCollabLimit: { type: Number, default: 3, min: 0 },

    // §33 — "The Administrator should be able to update official support information"
    support: {
      email: { type: String, default: 'support@influconnect.in' },
      helpline: { type: String, default: '' },
      hours: { type: String, default: 'Mon–Fri, 10:00–18:00 IST' },
      responseTime: { type: String, default: 'Within 24 hours on working days' },
      faqs: {
        type: [{ q: String, a: String, category: String }],
        default: () => [],
      },
    },
  },
  { timestamps: true }
);

/**
 * Loads the singleton, creating it with schema defaults on first call.
 * Uses $setOnInsert so a concurrent boot can't clobber admin-edited values.
 */
platformSettingsSchema.statics.get = async function () {
  const existing = await this.findOne({ singleton: 'settings' });
  if (existing) return existing;
  await this.updateOne({ singleton: 'settings' }, { $setOnInsert: {} }, { upsert: true });
  return this.findOne({ singleton: 'settings' });
};

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
