const https = require('https');
const Automation = require('../models/Automation');
const Settings = require('../models/Settings');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Get India Standard Time (IST - Asia/Kolkata) HH:MM and YYYY-MM-DD
const getIndiaTimeDetails = () => {
  const now = new Date();
  
  // Format HH:MM 24-hour in IST
  const timeOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
  const timeFormatter = new Intl.DateTimeFormat('en-GB', timeOptions);
  const timeParts = timeFormatter.formatToParts(now);
  let hh = '00', mm = '00';
  for (const p of timeParts) {
    if (p.type === 'hour') hh = p.value;
    if (p.type === 'minute') mm = p.value;
  }
  if (hh === '24') hh = '00';
  const currentHHMM = `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;

  // Format YYYY-MM-DD in IST
  const dateOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const dateFormatter = new Intl.DateTimeFormat('en-CA', dateOptions);
  const todayStr = dateFormatter.format(now);

  return { currentHHMM, todayStr, now };
};

// Send HTTP POST to Meta Graph API
const dispatchWhatsApp = async (phone, message, config) => {
  const token = config?.apiKey || config?.whatsapp?.apiKey || 'EAAX71GdiWggBSU0GVjd55F7AZB2H0vC8jhELg1y1ASa9EAko9Va8dd07h8SX6sQSiFX7xs9Np0JU7KFkehgGH6rRGSwVeeWRq98jexmRoDrty5XeKZCKN6denWuVXgnL1ABfNJwee4RaZA7AjoFcjdG4DnKpDgZBlldWZAnX03tOZC9oVdSTdMDWWNFooV68xnsQZDZD';
  const phoneId = config?.phoneNumberId || config?.whatsapp?.phoneNumberId || '1221104881094408';
  
  let targetPhone = phone || config?.adminPhone || '919238695500';
  const cleanPhone = targetPhone.replace(/[^\d]/g, '');

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "text",
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
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`⏰ [SERVER SCHEDULER DISPATCH] WhatsApp Alert Sent to +${cleanPhone} | Meta Status: ${res.statusCode}`);
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, data });
      });
    });

    req.on('error', (err) => {
      console.error('Server Scheduler Request error:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
};

// Execute single automation job with 100% real database metrics
const executeAutomationJob = async (auto) => {
  try {
    const settings = await Settings.findOne();
    const config = settings?.whatsappConfig || {};
    const recipientPhone = auto.phone || config?.adminPhone || '919238695500';
    const { todayStr } = getIndiaTimeDetails();
    const category = auto.category || auto.type;

    let messageContent = '';

    if (category === 'today_summary' || category === 'sales_summary') {
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

      const todayInvoices = await Invoice.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const totalRevenue = todayInvoices.reduce((sum, inv) => sum + (Number(inv.total || inv.totalAmount) || 0), 0);
      const paidAmount = todayInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (Number(inv.total || inv.totalAmount) || 0), 0);
      const pendingAmount = totalRevenue - paidAmount;

      messageContent = `📊 *DAILY SALES & BILLING EXECUTIVE REPORT*
*Kedvass Hygiene Products*

📅 *Date:* ${todayStr}

Receipts: ${todayInvoices.length} Invoices
Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}
Realized Collections: ₹${paidAmount.toLocaleString('en-IN')}
Pending Receivables: ₹${pendingAmount.toLocaleString('en-IN')}

_Automated Server Scheduler - EHN One ERP_`;
    } 
    else if (category === 'stock_report' || category === 'stock_summary') {
      const products = await Product.find().lean();
      const total = products.length;
      const lowStock = products.filter(p => (p.quantity || p.stock || 0) <= (p.minQuantity || p.minStockAlert || 10) && (p.quantity || p.stock || 0) > 0).length;
      const outOfStock = products.filter(p => (p.quantity || p.stock || 0) <= 0).length;
      const inStock = total - lowStock - outOfStock;

      messageContent = `📦 *INTERNAL INVENTORY STOCK AUDIT*
*Kedvass Hygiene Products*

📅 *Date:* ${todayStr}

Catalog SKUs: ${total}
In Stock Items: ${inStock}
Low Stock Alerts: ${lowStock}
Out of Stock: ${outOfStock}

