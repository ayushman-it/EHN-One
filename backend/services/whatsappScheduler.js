const https = require('https');
const Automation = require('../models/Automation');
const Settings = require('../models/Settings');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Send HTTP POST to Meta Graph API or fallback console
const dispatchWhatsApp = async (phone, message, config) => {
  if (!config?.apiKey || !config?.phoneNumberId) {
    console.log(`[WhatsApp Scheduled Runner] API Not Configured. Message to +${phone}:\n${message}`);
    return { success: true, mode: 'mock' };
  }

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { body: message }
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v18.0/${config.phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, data });
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.write(postData);
    req.end();
  });
};

// Execute single automation job
const executeAutomationJob = async (auto) => {
  try {
    const settings = await Settings.findOne();
    const config = settings?.whatsappConfig || {};
    const recipientPhone = auto.phone || settings?.adminPhone || '919876543210';
    const todayStr = new Date().toISOString().split('T')[0];

    let messageContent = '';

    if (auto.type === 'today_summary') {
      // Build Today's Business Summary
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

      const todayInvoices = await Invoice.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const totalRevenue = todayInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
      const paidAmount = todayInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
      const pendingAmount = totalRevenue - paidAmount;

      messageContent = `📊 *DAILY BUSINESS SUMMARY REPORT - EHN One*

📅 *Date:* ${todayStr}

🧾 *Today's Invoices Created:* ${todayInvoices.length}
💰 *Total Sales Revenue:* ₹${totalRevenue.toLocaleString('en-IN')}
✅ *Cash / Payment Collected:* ₹${paidAmount.toLocaleString('en-IN')}
⏳ *Pending / Credit Amount:* ₹${pendingAmount.toLocaleString('en-IN')}

_Automated Daily Summary Report_`;
    } 
    else if (auto.type === 'stock_report') {
      // Build Product Stock Summary Report
      const products = await Product.find();
      const total = products.length;
      const lowStock = products.filter(p => p.quantity <= (p.lowStockThreshold || 10) && p.quantity > 0).length;
      const outOfStock = products.filter(p => p.quantity <= 0).length;
      const inStock = total - lowStock - outOfStock;

      messageContent = `📦 *DAILY PRODUCT INVENTORY REPORT - EHN One*

📅 *Date:* ${todayStr}

📊 *Total Catalog Products:* ${total}
✅ *In Stock Items:* ${inStock}
⚠️ *Low Stock Items:* ${lowStock}
❌ *Out of Stock Items:* ${outOfStock}

_Automated Inventory Status Report_`;
    }
    else if (auto.type === 'low_stock') {
      // Build Low Stock Alert
      const lowProducts = await Product.find({ quantity: { $lte: 10 } });
      if (lowProducts.length === 0) return { skipped: true, reason: 'No low stock items' };

      messageContent = `🚨 *AUTOMATED LOW STOCK ALERT - EHN One*

The following ${lowProducts.length} product(s) are running low:
${lowProducts.map(p => `• *${p.name}*: ${p.quantity} units remaining (Threshold: 10)`).join('\n')}

⚠️ *Action Required:* Please re-order from suppliers immediately.`;
    }
    else if (auto.type === 'payment_reminder') {
      // Build Customer Outstanding Ledger Summary
      const debtors = await Customer.find({ openingBalance: { $gt: 0 } });
      const totalOutstanding = debtors.reduce((sum, d) => sum + (Number(d.openingBalance) || 0), 0);

      messageContent = `💰 *CUSTOMER RECEIVABLES (LENE HAI) SUMMARY*

📊 *Active Debtors with Dues:* ${debtors.length}
💵 *Total Outstanding Receivables:* ₹${totalOutstanding.toLocaleString('en-IN')}

Top Pending Accounts:
${debtors.slice(0, 5).map(d => `• *${d.name}*: ₹${Number(d.openingBalance).toLocaleString('en-IN')} (${d.phone || 'No phone'})`).join('\n')}

_Automated Accounts Receivable Reminder_`;
    }
    else {
      messageContent = auto.customMessage || `Automated update for ${auto.name} - EHN One`;
    }

    const result = await dispatchWhatsApp(recipientPhone, messageContent, config);

    // Update Automation Stats
    auto.lastTriggered = new Date();
    auto.triggeredCount = (auto.triggeredCount || 0) + 1;
    await auto.save();

    return { success: true, messageContent, result };

  } catch (err) {
    console.error(`Error executing automation job ${auto._id}:`, err);
    return { success: false, error: err.message };
  }
};

// Scheduler Runner (Checks every minute)
let schedulerInterval = null;

const startScheduler = () => {
  if (schedulerInterval) return;

  console.log('🚀 Automated WhatsApp Scheduler Service Initialized...');

  schedulerInterval = setInterval(async () => {
    try {
      const now = new Date();
      const currentHHMM = now.toTimeString().substring(0, 5); // "20:00"

      const automations = await Automation.find({ enabled: true });

      for (const auto of automations) {
        if (!auto.time) continue;

        // Match time e.g., "20:00" or "09:00"
        if (auto.time === currentHHMM) {
          const lastRun = auto.lastTriggered ? new Date(auto.lastTriggered) : null;
          const diffMinutes = lastRun ? (now - lastRun) / (1000 * 60) : 9999;

          // Prevent double trigger within 55 minutes
          if (diffMinutes > 55) {
            console.log(`⏰ Executing Scheduled WhatsApp Job "${auto.name}" at ${currentHHMM}...`);
            await executeAutomationJob(auto);
          }
        }
      }
    } catch (err) {
      console.error('Error in WhatsApp Scheduler loop:', err);
    }
  }, 60000); // Check every 60 seconds
};

module.exports = {
  startScheduler,
  executeAutomationJob
};
