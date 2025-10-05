require('dotenv').config();
const OpenAI = require('openai');
const crypto = require('crypto');
const { advancedReceiptVerification, technicalImageAnalysis } = require('./advancedReceiptValidator');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🤖 Enhanced AI Receipt Verification - Now with Advanced Validation
 * Valid GCash recipient names: SENJITSU, FISTGYM, FIST GYM, Fist Gym 1, Fist Gym 2
 * 
 * @param {string} base64Image - Base64 encoded receipt image
 * @param {number} expectedAmount - Expected payment amount
 * @param {object} bookingInfo - Booking details for reference
 * @returns {object} Verification result with confidence score
 */
const verifyReceiptWithAI = async (base64Image, expectedAmount, bookingInfo = {}) => {
  try {
    console.log('🤖 [AI] Starting enhanced receipt verification...');
    console.log('🤖 [AI] Expected amount: ₱' + expectedAmount);
    
    // Step 1: Technical Analysis
    console.log('🔍 [TECH] Running technical analysis...');
    const techAnalysis = technicalImageAnalysis(base64Image);
    console.log('🔍 [TECH] Technical risk score:', techAnalysis.riskScore);
    
    // Step 2: Advanced AI Analysis
    console.log('🔥 [ADVANCED] Running advanced AI verification...');
    const advancedResult = await advancedReceiptVerification(base64Image, expectedAmount, bookingInfo);
    
    // Step 3: Combine results for final decision
    const combinedSuspicionScore = Math.min(
      Math.round((advancedResult.suspicionScore + techAnalysis.riskScore) / 2),
      100
    );
    
    // Enhanced red flags
    const allRedFlags = [
      ...advancedResult.redFlags,
      ...techAnalysis.suspiciousPatterns,
      ...techAnalysis.compressionArtifacts.map(artifact => `Technical: ${artifact}`),
      ...techAnalysis.editingMarkers.map(marker => `Editing software detected: ${marker}`)
    ];
    
    // Final recommendation based on combined analysis
    let finalRecommendation, finalStatus;
    if (combinedSuspicionScore >= 85) {
      finalRecommendation = 'REJECT';
      finalStatus = 'rejected';
    } else if (combinedSuspicionScore >= 45) {
      finalRecommendation = 'MANUAL_REVIEW';
      finalStatus = 'for approval';
    } else {
      finalRecommendation = 'APPROVE';
      finalStatus = 'verified';
    }
    
    const result = {
      isValid: combinedSuspicionScore < 45,
      autoReject: combinedSuspicionScore >= 85,
      needsManualReview: combinedSuspicionScore >= 45 && combinedSuspicionScore < 85,
      suspicionScore: combinedSuspicionScore,
      recommendation: finalRecommendation,
      suggestedStatus: finalStatus,
      confidence: advancedResult.confidence,
      extractedData: advancedResult.extractedData,
      redFlags: allRedFlags,
      reasoning: advancedResult.reasoning,
      verifiedAt: new Date(),
      // Enhanced data
      technicalAnalysis: {
        fileSize: techAnalysis.fileSize,
        format: techAnalysis.format,
        riskScore: techAnalysis.riskScore,
        editingMarkers: techAnalysis.editingMarkers,
        suspiciousPatterns: techAnalysis.suspiciousPatterns
      },
      advancedAnalysis: advancedResult.technicalAnalysis,
      fraudRiskScore: advancedResult.fraudRiskScore,
      enhancedValidation: true
    };

    console.log('🤖 [ENHANCED] Verification complete:', {
      recommendation: result.recommendation,
      combinedSuspicionScore: result.suspicionScore,
      techRiskScore: techAnalysis.riskScore,
      aiRiskScore: advancedResult.suspicionScore,
      confidence: result.confidence,
      redFlags: result.redFlags.length
    });

    return result;

  } catch (error) {
    console.error('❌ [ENHANCED] Verification error:', error.message);
    console.log('⚠️ [ENHANCED] Falling back to basic validation...');
    
    // Fallback to basic AI verification
    return await basicAIVerification(base64Image, expectedAmount, bookingInfo);
  }
};

/**
 * 🔄 Fallback Basic AI Verification (original method)
 */
