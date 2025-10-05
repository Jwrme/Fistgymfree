require('dotenv').config();
const OpenAI = require('openai');
const crypto = require('crypto');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🔥 ADVANCED AI Receipt Verification - Enhanced for Philippines
 * Specifically trained to detect GCash, Maya, and Philippine bank receipts
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
          
          Your expertise includes:
          - Exact GCash UI elements, fonts, and layouts (2023-2024 versions)
          - Maya app interface and transaction formats
          - Philippine bank transfer receipt formats
          - Common editing techniques used by fraudsters
          - AI-generated image artifacts
          - Metadata analysis for manipulation detection`
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

GCASH SPECIFIC CHECKS:
- Logo must be exact GCash green (#00D09C) with correct font
- "Send Money" or "Money Sent" text in specific locations
- Reference numbers: 13 digits, format: XXXXXXXXXX123
- Amount format: "₱X,XXX.XX" with proper comma placement
- Date format: "MMM DD, YYYY HH:MM AM/PM" (Philippine timezone)
- UI buttons: rounded corners, specific shadows
- Background: white with subtle gray sections
- Status: "Transaction Successful" in green

MAYA SPECIFIC CHECKS:
- Maya logo and branding (blue/purple theme)
- Transaction ID format different from GCash
- Different UI layout and button styles

BANK TRANSFER CHECKS:
- Bank logos (BPI, BDO, Metrobank, etc.)
- Account number formats
- Bank-specific UI elements

FRAUD DETECTION:
- Font inconsistencies (mixed Arial, Times, etc.)
- Color variations within same elements
- Misaligned text or buttons
- Impossible dates (future dates, invalid formats)
- Wrong currency symbols or formats
- Copy-paste artifacts (different image quality)
- AI generation signs (too smooth, unnatural text)
- Photoshop artifacts (clone stamps, healing brush)
- Screenshot inconsistencies (wrong phone UI)

ADVANCED CHECKS:
- Reference number validity (check digit algorithms)
- Timestamp logic (business hours, realistic timing)
- Amount formatting (Philippine peso standards)
- Phone status bar elements (battery, signal, time)
- App version consistency (UI matches current versions)

Be EXTREMELY strict. Flag ANY inconsistency as suspicious.`
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
      temperature: 0.1, // Very low for consistent analysis
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

    // Advanced scoring system
    let suspicionScore = analysis.fraudRiskScore || 0;
    
    // Amount validation
    if (!amountMatch) {
      analysis.redFlags.push(`CRITICAL: Amount mismatch - Expected ₱${expectedAmount}, found ₱${extractedAmount}`);
      suspicionScore += 40;
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
        referenceNumber: analysis.referenceNumber,
        recipientName: analysis.recipientName,
        timestamp: analysis.timestamp
      },
      technicalAnalysis: analysis.technicalAnalysis,
      redFlags: analysis.redFlags,
      reasoning: analysis.reasoning,
      verifiedAt: new Date(),
      // Enhanced fields
      fraudRiskScore: analysis.fraudRiskScore,
      advancedValidation: true
    };

    console.log('🔥 [ADVANCED AI] Verification complete:', {
      recommendation: result.recommendation,
      suspicionScore: result.suspicionScore,
      fraudRiskScore: result.fraudRiskScore,
      confidence: result.confidence,
      redFlags: result.redFlags.length
    });

    return result;

  } catch (error) {
    console.error('❌ [ADVANCED AI] Verification error:', error.message);
    
    // Fallback to manual review
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

    // Check for suspicious base64 patterns
    const suspiciousB64Patterns = [
      '/9j/4AAQSkZJRgABAQAAAQABAAD', // Common JPEG header - too common for real screenshots
      'iVBORw0KGgoAAAANSUhEUgAA', // PNG header - check if too perfect
    ];

    const header = base64Data.substring(0, 50);
    if (header === suspiciousB64Patterns[0]) {
      analysis.compressionArtifacts.push('Generic JPEG header - possibly template-based');
      analysis.riskScore += 10;
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
