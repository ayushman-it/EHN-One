const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

// Helper to escape XML special characters
const xmlEscape = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// GET /api/tally/export/ledgers - Export Customers & Suppliers as Tally XML
router.get('/export/ledgers', async (req, res) => {
  try {
    const customers = await Customer.find({ status: 'active' });
    const suppliers = await Supplier.find({ status: 'active' });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>All Masters</REPORTNAME>\n      </REQUESTDESC>\n      <REQUESTDATA>\n`;

    // Add Customers (Sundry Debtors)
    customers.forEach(c => {
      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <LEDGER NAME="${xmlEscape(c.name)}" ACTION="Create">\n`;
      xml += `            <PARENT>Sundry Debtors</PARENT>\n`;
      xml += `            <MAINTAINBILLWISE>${c.maintainBillByBill ? 'Yes' : 'No'}</MAINTAINBILLWISE>\n`;
      xml += `            <CREDITDAYS>${c.defaultCreditPeriod || 30}</CREDITDAYS>\n`;
      xml += `            <ADDRESS.LIST><ADDRESS>${xmlEscape(c.address)}</ADDRESS></ADDRESS.LIST>\n`;
      xml += `            <STATENAME>${xmlEscape(c.state || 'Delhi')}</STATENAME>\n`;
      xml += `            <COUNTRYNAME>${xmlEscape(c.country || 'India')}</COUNTRYNAME>\n`;
      xml += `            <PINCODE>${xmlEscape(c.pincode)}</PINCODE>\n`;
      xml += `            <GSTREGISTRATIONTYPE>${xmlEscape(c.gstRegistrationType || 'Unregistered')}</GSTREGISTRATIONTYPE>\n`;
      if (c.gstin) xml += `            <PARTYGSTIN>${xmlEscape(c.gstin)}</PARTYGSTIN>\n`;
      if (c.pan) xml += `            <INCOMETAXNUMBER>${xmlEscape(c.pan)}</INCOMETAXNUMBER>\n`;
      if (c.openingBalance) {
        const balSign = c.openingBalanceType === 'Dr' ? '-' : '';
        xml += `            <OPENINGBALANCE>${balSign}${c.openingBalance}</OPENINGBALANCE>\n`;
      }
      xml += `          </LEDGER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    // Add Suppliers (Sundry Creditors)
    suppliers.forEach(s => {
      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <LEDGER NAME="${xmlEscape(s.name)}" ACTION="Create">\n`;
      xml += `            <PARENT>Sundry Creditors</PARENT>\n`;
      xml += `            <MAINTAINBILLWISE>${s.maintainBillByBill ? 'Yes' : 'No'}</MAINTAINBILLWISE>\n`;
      xml += `            <CREDITDAYS>${s.defaultCreditPeriod || 30}</CREDITDAYS>\n`;
      xml += `            <ADDRESS.LIST><ADDRESS>${xmlEscape(s.address)}</ADDRESS></ADDRESS.LIST>\n`;
      xml += `            <STATENAME>${xmlEscape(s.state || 'Delhi')}</STATENAME>\n`;
      xml += `            <COUNTRYNAME>${xmlEscape(s.country || 'India')}</COUNTRYNAME>\n`;
      xml += `            <PINCODE>${xmlEscape(s.pincode)}</PINCODE>\n`;
      xml += `            <GSTREGISTRATIONTYPE>${xmlEscape(s.gstRegistrationType || 'Regular')}</GSTREGISTRATIONTYPE>\n`;
      if (s.gst) xml += `            <PARTYGSTIN>${xmlEscape(s.gst)}</PARTYGSTIN>\n`;
      if (s.pan) xml += `            <INCOMETAXNUMBER>${xmlEscape(s.pan)}</INCOMETAXNUMBER>\n`;
      if (s.openingBalance) {
        const balSign = s.openingBalanceType === 'Dr' ? '-' : '';
        xml += `            <OPENINGBALANCE>${balSign}${s.openingBalance}</OPENINGBALANCE>\n`;
      }
      xml += `          </LEDGER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    xml += `      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="tally_ledgers.xml"');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tally/export/items - Export Products (Stock Items) as Tally XML
router.get('/export/items', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>All Masters</REPORTNAME>\n      </REQUESTDESC>\n      <REQUESTDATA>\n`;

    products.forEach(p => {
      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <STOCKITEM NAME="${xmlEscape(p.name)}" ACTION="Create">\n`;
      xml += `            <PARENT>${xmlEscape(p.category || 'Primary')}</PARENT>\n`;
      xml += `            <BASEUNITS>${xmlEscape(p.unit || 'PCS')}</BASEUNITS>\n`;
      xml += `            <GSTAPPLICABLE>Applicable</GSTAPPLICABLE>\n`;
      xml += `            <GSTTYPEOFSUPPLY>${xmlEscape(p.typeOfSupply || 'Goods')}</GSTTYPEOFSUPPLY>\n`;
      xml += `            <HSNCODE>${xmlEscape(p.hsnCode || '')}</HSNCODE>\n`;
      xml += `            <GSTRATE>${p.gstRate || 18}</GSTRATE>\n`;
      xml += `            <OPENINGBALANCE>${p.quantity || 0} ${xmlEscape(p.unit || 'PCS')}</OPENINGBALANCE>\n`;
      xml += `            <OPENINGVALUE>${(p.cost || p.price || 0) * (p.quantity || 0)}</OPENINGVALUE>\n`;
      xml += `            <OPENINGRATE>${p.cost || p.price || 0}/${xmlEscape(p.unit || 'PCS')}</OPENINGRATE>\n`;
      xml += `          </STOCKITEM>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    xml += `      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="tally_stock_items.xml"');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