_Automated Server Scheduler - EHN One ERP_`;
    }
    else if (category === 'low_stock') {
      const lowProducts = await Product.find({ quantity: { $lte: 10 } }).lean();
      if (lowProducts.length === 0) {
        messageContent = `🚨 *LOW STOCK ALERT - Kedvass Hygiene Products*\n\nAll registered SKUs adequately stocked! No reorder required today.`;
      } else {
        messageContent = `🚨 *AUTOMATED LOW STOCK ALERT*
*Kedvass Hygiene Products*

The following ${lowProducts.length} product(s) require reorder:
${lowProducts.map(p => `• *${p.name}*: ${p.quantity || p.stock || 0} units remaining (Min: 10)`).join('\n')}

Action Required: Please issue purchase orders to suppliers.`;
      }
    }
    else if (category === 'payment_reminder' || category === 'payment_dues') {
      const debtors = await Customer.find({ balance: { $gt: 0 } }).lean();
      const totalOutstanding = debtors.reduce((sum, d) => sum + (Number(d.balance || d.dueAmount) || 0), 0);

      messageContent = `💰 *CUSTOMER OUTSTANDING RECEIVABLES AUDIT*
*Kedvass Hygiene Products*

Clients with Pending Dues: ${debtors.length}
Total Outstanding Receivables: ₹${totalOutstanding.toLocaleString('en-IN')}

Top Pending Accounts:
${debtors.slice(0, 5).map(d => `• *${d.name}*: ₹${Number(d.balance || d.dueAmount).toLocaleString('en-IN')}`).join('\n')}

_Automated Server Scheduler - EHN One ERP_`;
    }
    else {
      const titleStr = auto.title || auto.name || 'EHN One Scheduled Reminder';
      const msgStr = auto.message || auto.customMessage || auto.aiPrompt || 'Friendly system reminder notification.';
      messageContent = `*SCHEDULED REMINDER: ${titleStr.toUpperCase()}*\n*Kedvass Hygiene Products*\n\n${msgStr}\n\n_Auto-scheduled via EHN One Server Scheduler_`;
    }

    const result = await dispatchWhatsApp(recipientPhone, messageContent, config);

    // Update Automation Stats
    auto.lastTriggered = new Date();
    auto.triggeredCount = (auto.triggeredCount || 0) + 1;
    if (auto.save && typeof auto.save === 'function') {
      await auto.save();
    }

    return { success: true, messageContent, result };

  } catch (err) {
    console.error(`Error executing automation job ${auto._id || auto.id}:`, err);
    return { success: false, error: err.message };
  }
};

// Scheduler Runner (Checks every 15 seconds for 100% IST server-side execution reliability)
let schedulerInterval = null;

const startScheduler = () => {
  if (schedulerInterval) return;

  console.log('🚀 100% Reliable IST Server-Side WhatsApp Scheduler Service Initialized...');

  schedulerInterval = setInterval(async () => {
    try {
      const { currentHHMM, todayStr, now } = getIndiaTimeDetails();

      // Query MongoDB Automations
      const automations = await Automation.find({ enabled: true });

      for (const auto of automations) {
        const autoTime = auto.time;
        if (!autoTime) continue;

        const startDate = auto.startDate || auto.date || todayStr;
        const endDate = auto.endDate || startDate || todayStr;

        const isWithinDateRange = (todayStr >= startDate) && (todayStr <= endDate);
        const isTimeMatch = (autoTime === currentHHMM);
        const lastSentKey = `${todayStr}_${currentHHMM}`;

        if (isWithinDateRange && isTimeMatch && auto.lastSent !== lastSentKey) {
          console.log(`⏰ [SERVER SCHEDULER MATCH AT ${currentHHMM} IST] Executing "${auto.title || auto.name}" for +${auto.phone || 'Admin'}...`);
          
          auto.lastSent = lastSentKey;
          auto.lastTriggered = now;
          auto.triggeredCount = (auto.triggeredCount || 0) + 1;
          await auto.save();

          await executeAutomationJob(auto);
        }
      }
    } catch (err) {
      console.error('Error in Server WhatsApp Scheduler loop:', err);
    }
  }, 15000); // Check every 15 seconds
};

module.exports = {
  startScheduler,
  executeAutomationJob
};
