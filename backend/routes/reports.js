const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');

// GET /api/reports/summary - Aggregate metrics for analytics
router.get('/summary', async (req, res) => {
  try {
    const products = await Product.find();
    const invoices = await Invoice.find();
    const customers = await Customer.find();
    const suppliers = await Supplier.find();
    const warehouses = await Warehouse.find();

    // 1. Sales & Revenue Metrics
    const totalSalesRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const totalPaidCollections = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const totalPendingReceivables = totalSalesRevenue - totalPaidCollections;

    // 2. GST Tax Breakdown
    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    invoices.forEach(inv => {
      const subtotal = Number(inv.subtotal) || Number(inv.total) * 0.84;
      const tax = Number(inv.tax) || Number(inv.total) * 0.16;
      totalTaxableValue += subtotal;
      
      // Default split CGST/SGST (intra-state) vs IGST (inter-state)
      if (inv.customer?.state && inv.customer.state !== 'Delhi') {
        totalIGST += tax;
      } else {
        totalCGST += tax / 2;
        totalSGST += tax / 2;
      }
    });

    // 3. Stock Valuation Metrics
    const totalCatalogProducts = products.length;
    const totalStockQuantity = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const stockValuationCost = products.reduce((sum, p) => sum + ((Number(p.purchasePrice) || Number(p.price) * 0.7) * (Number(p.quantity) || 0)), 0);
    const stockValuationRetail = products.reduce((sum, p) => sum + (Number(p.price) * (Number(p.quantity) || 0)), 0);
    const lowStockCount = products.filter(p => p.quantity <= (p.lowStockThreshold || 10)).length;

    // 4. Ledger Outstanding Dues
    const customerDebtorsDues = customers.reduce((sum, c) => sum + (Number(c.openingBalance) || 0), 0);
    const supplierCreditorsDues = suppliers.reduce((sum, s) => sum + (Number(s.openingBalance) || 0), 0);

    res.json({
      success: true,
      data: {
        sales: {
          totalRevenue: totalSalesRevenue,
          paidCollections: totalPaidCollections,
          pendingReceivables: totalPendingReceivables,
          invoiceCount: invoices.length,
          avgOrderValue: invoices.length > 0 ? (totalSalesRevenue / invoices.length) : 0,
        },
        gst: {
          taxableValue: totalTaxableValue,
          totalTax: totalCGST + totalSGST + totalIGST,
          cgst: totalCGST,
          sgst: totalSGST,
          igst: totalIGST,
        },
        inventory: {
          totalProducts: totalCatalogProducts,
          totalQuantity: totalStockQuantity,
          valuationCost: stockValuationCost,
          valuationRetail: stockValuationRetail,
          lowStockItemsCount: lowStockCount,
        },
        ledgers: {
          debtorsReceivable: customerDebtorsDues,
          creditorsPayable: supplierCreditorsDues,
          netBalance: customerDebtorsDues - supplierCreditorsDues,
        },
        warehouseCount: warehouses.length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/export/gst - CSV Exporter for GST Sales Report
router.get('/export/gst', async (req, res) => {
  try {
    const invoices = await Invoice.find();
    let csv = 'Invoice No,Issue Date,Customer Name,GSTIN,State,Taxable Value (₹),CGST (₹),SGST (₹),IGST (₹),Total Amount (₹),Status\n';

    invoices.forEach(inv => {
      const invNo = inv.invoiceNumber || inv.id;
      const date = inv.issueDate || (inv.createdAt ? inv.createdAt.split('T')[0] : '');
      const custName = `"${(inv.customer?.name || 'Walk-in Client').replace(/"/g, '""')}"`;
      const gstin = inv.customer?.gstin || 'Unregistered';
      const state = inv.customer?.state || 'Delhi';
      const total = Number(inv.total) || 0;
      const subtotal = Number(inv.subtotal) || total * 0.84;
      const tax = Number(inv.tax) || total * 0.16;

      let cgst = 0, sgst = 0, igst = 0;
      if (state !== 'Delhi') {
        igst = tax;
      } else {
        cgst = tax / 2;
        sgst = tax / 2;
      }

      csv += `${invNo},${date},${custName},${gstin},${state},${subtotal.toFixed(2)},${cgst.toFixed(2)},${sgst.toFixed(2)},${igst.toFixed(2)},${total.toFixed(2)},${inv.status || 'paid'}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=GSTR1_Sales_Report.csv');
    res.status(200).send(csv);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/export/stock - CSV Exporter for Stock Valuation
router.get('/export/stock', async (req, res) => {
  try {
    const products = await Product.find();
    let csv = 'SKU,Product Name,Category,Quantity,Unit,Sales Price (₹),Purchase Price (₹),Total Valuation (₹),Status\n';

    products.forEach(p => {
      const sku = p.sku || 'SKU-000';
      const name = `"${(p.name || '').replace(/"/g, '""')}"`;
      const category = p.category || 'General';
      const qty = p.quantity || 0;
      const unit = p.unit || 'Pcs';
      const price = p.price || 0;
      const cost = p.purchasePrice || price * 0.7;
      const totalVal = qty * cost;
      const status = qty <= 0 ? 'Out of Stock' : (qty <= (p.lowStockThreshold || 10) ? 'Low Stock' : 'In Stock');

      csv += `${sku},${name},${category},${qty},${unit},${price},${cost.toFixed(2)},${totalVal.toFixed(2)},${status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=Inventory_Stock_Valuation_Report.csv');
    res.status(200).send(csv);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
