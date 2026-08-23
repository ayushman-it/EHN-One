const https = require('https');
const Automation = require('../models/Automation');
const Settings = require('../models/Settings');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Get India Standard Time (IST - Asia/Kolkata) Hours, Minutes, and YYYY-MM-DD
const getIndiaTimeDetails = () => {
  const now = new Date();
  
  // Format IST time
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const timeStr = timeFormatter.format(now); // e.g. "14:48"
  const digitsOnly = timeStr.replace(/[^\d]/g, '');
  
  let istHour = 0, istMinute = 0;
  if (digitsOnly.length >= 4) {
    istHour = parseInt(digitsOnly.substring(0, 2), 10);
    istMinute = parseInt(digitsOnly.substring(2, 4), 10);
  } else {
    // Fallback: Add +5h30m to UTC
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utcMs + (330 * 60000));
    istHour = istDate.getHours();
    istMinute = istDate.getMinutes();
  }

  const currentISTMinutes = istHour * 60 + istMinute;
  const currentHHMM = `${String(istHour).padStart(2, '0')}:${String(istMinute).padStart(2, '0')}`;

  // Format YYYY-MM-DD in IST
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayStr = dateFormatter.format(now); // YYYY-MM-DD

  return { currentISTMinutes, currentHHMM, todayStr, now };
};

// Convert string like "14:46", "14:46 hrs IST", "2:46 PM" to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return -1;
  const digits = timeStr.replace(/[^\d]/g, '');
  if (digits.length >= 4) {
    const hh = parseInt(digits.substring(0, 2), 10);
    const mm = parseInt(digits.substring(2, 4), 10);
    if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) {
      return hh * 60 + mm;
    }
  }
  return -1;
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

