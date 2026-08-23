const express = require('express');
const router = express.Router();
const https = require('https');
const Settings = require('../models/Settings');

let lastReceivedWebhookEvent = null;
let webhookLogsHistory = [];

/**
 * Helper to dispatch automatic WhatsApp reply to customer
 */
const sendWhatsAppAutoReply = async (recipientPhone, replyText) => {
  try {
    let settings = await Settings.findOne();
    const token = settings?.whatsappConfig?.apiKey || settings?.whatsapp?.apiKey || 'EAAX71GdiWggBSU0GVjd55F7AZB2H0vC8jhELg1y1ASa9EAko9Va8dd07h8SX6sQSiFX7xs9Np0JU7KFkehgGH6rRGSwVeeWRq98jexmRoDrty5XeKZCKN6denWuVXgnL1ABfNJwee4RaZA7AjoFcjdG4DnKpDgZBlldWZAnX03tOZC9oVdSTdMDWWNFooV68xnsQZDZD';
    const phoneId = settings?.whatsappConfig?.phoneNumberId || settings?.whatsapp?.phoneNumberId || '1221104881094408';

    const cleanPhone = recipientPhone.replace(/[^\d]/g, '');

    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body: replyText }
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v25.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`🤖 Auto-Reply Dispatched to +${cleanPhone}: Status ${res.statusCode}`);
      });
    });

    req.on('error', (e) => console.error('Auto-Reply error:', e.message));
    req.write(payload);
    req.end();
  } catch (e) {
    console.error('Auto-reply exception:', e.message);
  }
};

/**
 * GET /api/webhooks/meta/last-event
 * Live Monitor Endpoint to inspect incoming Meta Webhook POST events
 */
router.get('/meta/last-event', (req, res) => {
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    totalReceived: webhookLogsHistory.length,
    lastEvent: lastReceivedWebhookEvent,
    recentHistory: webhookLogsHistory.slice(0, 20)
  });
});

/**
 * GET /api/webhooks/meta
 * Meta Developer Portal Webhook Verification Handshake & Browser Health Status
 */
router.get('/meta', async (req, res) => {
  const urlObj = new URL(req.originalUrl || req.url, 'https://admin.kedvasshygieneproducts.com');
  const mode = req.query['hub.mode'] || (req.query.hub && req.query.hub.mode) || urlObj.searchParams.get('hub.mode');
  const token = req.query['hub.verify_token'] || (req.query.hub && req.query.hub.verify_token) || urlObj.searchParams.get('hub.verify_token');
  const challenge = req.query['hub.challenge'] || (req.query.hub && req.query.hub.challenge) || urlObj.searchParams.get('hub.challenge');

  // Resolve verify token from process.env or Settings DB model fallback
  let verifyToken = process.env.META_VERIFY_TOKEN || 'ehn_one_whatsapp_verify_token_2026';
  try {
    const settings = await Settings.findOne();
    if (settings?.whatsapp?.webhookVerifyToken) {
      verifyToken = settings.whatsapp.webhookVerifyToken;
    }
  } catch (e) {}

  // 1. Meta Developer Portal Verification Handshake
  if (mode || token || challenge) {
    if (mode === 'subscribe' && (token === verifyToken || token === 'ehn_one_whatsapp_verify_token_2026')) {
      console.log('✅ Meta Webhook Verification Successful! Responding with challenge:', challenge);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    } else {
      console.warn('❌ Meta Webhook Verification Failed: Token mismatch or invalid mode.');
      return res.sendStatus(403);
    }
  }

  // 2. Normal Browser GET Health Check
  return res.status(200).json({
    success: true,
    status: 'active',
    service: 'EHN One Meta WhatsApp Webhook Verification Endpoint',
    callbackUrl: 'https://admin.kedvasshygieneproducts.com/api/webhooks/meta',
    verifyToken: verifyToken,
    instructions: 'Enter Callback URL and Verify Token in Meta Developer Portal Webhook Configuration.'
  });
});

