/**
 * Deterministic Pseudo-Random Number Generator (PRNG) & Formatting Helpers
 * Uses Mulberry32 algorithm for fast, high-quality 32-bit reproducible randomization.
 */

function createPRNG(seed = 1337) {
  let s = Math.floor(seed);
  return function mulberry32() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class RandomHelper {
  constructor(seed = 1337) {
    this.rng = createPRNG(seed);
  }

  random() {
    return this.rng();
  }

  int(min, max) {
    return Math.floor(this.rng() * (max - min + 1)) + min;
  }

  float(min, max, decimals = 2) {
    const val = this.rng() * (max - min) + min;
    return Number(val.toFixed(decimals));
  }

  choice(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(this.rng() * array.length)];
  }

  sample(array, count) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  weightedChoice(weightsObj) {
    const keys = Object.keys(weightsObj);
    const totalWeight = keys.reduce((acc, k) => acc + weightsObj[k], 0);
    let threshold = this.rng() * totalWeight;

    for (const key of keys) {
      threshold -= weightsObj[key];
      if (threshold <= 0) return key;
    }
    return keys[keys.length - 1];
  }

  /**
   * Generates a date adhering to the monthly seasonality weights across a 2-year horizon (2025-2026).
   */
  seasonalDate(startYear = 2025, endYear = 2026, monthlySeasonality) {
    const year = this.int(startYear, endYear);
    // Weight months according to seasonal index
    const monthWeights = {};
    for (let m = 0; m < 12; m++) {
      monthWeights[m] = monthlySeasonality[m];
    }
    const month = Number(this.weightedChoice(monthWeights));
    // Determine days in that month
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const day = this.int(1, daysInMonth);
    const hour = this.int(9, 21); // business hours
    const minute = this.choice([0, 15, 30, 45]);
    return new Date(Date.UTC(year, month, day, hour, minute, 0));
  }

  /**
   * Safe, clearly fictitious, non-dialable test phone number.
   * Conforms to E.164 character set and application schema (/^\+?[\d ()-]+$/, length 16, 12 digits).
   * In the Indian National Numbering Plan (DoT/TRAI), Level '0' is strictly unassigned to any
   * subscriber (all mobile allocations start with 6, 7, 8, or 9; fixed lines start with 2-7).
   * Level 000 cannot be routed or dialed, ensuring it can NEVER accidentally contact real people.
   */
  syntheticCustomerPhone(uniqueIndex) {
    const suffix = String(uniqueIndex).padStart(4, '0');
    return `+91-000-000-${suffix}`;
  }

  syntheticSupplierPhone(uniqueIndex) {
    const suffix = String(uniqueIndex).padStart(4, '0');
    return `+91-000-001-${suffix}`;
  }

  syntheticAdminPhone(uniqueIndex) {
    const suffix = String(uniqueIndex).padStart(4, '0');
    return `+91-000-009-${suffix}`;
  }

  /**
   * Synthetic user email with .test TLD (RFC 2606 reserved for testing).
   */
  syntheticEmail(firstName, lastName, uniqueIndex) {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const id = String(uniqueIndex).padStart(5, '0');
    return `synthetic.${cleanFirst}.${cleanLast}.${id}@pateltenthouse.test`;
  }
}

module.exports = {
  createPRNG,
  RandomHelper
};

