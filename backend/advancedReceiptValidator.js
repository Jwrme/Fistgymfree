require('dotenv').config();
const OpenAI = require('openai');
const crypto = require('crypto');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🔥 ADVANCED AI Receipt Verification - Enhanced for Philippines 2025
 * GCash Reference Numbers: 9 NUMERIC DIGITS ONLY
 * 
 * @param {string} base64Image - Base64 encoded receipt image
 * @param {number} expectedAmount - Expected payment amount
 * @param {object} bookingInfo - Booking details for reference
 * @returns {object} Enhanced verification result
 */
const advancedReceiptVerification = async (base64Image, expectedAmount, bookingInfo = {}) => {
  try {
    console.log('🔥 [ADVANCED AI] Starting enhanced receipt verification...');
    console.log('🔥 [ADVANCED AI] Expected amount: ₱' + expectedAmount);
    
    // Enhanced AI prompt with specific Philippine payment app knowledge
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert forensic analyst specializing in Philippine digital payment receipts. 
          You have extensive knowledge of GCash, Maya (formerly PayMaya), BPI, BDO, Metrobank, and other Philippine payment systems.
          You can detect even subtle signs of image manipulation, AI generation, and fraud.
          
          Current date context: Year 2025, transactions from 2024-2025 are normal.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `FORENSIC ANALYSIS REQUEST:

Analyze this payment receipt with EXTREME SCRUTINY. Return ONLY valid JSON:

{
  "isLegitimate": boolean,
  "paymentMethod": string,
  "amount": number,
  "referenceNumber": string,
  "recipientName": string,
  "timestamp": string,
  "confidence": number (0-100),
  "redFlags": array of strings,
  "reasoning": string,
  "technicalAnalysis": {
    "uiElementsCorrect": boolean,
    "fontConsistency": boolean,
    "colorAccuracy": boolean,
    "layoutAuthenticity": boolean,
    "compressionNatural": boolean,
    "timestampRealistic": boolean
  },
  "fraudRiskScore": number (0-100, higher = more suspicious)
}

VALIDATION CRITERIA:

Expected Amount: ₱${expectedAmount}
Expected Recipients: SENJITSU, FISTGYM, FIST GYM, Fist Gym 1, Fist Gym 2

GCASH REFERENCE NUMBER (CRITICAL):
- MUST be exactly 9 numeric digits (e.g., 192890262)
- NO letters, NO special characters, NO spaces
- Only numbers 0-9
- Examples of VALID: 123456789, 987654321, 192890262
- Examples of INVALID: FG123456A (has letters), 12345 (too short), ABC123DEF (has letters)

GCASH VISUAL CHECKS:
- GCash green logo (#00D09C)
- "Send Money" or "Money Sent" text
- Amount format: "₱X,XXX.XX"
- Date format: "MMM DD, YYYY HH:MM AM/PM"
- Status: "Transaction Successful" in green

DATE VALIDATION (IMPORTANT):
- We are currently in 2025
- Valid dates: Jan 2024 to Dec 2025
- Dates from 2024 and 2025 are NORMAL and VALID
- Only flag if date is before 2024 or beyond 2025

FRAUD DETECTION:
- Font inconsistencies
- Color variations
- Misaligned elements
- AI-generated appearance
- Photoshop artifacts
- Reference number with letters or wrong length

Be EXTREMELY strict about reference numbers: MUST be 9 numeric digits only.`
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
      max_tokens: 1000,
      temperature: 0.1,
    });

    const aiResponse = response.choices[0].message.content.trim();
    console.log('🔥 [ADVANCED AI] Raw response:', aiResponse);
    
    // Parse AI response
    let analysis;
    try {
      const cleanedResponse = aiResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ [ADVANCED AI] Failed to parse JSON:', parseError);
      throw new Error('Advanced AI response format error');
    }

    // Enhanced validation logic
    const extractedAmount = parseFloat(analysis.amount) || 0;
    const expectedAmountNum = parseFloat(expectedAmount);
    const amountDifference = Math.abs(extractedAmount - expectedAmountNum);
    const amountMatch = amountDifference < 1;

    // Validate reference number format (9 numeric digits ONLY)
    const refNumber = (analysis.referenceNumber || '').toString().trim();
    const refNumberValid = /^\d{9}$/.test(refNumber);
    
    if (!refNumberValid && refNumber) {
      const hasLetters = /[a-zA-Z]/.test(refNumber);
      const wrongLength = refNumber.length !== 9;
      
      if (hasLetters) {
        analysis.redFlags.push(`CRITICAL: Reference number contains letters - must be 9 NUMERIC digits only (found: ${refNumber})`);
      } else if (wrongLength) {
        analysis.redFlags.push(`CRITICAL: Reference number must be exactly 9 digits (found: ${refNumber.length} characters)`);
      } else {
        analysis.redFlags.push(`CRITICAL: Reference number invalid - must be 9 numeric digits only`);
      }
    }

    // Advanced scoring system
    let suspicionScore = analysis.fraudRiskScore || 0;
    
    // Amount validation
    if (!amountMatch) {
      analysis.redFlags.push(`CRITICAL: Amount mismatch - Expected ₱${expectedAmount}, found ₱${extractedAmount}`);
      suspicionScore += 40;
    }

    // Reference number validation (CRITICAL)
    if (!refNumberValid && refNumber) {
      suspicionScore += 40; // Heavy penalty for wrong reference format
    }

    // Technical analysis scoring
    if (analysis.technicalAnalysis) {
      const tech = analysis.technicalAnalysis;
      if (!tech.uiElementsCorrect) suspicionScore += 25;
      if (!tech.fontConsistency) suspicionScore += 20;
      if (!tech.colorAccuracy) suspicionScore += 15;
      if (!tech.layoutAuthenticity) suspicionScore += 20;
      if (!tech.compressionNatural) suspicionScore += 15;
      if (!tech.timestampRealistic) suspicionScore += 10;
    }

    // Confidence penalty
    if (analysis.confidence < 70) suspicionScore += 20;
    if (analysis.confidence < 50) suspicionScore += 30;

    // Red flags penalty
    suspicionScore += Math.min(analysis.redFlags.length * 10, 50);

    // Cap at 100
    suspicionScore = Math.min(suspicionScore, 100);

    // Determine final recommendation
    let recommendation, status;
    if (suspicionScore >= 85) {
      recommendation = 'REJECT';
      status = 'rejected';
    } else if (suspicionScore >= 50) {
      recommendation = 'MANUAL_REVIEW';
      status = 'for approval';
    } else {
      recommendation = 'APPROVE';
      status = 'verified';
    }

    const result = {
      isValid: suspicionScore < 50,
      autoReject: suspicionScore >= 85,
      needsManualReview: suspicionScore >= 50 && suspicionScore < 85,
      suspicionScore,
      recommendation,
      suggestedStatus: status,
      confidence: analysis.confidence,
      extractedData: {
        paymentMethod: analysis.paymentMethod,
        amount: extractedAmount,
        amountMatch,
        referenceNumber: refNumber,
        referenceNumberValid: refNumberValid,
        recipientName: analysis.recipientName,
        timestamp: analysis.timestamp
      },
      technicalAnalysis: analysis.technicalAnalysis,
      redFlags: analysis.redFlags,
      reasoning: analysis.reasoning,
      verifiedAt: new Date(),
      fraudRiskScore: analysis.fraudRiskScore,
      advancedValidation: true
    };

    console.log('🔥 [ADVANCED AI] Verification complete:', {
      recommendation: result.recommendation,
      suspicionScore: result.suspicionScore,
      fraudRiskScore: result.fraudRiskScore,
      confidence: result.confidence,
      refNumber: refNumber,
      refNumberValid: refNumberValid,
      redFlags: result.redFlags.length
    });

    return result;

  } catch (error) {
    console.error('❌ [ADVANCED AI] Verification error:', error.message);
    
    return {
      isValid: false,
      autoReject: false,
      needsManualReview: true,
      suspicionScore: 75,
      recommendation: 'MANUAL_REVIEW',
      suggestedStatus: 'for approval',
      confidence: 0,
      error: error.message,
      extractedData: {},
      redFlags: ['Advanced AI verification failed - requires manual review'],
      reasoning: 'System error during advanced AI verification',
      verifiedAt: new Date(),
      advancedValidation: false
    };
  }
};

