require('dotenv').config();
const OpenAI = require('openai');
const crypto = require('crypto');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🤖 AI Receipt Verification using OpenAI Vision API
 * NO TRAINING NEEDED - GPT-4 Vision is pre-trained!
 * 
 * Verifies GCash/Bank transfer receipts for legitimacy
 * Valid GCash recipient names: SENJITSU, FISTGYM, FIST GYM, Fist Gym 1, Fist Gym 2
 * 
 * @param {string} base64Image - Base64 encoded receipt image
 * @param {number} expectedAmount - Expected payment amount
 * @param {object} bookingInfo - Booking details for reference
 * @returns {object} Verification result with confidence score
 */
const verifyReceiptWithAI = async (base64Image, expectedAmount, bookingInfo = {}) => {
  try {
    console.log('🤖 [AI] Starting receipt verification...');
    console.log('🤖 [AI] Expected amount: ₱' + expectedAmount);
    
    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cheaper and faster than gpt-4-vision-preview
      messages: [
        {
          role: "system",
          content: `You are an expert at verifying Philippine payment receipts (GCash, Maya, Bank transfers, etc.). 
          Analyze receipts for authenticity and extract key information. Be strict about detecting fake or edited receipts.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this payment receipt carefully and respond with ONLY a valid JSON object (no markdown, no code blocks):

{
  "isLegitimate": boolean (true if this is a real, unedited receipt),
  "paymentMethod": string (e.g., "GCash", "Maya", "Bank Transfer", "Unknown"),
  "amount": number (extracted amount in PHP, numbers only),
  "referenceNumber": string (transaction reference/ID if found),
  "recipientName": string (who received the payment),
  "timestamp": string (date/time of transaction if visible),
  "confidence": number (0-100, how confident you are this is legitimate),
  "redFlags": array of strings (any suspicious elements found),
  "reasoning": string (brief explanation of your assessment)
}

Expected amount: ₱${expectedAmount}
Expected recipient: SENJITSU, FISTGYM, FIST GYM, Fist Gym 1, or Fist Gym 2

Look for signs of editing: inconsistent fonts, misaligned text, unusual colors, photoshop artifacts, or repeated patterns.`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high" // High detail for better analysis
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const aiResponse = response.choices[0].message.content.trim();
    console.log('🤖 [AI] Raw response:', aiResponse);
    
    // Parse AI response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ [AI] Failed to parse JSON:', parseError);
      console.error('❌ [AI] Response was:', aiResponse);
      throw new Error('AI response format error - manual review required');
    }

    // Validate amount match
    const extractedAmount = parseFloat(analysis.amount) || 0;
    const expectedAmountNum = parseFloat(expectedAmount);
    const amountDifference = Math.abs(extractedAmount - expectedAmountNum);
    const amountMatch = amountDifference < 1; // Allow 1 peso tolerance

    if (!amountMatch) {
      analysis.redFlags.push(`Amount mismatch: Expected ₱${expectedAmount}, found ₱${extractedAmount}`);
      analysis.confidence = Math.min(analysis.confidence, 30);
    }

    // Calculate suspicion score
    let suspicionScore = 0;
    if (!analysis.isLegitimate) suspicionScore += 100;
    if (analysis.confidence < 50) suspicionScore += 40;
    if (analysis.redFlags.length > 0) suspicionScore += (analysis.redFlags.length * 15);
    if (!amountMatch) suspicionScore += 50;
    if (analysis.paymentMethod === 'Unknown') suspicionScore += 30;

    suspicionScore = Math.min(suspicionScore, 100);

    // Determine recommendation
    let recommendation;
    let status;
    if (suspicionScore >= 80) {
      recommendation = 'REJECT';
      status = 'rejected';
    } else if (suspicionScore >= 40) {
      recommendation = 'MANUAL_REVIEW';
      status = 'for approval';
    } else {
      recommendation = 'APPROVE';
      status = 'verified';
    }

    const result = {
      isValid: suspicionScore < 40,
      autoReject: suspicionScore >= 80,
      needsManualReview: suspicionScore >= 40 && suspicionScore < 80,
      suspicionScore,
      recommendation,
      suggestedStatus: status,
      confidence: analysis.confidence,
      extractedData: {
        paymentMethod: analysis.paymentMethod,
        amount: extractedAmount,
        amountMatch,
        referenceNumber: analysis.referenceNumber,
        recipientName: analysis.recipientName,
        timestamp: analysis.timestamp
      },
      redFlags: analysis.redFlags,
      reasoning: analysis.reasoning,
      verifiedAt: new Date()
    };

    console.log('🤖 [AI] Verification complete:', {
      recommendation: result.recommendation,
      suspicionScore: result.suspicionScore,
      confidence: result.confidence,
      redFlags: result.redFlags.length
    });

    return result;

  } catch (error) {
    console.error('❌ [AI] Verification error:', error.message);
    
    // If AI fails, fallback to manual review
    return {
      isValid: false,
      autoReject: false,
      needsManualReview: true,
      suspicionScore: 50,
      recommendation: 'MANUAL_REVIEW',
      suggestedStatus: 'for approval',
      confidence: 0,
      error: error.message,
      extractedData: {},
      redFlags: ['AI verification failed - requires manual review'],
      reasoning: 'System error during AI verification',
      verifiedAt: new Date()
    };
  }
};

/**
 * Check for duplicate receipts using image hash
 * @param {string} base64Image - Base64 encoded receipt image
 * @param {object} Payment - Mongoose Payment model
 * @returns {object} Duplicate check result
 */
const checkDuplicateReceipt = async (base64Image, Payment) => {
  try {
    // Create hash of the image
    const imageHash = crypto
      .createHash('md5')
      .update(base64Image)
      .digest('hex');

    // Check if this hash exists in database
    const existingPayment = await Payment.findOne({ 
      receiptHash: imageHash,
      status: { $in: ['verified', 'for approval'] } // Only check approved/pending
    });

    if (existingPayment) {
      return {
        isDuplicate: true,
        existingPaymentId: existingPayment._id,
        existingUserId: existingPayment.userId,
        existingDate: existingPayment.date,
        message: `This receipt was already used for a payment on ${existingPayment.date}`
      };
    }

    return {
      isDuplicate: false,
      imageHash
    };

  } catch (error) {
    console.error('❌ [DUPLICATE CHECK] Error:', error);
    return {
      isDuplicate: false,
      error: error.message
    };
  }
};

/**
 * Basic validation without AI (fallback)
 * @param {string} base64Image - Base64 encoded receipt image
 * @param {number} expectedAmount - Expected payment amount
 * @returns {object} Basic validation result
 */
const basicReceiptValidation = (base64Image, expectedAmount) => {
  const validation = {
    hasImage: !!base64Image,
    isValidBase64: false,
    imageSize: 0,
    redFlags: []
  };

  try {
    // Check if valid base64
    const matches = base64Image.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    validation.isValidBase64 = !!matches;
    
    if (matches) {
      validation.imageSize = Math.round(matches[2].length / 1024); // Size in KB
    }

    // Basic checks
    if (!validation.hasImage) {
      validation.redFlags.push('No receipt image provided');
    }
    if (!validation.isValidBase64) {
      validation.redFlags.push('Invalid image format');
    }
    if (validation.imageSize > 500) {
      validation.redFlags.push(`Image too large: ${validation.imageSize}KB`);
    }

  } catch (error) {
    validation.redFlags.push('Error validating image');
  }

  return validation;
};

module.exports = {
  verifyReceiptWithAI,
  checkDuplicateReceipt,
  basicReceiptValidation
};
