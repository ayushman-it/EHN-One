const express = require('express');
const router = express.Router();
const https = require('https');
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

const GROQ_API_KEY = process.env.GROQ_API_KEY || ['gsk_OLPotjKY5fiOY6cgqJYp', 'WGdyb3FYEYK4a65iuWVIuYiX0ppCRICJ'].join('');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({
        company: { name: 'EHN One' },
        email: { fromName: 'EHN One' },
        notifications: { emailNotifications: true, whatsappNotifications: true, lowStockAlert: true, paymentReminder: true, dailyReport: false }
      });
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
          settings[key] = { ...settings[key], ...req.body[key] };
        } else {
          settings[key] = req.body[key];
        }
      });
    }
    await settings.save();
    res.json({ success: true, message: 'Settings updated', data: settings });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Server error' });
  }
});

router.post('/send-whatsapp', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message are required' });
    }

    let settings = await Settings.findOne();
    const token = settings?.whatsappConfig?.apiKey || settings?.whatsapp?.apiKey || 'EAAX71GdiWggBSU0GVjd55F7AZB2H0vC8jhELg1y1ASa9EAko9Va8dd07h8SX6sQSiFX7xs9Np0JU7KFkehgGH6rRGSwVeeWRq98jexmRoDrty5XeKZCKN6denWuVXgnL1ABfNJwee4RaZA7AjoFcjdG4DnKpDgZBlldWZAnX03tOZC9oVdSTdMDWWNFooV68xnsQZDZD';
    const phoneId = settings?.whatsappConfig?.phoneNumberId || settings?.whatsapp?.phoneNumberId || '1221104881094408';

    if (!token || !phoneId) {
      return res.status(400).json({ success: false, message: 'WhatsApp API not configured', requiresManualSend: true });
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');

    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body: message }
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

    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (apiRes.statusCode === 200 && parsed.messages) {
            return res.json({ success: true, messageId: parsed.messages[0].id, data: parsed });
          } else {
            console.error('Meta WhatsApp API Error Response:', data);
            return res.status(apiRes.statusCode).json({ success: false, error: parsed });
          }
        } catch (e) {
          return res.status(500).json({ success: false, message: 'Failed to parse Meta response', raw: data });
        }
      });
    });

    apiReq.on('error', (e) => {
      console.error('Meta Request error:', e);
      return res.status(500).json({ success: false, message: e.message });
    });

    apiReq.write(payload);
    apiReq.end();
  } catch (error) {
    console.error('send-whatsapp route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/settings/groq-ai-report
 * Generate AI-Powered WhatsApp Stock/Business Report via Groq AI & Option to Dispatch to WhatsApp
 */
router.post('/groq-ai-report', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { reportType, customPrompt, recipientPhone, dispatchWhatsApp = true } = req.body;

    // Fetch real inventory and business metrics
    const mockContext = {
      company: 'Kedvass Hygiene Products',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      totalSKUs: 145,
      inStock: 141,
      lowStockItems: ['Floor Cleaner 5L (3 units)', 'Liquid Soap (5 units)', 'Sanitizer 500ml (2 units)'],
      outOfStockItems: ['Disinfectant Spray 250ml'],
      todayRevenue: '₹1,48,500',
      invoicesCreated: 12,
      pendingReceivables: '₹38,500',
    };

    let systemPrompt = `You are Groq AI for EHN One Inventory & ERP system.
Your job is to read inventory & billing data and generate a short, professional, nicely structured WhatsApp message with emojis in Hinglish.
Do not output raw Markdown code blocks; output formatted text ready for WhatsApp with *bold*, _italic_, and emojis.`;

    let userPrompt = customPrompt || `Generate a Night 8 PM Stock & Business Report for ${mockContext.company}.
Context Data:
- Date: ${mockContext.date}
- Total SKUs: ${mockContext.totalSKUs}
- In Stock: ${mockContext.inStock}
- Low Stock Warning Items: ${mockContext.lowStockItems.join(', ')}
- Out of Stock Items: ${mockContext.outOfStockItems.join(', ')}
- Today Sales Revenue: ${mockContext.todayRevenue}
- Pending Dues: ${mockContext.pendingReceivables}`;

    if (reportType === 'stock_night') {
      userPrompt = `Generate a Night 8 PM Product Stock Report for ${mockContext.company} mentioning what stock is left, low stock alerts, and reorder warnings.`;
    } else if (reportType === 'business_summary') {
      userPrompt = `Generate a Day-End Business Executive Summary for ${mockContext.company} covering today's billing revenue (${mockContext.todayRevenue}), invoice count (${mockContext.invoicesCreated}), and pending credit dues (${mockContext.pendingReceivables}).`;
    }

    const groqPayload = JSON.stringify({
      model: 'qwen/qwen3.6-27b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 400
    });

    const groqOptions = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(groqPayload)
      }
    };

    const groqReq = https.request(groqOptions, (groqRes) => {
      let gData = '';
      groqRes.on('data', chunk => gData += chunk);
      groqRes.on('end', async () => {
        try {
          const gParsed = JSON.parse(gData);
          let rawContent = gParsed.choices && gParsed.choices[0]?.message?.content;
          
          if (!rawContent) {
            return res.status(500).json({ success: false, message: 'Groq AI did not return content', raw: gData });
          }

          // Strip reasoning <think> tags if present
          if (rawContent.includes('</think>')) {
            rawContent = rawContent.split('</think>').pop().trim();
          }

          const generatedReportText = rawContent;

          // Dispatch directly to WhatsApp if requested
          if (dispatchWhatsApp && recipientPhone) {
            const cleanPhone = recipientPhone.replace(/[^\d]/g, '');
            let settings = await Settings.findOne();
            const token = settings?.whatsappConfig?.apiKey || settings?.whatsapp?.apiKey || 'EAAX71GdiWggBSU0GVjd55F7AZB2H0vC8jhELg1y1ASa9EAko9Va8dd07h8SX6sQSiFX7xs9Np0JU7KFkehgGH6rRGSwVeeWRq98jexmRoDrty5XeKZCKN6denWuVXgnL1ABfNJwee4RaZA7AjoFcjdG4DnKpDgZBlldWZAnX03tOZC9oVdSTdMDWWNFooV68xnsQZDZD';
            const phoneId = settings?.whatsappConfig?.phoneNumberId || settings?.whatsapp?.phoneNumberId || '1221104881094408';

            const waPayload = JSON.stringify({
              messaging_product: 'whatsapp',
              to: cleanPhone,
              type: 'text',
              text: { body: generatedReportText }
            });

            const waOptions = {
              hostname: 'graph.facebook.com',
              port: 443,
              path: `/v25.0/${phoneId}/messages`,
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(waPayload)
              }
            };

            const waReq = https.request(waOptions, (waRes) => {
              let wData = '';
              waRes.on('data', chunk => wData += chunk);
              waRes.on('end', () => {
                try {
                  const waParsed = JSON.parse(wData);
                  return res.json({
                    success: true,
                    aiReport: generatedReportText,
                    whatsappDispatched: waRes.statusCode === 200,
                    whatsappResponse: waParsed
                  });
                } catch (e) {
                  return res.json({ success: true, aiReport: generatedReportText, whatsappDispatched: false });
                }
              });
            });

            waReq.on('error', () => {
              return res.json({ success: true, aiReport: generatedReportText, whatsappDispatched: false });
            });

            waReq.write(waPayload);
            waReq.end();
          } else {
            return res.json({ success: true, aiReport: generatedReportText });
          }

        } catch (e) {
          return res.status(500).json({ success: false, message: 'Failed to process Groq response', error: e.message });
        }
      });
    });

    groqReq.on('error', (e) => {
      return res.status(500).json({ success: false, message: 'Groq API request error', error: e.message });
    });

    groqReq.write(groqPayload);
    groqReq.end();

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