const basicAIVerification = async (base64Image, expectedAmount, bookingInfo = {}) => {
  try {
    console.log('🔄 [FALLBACK] Using basic AI verification...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

Look for signs of editing or AI generation:
- Inconsistent fonts, sizes, or styles
- Misaligned text or UI elements  
- Unusual colors or color inconsistencies
- Photoshop artifacts (clone stamp, healing brush marks)
- Blurry or "fuzzy" text edges
- Repeated or unnatural patterns
- Copy-pasted sections with different quality
- Text that doesn't match GCash's actual UI/fonts
- AI-generated "dreamy" or too-smooth appearance
- Impossible layouts or incorrect GCash branding
- Metadata indicating image manipulation

Be strict: If anything looks suspicious or "off", flag it as a red flag.`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const aiResponse = response.choices[0].message.content.trim();
    console.log('🔄 [FALLBACK] Raw response:', aiResponse);
    
    let analysis;
    try {
      const cleanedResponse = aiResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ [FALLBACK] Failed to parse JSON:', parseError);
      throw new Error('AI response format error - manual review required');
    }

    // Basic validation logic
    const extractedAmount = parseFloat(analysis.amount) || 0;
    const expectedAmountNum = parseFloat(expectedAmount);
    const amountDifference = Math.abs(extractedAmount - expectedAmountNum);
    const amountMatch = amountDifference < 1;

    if (!amountMatch) {
      analysis.redFlags.push(`Amount mismatch: Expected ₱${expectedAmount}, found ₱${extractedAmount}`);
      analysis.confidence = Math.min(analysis.confidence, 30);
    }

    let suspicionScore = 0;
    if (!analysis.isLegitimate) suspicionScore += 100;
    if (analysis.confidence < 50) suspicionScore += 40;
    if (analysis.redFlags.length > 0) suspicionScore += (analysis.redFlags.length * 15);
    if (!amountMatch) suspicionScore += 50;
    if (analysis.paymentMethod === 'Unknown') suspicionScore += 30;

    suspicionScore = Math.min(suspicionScore, 100);

    let recommendation, status;
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
      verifiedAt: new Date(),
      enhancedValidation: false
    };

    console.log('🔄 [FALLBACK] Verification complete:', {
      recommendation: result.recommendation,
      suspicionScore: result.suspicionScore,
      confidence: result.confidence,
      redFlags: result.redFlags.length
    });

    return result;

  } catch (error) {
    console.error('❌ [FALLBACK] Verification error:', error.message);
    
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
      verifiedAt: new Date(),
      enhancedValidation: false
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
      status: { $in: ['verified', 'for approval'] }
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
 * Enhanced basic validation with technical checks
 * @param {string} base64Image - Base64 encoded receipt image
 * @param {number} expectedAmount - Expected payment amount
 * @returns {object} Enhanced validation result
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
      validation.imageSize = Math.round(matches[2].length / 1024);
    }

    // Enhanced file size validation
    if (!validation.hasImage) {
      validation.redFlags.push('No receipt image provided');
    }
    if (!validation.isValidBase64) {
      validation.redFlags.push('Invalid image format');
    }
    
    // FILE SIZE VALIDATION - Enhanced ranges
    if (validation.imageSize > 500) {
      validation.redFlags.push(`Image too large (${validation.imageSize}KB) - possible manipulation. Normal: 100-400KB`);
    }
    
    if (matches) {
      const base64Data = matches[2];
      const imageFormat = matches[1];
      
      // Enhanced size checks
      if (validation.imageSize < 10) {
        validation.redFlags.push(`Image extremely small (${validation.imageSize}KB) - likely AI-generated or fake`);
      } else if (validation.imageSize < 50) {
        validation.redFlags.push(`Image suspiciously small (${validation.imageSize}KB) - possible manipulation. Normal: 100-400KB`);
      }
      
      // Format-specific validation
      if (imageFormat === 'jpeg' || imageFormat === 'jpg') {
        if (validation.imageSize < 80) {
          validation.redFlags.push(`JPEG too small (${validation.imageSize}KB) - normal is 100-400KB`);
        } else if (validation.imageSize > 450) {
          validation.redFlags.push(`JPEG too large (${validation.imageSize}KB) - possibly edited/uncompressed`);
        }
      } else if (imageFormat === 'png') {
        if (validation.imageSize < 150) {
          validation.redFlags.push(`PNG too small (${validation.imageSize}KB) - normal is 200-600KB`);
        } else if (validation.imageSize > 600) {
          validation.redFlags.push(`PNG too large (${validation.imageSize}KB) - possibly edited`);
        }
      }
      
      // Check for editing software signatures
      const suspiciousPatterns = [
        'Adobe Photoshop', 'GIMP', 'Canva', 'Midjourney', 'DALL-E', 'Stable Diffusion'
      ];
      
      try {
        const sample = Buffer.from(base64Data.substring(0, 1000), 'base64').toString('utf-8', 0, 500);
        suspiciousPatterns.forEach(pattern => {
          if (sample.includes(pattern)) {
            validation.redFlags.push(`Image contains editing software marker: ${pattern}`);
          }
        });
      } catch (e) {
        // Normal images won't decode to readable text
      }
      
      // PNG format suspicious for phone screenshots
      if (imageFormat === 'png' && validation.imageSize > 200) {
        validation.redFlags.push('PNG format unusual for phone screenshots - possible editing');
      }
    }

  } catch (error) {
    validation.redFlags.push('Error validating image');
  }

  return validation;
};

module.exports = {
  verifyReceiptWithAI,
  checkDuplicateReceipt,
  basicReceiptValidation,
  advancedReceiptVerification,
  technicalImageAnalysis
};