const express = require('express');
const router = express.Router();
const https = require('https');
const Settings = require('../models/Settings');
const Product = require('../models/Product');

let lastReceivedWebhookEvent = null;
let webhookLogsHistory = [];

/**
 * Helper to dispatch automatic WhatsApp reply
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
        console.log(`🤖 Internal System Auto-Reply Dispatched to +${cleanPhone}: Status ${res.statusCode}`);
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

  let verifyToken = process.env.META_VERIFY_TOKEN || 'ehn_one_whatsapp_verify_token_2026';
  try {
    const settings = await Settings.findOne();
    if (settings?.whatsapp?.webhookVerifyToken) {
      verifyToken = settings.whatsapp.webhookVerifyToken;
    }
  } catch (e) {}

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

  return res.status(200).json({
    success: true,
    status: 'active',
    service: 'EHN One Meta WhatsApp Webhook Verification Endpoint',
    callbackUrl: 'https://admin.kedvasshygieneproducts.com/api/webhooks/meta',
    verifyToken: verifyToken
  });
});

/**
 * POST /api/webhooks/meta
 * Receive incoming WhatsApp messages & Real-Time DB Audit Auto-Reply Engine
 */
router.post('/meta', async (req, res) => {
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

      // Handle Incoming Messages
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

        // DYNAMIC REAL DATABASE QUERY FOR INTERNAL SYSTEM AUTO-REPLY (NO DUMMY PRODUCTS OR SALES PITCHES)
        let autoReplyText = '';
        if (lowerText.includes('stock') || lowerText.includes('inventory') || lowerText.includes('saman')) {
          try {
            const products = await Product.find().lean();
            const totalCount = products.length;
            const inStockCount = products.filter(p => (p.quantity || p.stock || 0) > 0).length;
            const lowStockList = products
              .filter(p => (p.quantity || p.stock || 0) <= (p.minQuantity || p.minStockAlert || 10))
              .slice(0, 5)
              .map(p => `${p.name}: ${p.quantity || p.stock || 0} ${p.unit || 'units'}`);

            autoReplyText = `*INTERNAL INVENTORY SYSTEM AUDIT*\n*Kedvass Hygiene Products*\n\n*Live SKUs:* ${inStockCount}/${totalCount} In Stock\n\n*Low Stock Items List:*\n- ${lowStockList.length > 0 ? lowStockList.join('\n- ') : 'All registered products adequately stocked.'}\n\n_EHN AI System Engine_`;
          } catch (e) {
            autoReplyText = `*INTERNAL INVENTORY AUDIT*\n*Kedvass Hygiene Products*\n\nLive Database Audit Executed.\n\n_EHN AI System Engine_`;
          }
        } else if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('namaste') || lowerText.includes('hey')) {
          autoReplyText = `*INTERNAL SYSTEM ASSISTANT*\n*Kedvass Hygiene Products (EHN One)*\n\nSystem Commands:\n1. Reply *STOCK* for real-time inventory audit\n2. Reply *REVENUE* for today sales overview`;
        }

        if (autoReplyText) {
          eventLog.autoReplySent = autoReplyText;
          sendWhatsAppAutoReply(from, autoReplyText);
        }
      }

      // Handle Delivery Receipts
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
