package com.ecommerce.util;

import com.ecommerce.exception.BadRequestException;

/**
 * Normalizes and validates phone numbers for storage and WhatsApp (wa.me) compatibility.
 *
 * Normalization steps:
 *  1. Trim whitespace
 *  2. Replace leading "00" with "+" (e.g. 00970... → +970...)
 *  3. Strip formatting characters: spaces, dashes, parentheses, dots
 *
 * Validation: 9–15 digits (ITU-T E.164 range).
 *
 * Examples:
 *  "059 123 4567"      → "0591234567"      (9 digits ✓)
 *  "+970-59-123-4567"  → "+970591234567"   (12 digits ✓)
 *  "00970591234567"    → "+970591234567"   (12 digits ✓)
 *  "(059) 123.4567"    → "0591234567"      (9 digits ✓)
 */
public class PhoneUtils {

    private PhoneUtils() {}

    public static String normalize(String phone) {
        if (phone == null) return null;

        String result = phone.trim();

        // Replace leading 00 with + (international dialing prefix)
        if (result.startsWith("00")) {
            result = "+" + result.substring(2);
        }

        // Strip formatting characters (keep digits and leading +)
        result = result.replaceAll("[\\s\\-().]", "");

        return result.isEmpty() ? null : result;
    }

    /**
     * Validates digit count of a normalized phone number.
     * Accepts 9–15 digits (covers local and international formats).
     * Throws BadRequestException if out of range.
     */
    public static void validate(String normalized) {
        if (normalized == null || normalized.isEmpty()) return;
        long digits = normalized.chars().filter(Character::isDigit).count();
        if (digits < 9 || digits > 15) {
            throw new BadRequestException(
                "Phone number must have 9–15 digits (got " + digits + "). " +
                "Include country code for WhatsApp, e.g. +970591234567"
            );
        }
    }
}