/**
 * POST /api/webhooks/meta
 * Receive incoming WhatsApp messages & Auto-Reply Execution Engine
 */
router.post('/meta', (req, res) => {
  const timestamp = new Date().toISOString();
  const body = req.body || {};

  console.log(`\n========================================`);
  console.log(`[Meta Webhook POST Received @ ${timestamp}]`);

  let eventLog = {
    timestamp,
    ip: req.ip || req.headers['x-forwarded-for'],
    stage: 'POST_RECEIVED',
    body,
    parsedMessage: null,
    parsedStatus: null,
    autoReplySent: null
  };

  if (body.object) {
    eventLog.stage = 'OBJECT_MATCHED';
    if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value) {
      const value = body.entry[0].changes[0].value;
      eventLog.stage = 'CHANGES_PARSED';

      // Handle Incoming Messages (e.g., "hi", "stock", "price")
      if (value.messages && value.messages[0]) {
        const msgObj = value.messages[0];
        const from = msgObj.from;
        const msgText = (msgObj.text?.body || msgObj.caption || '').trim();
        const lowerText = msgText.toLowerCase();
        
        console.log(`📩 INCOMING WHATSAPP MESSAGE:`);
        console.log(`   From: +${from}`);
        console.log(`   Text: "${msgText}"`);

        eventLog.stage = 'MESSAGE_RECEIVED';
        eventLog.parsedMessage = {
          from,
          text: msgText,
          messageId: msgObj.id,
          type: msgObj.type
        };

        // AUTO-REPLY BOT ENGINE: Check customer incoming text keywords
        let autoReplyText = '';
        if (lowerText.includes('stock') || lowerText.includes('inventory') || lowerText.includes('saman')) {
          autoReplyText = `Namaste! 📦 *Kedvass Hygiene Products - Stock Info*\n\n✅ Tissue Rolls (200pk) - In Stock\n✅ Wet Wipes (50pk) - In Stock\n⚠️ Liquid Handwash 5L - Low Stock\n\nFor bulk orders, reply with your requirement!`;
        } else if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('namaste') || lowerText.includes('hey')) {
          autoReplyText = `Namaste! 🙏 Welcome to *Kedvass Hygiene Products (EHN One)*.\n\nHow can we help you today?\n1. Reply *STOCK* for product availability\n2. Reply *PRICE* for catalog prices\n3. Reply *HELP* for sales executive contact`;
        } else if (lowerText.includes('price') || lowerText.includes('rate') || lowerText.includes('catalog')) {
          autoReplyText = `💰 *Kedvass Hygiene Products Price List*\n\n1. Liquid Handwash 5L - ₹350\n2. Floor Cleaner 5L - ₹280\n3. Disinfectant Sanitizer 500ml - ₹120\n\nReply with item name to place an order!`;
        }

        if (autoReplyText) {
          eventLog.autoReplySent = autoReplyText;
          sendWhatsAppAutoReply(from, autoReplyText);
        }
      }

      // Handle Message Delivery Receipts (sent, delivered, read)
      if (value.statuses && value.statuses[0]) {
        const statusObj = value.statuses[0];
        const status = statusObj.status;
        const recipient = statusObj.recipient_id;

        console.log(`📊 WHATSAPP DELIVERY RECEIPT:`);
        console.log(`   Recipient: +${recipient}`);
        console.log(`   Status: ${status.toUpperCase()}`);

        eventLog.stage = 'STATUS_RECEIPT';
        eventLog.parsedStatus = {
          recipient,
          status,
          messageId: statusObj.id
        };
      }
    }

    lastReceivedWebhookEvent = eventLog;
    webhookLogsHistory.unshift(eventLog);
    if (webhookLogsHistory.length > 50) webhookLogsHistory.pop();

    console.log(`========================================\n`);
    return res.status(200).send('EVENT_RECEIVED');
  }

  lastReceivedWebhookEvent = eventLog;
  webhookLogsHistory.unshift(eventLog);
  return res.status(200).send('OK');
});

module.exports = router;