// Execute single automation job with 100% real database metrics for ALL 8 dropdown categories
const executeAutomationJob = async (auto) => {
  try {
    const settings = await Settings.findOne();
    const config = settings?.whatsappConfig || {};
    const recipientPhone = auto.phone || config?.adminPhone || '919238695500';
    const { todayStr } = getIndiaTimeDetails();
    const category = auto.category || auto.type;

    let messageContent = '';

    // 1. SALES REVENUE EXECUTIVE SUMMARY
    if (category === 'today_summary' || category === 'sales_summary' || category === 'business_summary') {
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

      const todayInvoices = await Invoice.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const totalRevenue = todayInvoices.reduce((sum, inv) => sum + (Number(inv.total || inv.totalAmount) || 0), 0);
      const paidAmount = todayInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (Number(inv.total || inv.totalAmount) || 0), 0);
      const pendingAmount = totalRevenue - paidAmount;

      messageContent = `*DAILY SALES & BILLING EXECUTIVE REPORT*\n*Kedvass Hygiene Products*\n\n📅 *Date:* ${todayStr}\n\nReceipts: ${todayInvoices.length} Invoices\nTotal Revenue: ₹${totalRevenue.toLocaleString('en-IN')}\nRealized Collections: ₹${paidAmount.toLocaleString('en-IN')}\nPending Receivables: ₹${pendingAmount.toLocaleString('en-IN')}\n\n_Automated Server Scheduler - EHN One ERP_`;
    } 
    // 2. PRODUCT STOCK INVENTORY SUMMARY
    else if (category === 'stock_report' || category === 'stock_summary') {
      const products = await Product.find().lean();
      const total = products.length;
      const lowStock = products.filter(p => (p.quantity || p.stock || 0) <= (p.minQuantity || p.minStockAlert || 10) && (p.quantity || p.stock || 0) > 0).length;
      const outOfStock = products.filter(p => (p.quantity || p.stock || 0) <= 0).length;
      const inStock = total - lowStock - outOfStock;

      messageContent = `*INTERNAL INVENTORY STOCK AUDIT*\n*Kedvass Hygiene Products*\n\n📅 *Date:* ${todayStr}\n\nCatalog SKUs: ${total}\nIn Stock Items: ${inStock}\nLow Stock Alerts: ${lowStock}\nOut of Stock: ${outOfStock}\n\n_Automated Server Scheduler - EHN One ERP_`;
    }
    // 3. LOW STOCK WARNING ALERTS
    else if (category === 'low_stock') {
      const lowProducts = await Product.find({ quantity: { $lte: 10 } }).lean();
      if (lowProducts.length === 0) {
        messageContent = `*LOW STOCK ALERT - Kedvass Hygiene Products*\n\nAll registered SKUs adequately stocked! No reorder required today.`;
      } else {
        messageContent = `*AUTOMATED LOW STOCK ALERT*\n*Kedvass Hygiene Products*\n\nThe following ${lowProducts.length} product(s) require reorder:\n${lowProducts.map(p => `• *${p.name}*: ${p.quantity || p.stock || 0} units remaining (Min: 10)`).join('\n')}\n\nAction Required: Please issue purchase orders to suppliers.`;
      }
    }
    // 4. CUSTOMER OUTSTANDING DUES
    else if (category === 'payment_reminder' || category === 'payment_dues') {
      const debtors = await Customer.find({ balance: { $gt: 0 } }).lean();
      const totalOutstanding = debtors.reduce((sum, d) => sum + (Number(d.balance || d.dueAmount) || 0), 0);

      messageContent = `*CUSTOMER OUTSTANDING RECEIVABLES AUDIT*\n*Kedvass Hygiene Products*\n\nClients with Pending Dues: ${debtors.length}\nTotal Outstanding Receivables: ₹${totalOutstanding.toLocaleString('en-IN')}\n\nTop Pending Accounts:\n${debtors.slice(0, 5).map(d => `• *${d.name}*: ₹${Number(d.balance || d.dueAmount).toLocaleString('en-IN')}`).join('\n')}\n\n_Automated Server Scheduler - EHN One ERP_`;
    }
    // 5. PRODUCT CATALOG & PRICING INQUIRY
    else if (category === 'product_catalog') {
      const products = await Product.find().lean();
      const catalogList = products.slice(0, 10).map(p => `• *${p.name}*: ₹${p.sellingPrice || p.price || 0}/${p.unit || 'unit'} (Stock: ${p.quantity || p.stock || 0})`);
      messageContent = `*INTERNAL PRODUCT CATALOG & PRICING*\n*Kedvass Hygiene Products*\n\n📅 *Date:* ${todayStr}\n\n${catalogList.join('\n')}\n\n_EHN One Real-Time Catalog Engine_`;
    }
    // 6. CUSTOMER FOLLOW-UP CALL REMINDER
    else if (category === 'call_followup') {
      const msgStr = auto.message || auto.customMessage || 'Pending customer follow-up call schedule.';
      messageContent = `*CUSTOMER FOLLOW-UP CALL REMINDER*\n*Kedvass Hygiene Products*\n\n📅 *Date:* ${todayStr}\n\n*Task:* ${auto.title || 'Follow-up Call'}\n*Notes:* ${msgStr}\n\n_EHN One Reminders Engine_`;
    }
    // 7. CLIENT MEETING SCHEDULE REMINDER
    else if (category === 'meeting') {
      const msgStr = auto.message || auto.customMessage || 'Friendly reminder for scheduled client meeting.';
      messageContent = `*CLIENT MEETING REMINDER*\n*Kedvass Hygiene Products*\n\n📅 *Date:* ${todayStr}\n⏰ *Scheduled Time:* ${auto.time} hrs IST\n\n*Subject:* ${auto.title || 'Meeting'}\n*Details:* ${msgStr}\n\n_EHN One Reminders Engine_`;
    }
    // 8. CUSTOM EHN AI SMART REMINDER
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
      const { currentISTMinutes, currentHHMM, todayStr, now } = getIndiaTimeDetails();
      const todayNum = parseInt(todayStr.replace(/[^\d]/g, ''), 10);

      // Query MongoDB Automations
      const automations = await Automation.find({ enabled: true });

      for (const auto of automations) {
        const autoMins = parseTimeToMinutes(auto.time);
        if (autoMins < 0) continue;

        const startDateStr = (auto.startDate || auto.date || todayStr).substring(0, 10);
        const endDateStr = (auto.endDate || startDateStr || todayStr).substring(0, 10);
        
        const startNum = parseInt(startDateStr.replace(/[^\d]/g, ''), 10) || todayNum;
        const endNum = parseInt(endDateStr.replace(/[^\d]/g, ''), 10) || todayNum;

        const isWithinDateRange = (todayNum >= startNum) && (todayNum <= endNum);
        
        // Match if current IST minute is between autoMins and autoMins + 15 minutes, AND hasn't been sent today!
        const isTimeDue = (currentISTMinutes >= autoMins) && (currentISTMinutes <= autoMins + 15);
        const lastSentDateStr = auto.lastSent ? auto.lastSent.split('_')[0] : '';

        if (isWithinDateRange && isTimeDue && lastSentDateStr !== todayStr) {
          console.log(`⏰ [SERVER SCHEDULER MATCH AT ${currentHHMM} IST] Triggering "${auto.title || auto.name}" for +${auto.phone || 'Admin'}...`);
          
          auto.lastSent = `${todayStr}_${currentHHMM}`;
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