/**
 * 🔍 Enhanced Image Analysis - Technical validation
 * @param {string} base64Image - Base64 encoded receipt image
 * @returns {object} Technical analysis result
 */
const technicalImageAnalysis = (base64Image) => {
  const analysis = {
    fileSize: 0,
    format: '',
    suspiciousPatterns: [],
    compressionArtifacts: [],
    editingMarkers: [],
    riskScore: 0
  };

  try {
    const matches = base64Image.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!matches) {
      analysis.suspiciousPatterns.push('Invalid base64 format');
      analysis.riskScore += 50;
      return analysis;
    }

    analysis.format = matches[1];
    analysis.fileSize = Math.round(matches[2].length / 1024);
    const base64Data = matches[2];

    // File size analysis
    if (analysis.fileSize < 20) {
      analysis.suspiciousPatterns.push(`Extremely small file (${analysis.fileSize}KB) - likely fake`);
      analysis.riskScore += 40;
    } else if (analysis.fileSize < 80) {
      analysis.suspiciousPatterns.push(`Very small file (${analysis.fileSize}KB) - possibly compressed to hide edits`);
      analysis.riskScore += 25;
    }

    if (analysis.fileSize > 450) {
      analysis.suspiciousPatterns.push(`Large file (${analysis.fileSize}KB) - possibly uncompressed after editing`);
      analysis.riskScore += 20;
    }

    // Format analysis
    if (analysis.format === 'png' && analysis.fileSize > 300) {
      analysis.suspiciousPatterns.push('PNG format unusual for phone screenshots');
      analysis.riskScore += 15;
    }

    // Check for editing software markers
    const editingSoftware = [
      'Adobe Photoshop', 'GIMP', 'Canva', 'Figma', 'Sketch',
      'Midjourney', 'DALL-E', 'Stable Diffusion', 'Leonardo AI'
    ];

    try {
      const sample = Buffer.from(base64Data.substring(0, 2000), 'base64').toString('utf-8', 0, 1000);
      editingSoftware.forEach(software => {
        if (sample.includes(software)) {
          analysis.editingMarkers.push(software);
          analysis.riskScore += 30;
        }
      });
    } catch (e) {
      // Normal for most images
    }

    // Entropy analysis (randomness check)
    const entropy = calculateEntropy(base64Data.substring(0, 1000));
    if (entropy < 3.5) {
      analysis.compressionArtifacts.push('Low entropy - possibly AI-generated');
      analysis.riskScore += 20;
    } else if (entropy > 7.5) {
      analysis.compressionArtifacts.push('High entropy - possibly encrypted or heavily edited');
      analysis.riskScore += 15;
    }

  } catch (error) {
    analysis.suspiciousPatterns.push('Error during technical analysis');
    analysis.riskScore += 25;
  }

  return analysis;
};

/**
 * Calculate Shannon entropy of a string
 * @param {string} str - Input string
 * @returns {number} Entropy value
 */
const calculateEntropy = (str) => {
  const freq = {};
  for (let char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  for (let char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
};

module.exports = {
  advancedReceiptVerification,
  technicalImageAnalysis
};