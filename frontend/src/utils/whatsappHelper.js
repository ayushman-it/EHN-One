import axios from 'axios';

// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Format Indian Mobile Numbers cleanly (Add +91 if 10 digits)
export const formatPhoneNumber = (phoneStr) => {
  if (!phoneStr) return '';
  const digits = String(phoneStr).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
};

// Check if live API is configured in LocalStorage or Settings
export const getWhatsAppConfig = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    const automations = JSON.parse(localStorage.getItem('automations') || '{}');
    const apiConfig = automations.whatsappConfig || settings.whatsappConfig || {};
    
    return {
      apiKey: apiConfig.apiKey || '',
      phoneNumberId: apiConfig.phoneNumberId || '',
      businessAccountId: apiConfig.businessAccountId || '',
      adminPhone: formatPhoneNumber(apiConfig.adminPhone || settings.adminPhone || '9876543210'),
      isConfigured: !!(apiConfig.apiKey && apiConfig.phoneNumberId)
    };
  } catch {
    return { isConfigured: false, adminPhone: '919876543210' };
  }
};

/**
 * Universal WhatsApp Message Sender
 * Uses Live WhatsApp API if credentials exist, else opens Direct WhatsApp Web / Mobile Link
 */
export const sendWhatsAppMessage = async ({ phone, message }) => {
  const cleanPhone = formatPhoneNumber(phone);
  if (!cleanPhone) {
    alert('Please enter a valid mobile number with 10 digits.');
    return { success: false, error: 'Invalid phone number' };
  }

  const config = getWhatsAppConfig();

  if (config.isConfigured) {
    try {
      // Attempt backend API dispatch
      const res = await axios.post(`${API_BASE_URL}/settings/send-whatsapp`, {
        phone: cleanPhone,
        message,
        apiKey: config.apiKey,
        phoneNumberId: config.phoneNumberId
      }, { timeout: 4000 });

      if (res.data?.success) {
        alert(`✅ WhatsApp message sent automatically to +${cleanPhone}!`);
        return { success: true, mode: 'api' };
      }
    } catch (err) {
      console.warn('API send failed, falling back to wa.me link:', err);
    }
  }

  // Fallback 1-Tap wa.me link (Works on Mobile WhatsApp App & Desktop WhatsApp Web)
  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
  window.open(waUrl, '_blank');
  return { success: true, mode: 'redirect', url: waUrl };
};

/* ── 1-Tap Helper: Send Invoice to Customer ── */
export const sendInvoiceWhatsApp = async (invoice) => {
  const customerName = invoice.customer?.name || 'Customer';
  const customerPhone = invoice.customer?.phone || invoice.customer?.mobile || '';
  const invoiceNo = invoice.invoiceNumber || invoice.id || 'INV-001';
  const amount = Number(invoice.total || invoice.subtotal || 0).toLocaleString('en-IN');
  const dueDate = invoice.dueDate || invoice.issueDate || 'Due Today';

  const message = `🧾 *INVOICE DETAILS - ${invoice.company?.name || 'EHN One'}*

Hello *${customerName}*,

Thank you for doing business with us! Here is your invoice summary:

📌 *Invoice No:* ${invoiceNo}
📅 *Date:* ${invoice.issueDate || new Date().toISOString().split('T')[0]}
⏳ *Due Date:* ${dueDate}
💰 *Total Amount:* ₹${amount}

Items Included:
${(invoice.items || []).map(i => `• ${i.name || i.product}: ${i.quantity} x ₹${i.price} = ₹${(i.quantity * i.price).toLocaleString('en-IN')}`).join('\n')}

Payment is requested on or before the due date.

_Sent automatically via EHN One System_`;

  return sendWhatsAppMessage({ phone: customerPhone, message });
};

/* ── 1-Tap Helper: Send Payment Due Reminder (Lene Hai) ── */
export const sendCustomerPaymentReminderWhatsApp = async (customer, amount, invoiceNo = 'Pending Invoice', dueDate = 'Today') => {
  const customerName = customer.name || 'Customer';
  const customerPhone = customer.phone || customer.contact || '';
  const formattedAmount = Number(amount || customer.openingBalance || 0).toLocaleString('en-IN');

  const message = `💰 *PAYMENT REMINDER (Lene Hai)*

Hello *${customerName}*,

This is a gentle reminder that a payment of *₹${formattedAmount}* for Invoice #${invoiceNo} is due on *${dueDate}*.

Kindly make the payment at your earliest convenience to maintain an active credit period.

If you have already paid, please ignore this message.

Thank you!
_EHN One Accounts Team_`;

  return sendWhatsAppMessage({ phone: customerPhone, message });
};

/* ── 1-Tap Helper: Send Supplier Payable Alert (Dene Hai) ── */
export const sendSupplierPayableWhatsApp = async (supplier, amount, billNo = 'Purchase Bill', dueDate = 'Today') => {
  const supplierName = supplier.name || 'Supplier';
  const supplierPhone = supplier.phone || supplier.contact || '';
  const formattedAmount = Number(amount || supplier.openingBalance || 0).toLocaleString('en-IN');

  const message = `📦 *SUPPLIER PAYMENT ALERT (Dene Hai)*

Hello *${supplierName}*,

Regarding Bill #${billNo}:
Outstanding payable amount of *₹${formattedAmount}* is scheduled for payment on *${dueDate}*.

Our accounts department is processing the NEFT/RTGS transaction.

Thank you!
_EHN One Purchase Team_`;

  return sendWhatsAppMessage({ phone: supplierPhone, message });
};

/* ── 1-Tap Helper: Send Low Stock Alert to Admin ── */
export const sendLowStockWhatsAppAlert = async (productName, currentStock, threshold = 10) => {
  const config = getWhatsAppConfig();
  const adminPhone = config.adminPhone || '919876543210';

  const message = `🚨 *LOW STOCK ALERT - EHN One*

Product: *${productName}*
Current Quantity: *${currentStock} units*
Low Stock Threshold: *${threshold} units*

⚠️ *Action Required:* Product inventory is running low. Please re-order from supplier immediately.

_EHN One Inventory Automation_`;

  return sendWhatsAppMessage({ phone: adminPhone, message });
};
