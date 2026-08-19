import React, { useState, useEffect } from 'react';
import { getInvoices } from '../services/api';

export default function LedgerStatementModal({ party, partyType = 'Debtor', onClose }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadPartyTransactions();
  }, [party]);

  const loadPartyTransactions = async () => {
    try {
      setLoading(true);
      const res = await getInvoices();
      const allInvoices = res.data || res || [];
      const partyInvoices = allInvoices.filter(inv => {
        const invCustName = inv.customer?.name || '';
        return invCustName.toLowerCase().trim() === (party.name || '').toLowerCase().trim();
      });
      setInvoices(partyInvoices);
    } catch (err) {
      console.log('Error loading party invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const isDebtor = partyType === 'Debtor' || party.group === 'Sundry Debtors';

  const rawOpeningBal = Number(party.openingBalance) || 0;
  const openingType = party.openingBalanceType || (isDebtor ? 'Dr' : 'Cr');

  const entries = [];

  invoices.forEach(inv => {
    const invDate = inv.issueDate || (inv.createdAt ? inv.createdAt.split('T')[0] : '2026-08-10');
    const amount = Number(inv.total) || 0;
    entries.push({
      date: invDate,
      voucherType: isDebtor ? 'Sales Invoice' : 'Purchase Voucher',
      voucherNo: inv.invoiceNumber || inv.id || 'INV-001',
      particulars: isDebtor ? 'Sales Account' : 'Purchase Account',
      drAmount: isDebtor ? amount : 0,
      crAmount: isDebtor ? 0 : amount,
    });

    if (inv.status === 'paid') {
      entries.push({
        date: inv.paidDate || invDate,
        voucherType: isDebtor ? 'Receipt' : 'Payment',
        voucherNo: `RCT-${inv.invoiceNumber || inv.id}`,
        particulars: 'Bank / Cash Account',
        drAmount: isDebtor ? 0 : amount,
        crAmount: isDebtor ? amount : 0,
      });
    }
  });

  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  const filteredEntries = entries.filter(e => {
    if (dateFrom && new Date(e.date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(e.date) > new Date(dateTo)) return false;
    return true;
  });

  let runningBalance = openingType === 'Dr' ? rawOpeningBal : -rawOpeningBal;
  let totalDr = 0;
  let totalCr = 0;

  const tableRows = filteredEntries.map((e, idx) => {
    totalDr += e.drAmount;
    totalCr += e.crAmount;

    if (isDebtor) {
      runningBalance += (e.drAmount - e.crAmount);
    } else {
      runningBalance += (e.crAmount - e.drAmount);
    }

    const balType = runningBalance >= 0 ? (isDebtor ? 'Dr' : 'Cr') : (isDebtor ? 'Cr' : 'Dr');

    return {
      ...e,
      id: idx,
      runningBalance: Math.abs(runningBalance),
      balanceType: balType
    };
  });

  const finalNetBalance = Math.abs(runningBalance);
  const finalNetType = runningBalance >= 0 ? (isDebtor ? 'Dr' : 'Cr') : (isDebtor ? 'Cr' : 'Dr');

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) return alert('Pop-up blocked! Please allow pop-ups to print ledger statement.');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ledger_Statement_${party.name.replace(/\s+/g, '_')}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 13px; color: #1e293b; margin: 0; padding: 15px; }
          .header { border-bottom: 2px solid #7367f0; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; }
          .party-title { font-size: 18px; font-weight: bold; color: #7367f0; }
          .sub { font-size: 12px; color: #64748b; margin-top: 3px; }
          .summary-box { display: flex; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 15px; margin-bottom: 15px; justify-content: space-between; }
          .sum-item { text-align: center; }
          .sum-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .sum-val { font-size: 15px; font-weight: bold; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          .text-end { text-align: right; }
          .fw-bold { font-weight: bold; }
          .tfoot-row td { background: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="party-title">${party.name}</div>
            <div class="sub">Account Ledger Statement • ${party.group || (isDebtor ? 'Sundry Debtors' : 'Sundry Creditors')}</div>
            <div class="sub">${party.address || ''} ${party.state ? ', ' + party.state : ''}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; font-size: 14px;">GSTIN: ${party.gstin || party.gst || 'Unregistered'}</div>
            <div class="sub">Phone: ${party.phone || '-'}</div>
            <div class="sub">Statement Date: ${new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        <div class="summary-box">
          <div class="sum-item">
            <div class="sum-label">Opening Balance</div>
            <div class="sum-val">₹ ${rawOpeningBal.toLocaleString('en-IN')} (${openingType})</div>
          </div>
          <div class="sum-item">
            <div class="sum-label">Total Debit (Dr)</div>
            <div class="sum-val" style="color: #7367f0;">₹ ${totalDr.toLocaleString('en-IN')}</div>
          </div>
          <div class="sum-item">
            <div class="sum-label">Total Credit (Cr)</div>
            <div class="sum-val" style="color: #28c76f;">₹ ${totalCr.toLocaleString('en-IN')}</div>
          </div>
          <div class="sum-item">
            <div class="sum-label">Net Closing Balance</div>
            <div class="sum-val" style="color: #7367f0;">₹ ${finalNetBalance.toLocaleString('en-IN')} (${finalNetType})</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher Type</th>
              <th>Voucher No</th>
              <th>Particulars</th>
              <th class="text-end">Debit (Dr ₹)</th>
              <th class="text-end">Credit (Cr ₹)</th>
              <th class="text-end">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>-</strong></td>
              <td><strong>Opening Balance</strong></td>
              <td>-</td>
              <td>B/F Opening Balance</td>
              <td class="text-end">${openingType === 'Dr' ? rawOpeningBal.toLocaleString('en-IN') : '-'}</td>
              <td class="text-end">${openingType === 'Cr' ? rawOpeningBal.toLocaleString('en-IN') : '-'}</td>
              <td class="text-end"><strong>₹ ${rawOpeningBal.toLocaleString('en-IN')} (${openingType})</strong></td>
            </tr>
            ${tableRows.map(r => `
              <tr>
                <td>${r.date}</td>
                <td>${r.voucherType}</td>
                <td><strong>${r.voucherNo}</strong></td>
                <td>${r.particulars}</td>
                <td class="text-end" style="color: #7367f0;">${r.drAmount ? '₹ ' + r.drAmount.toLocaleString('en-IN') : '-'}</td>
                <td class="text-end" style="color: #28c76f;">${r.crAmount ? '₹ ' + r.crAmount.toLocaleString('en-IN') : '-'}</td>
                <td class="text-end"><strong>₹ ${r.runningBalance.toLocaleString('en-IN')} (${r.balanceType})</strong></td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="tfoot-row">
              <td colspan="4">Total Movements & Net Closing Balance</td>
              <td class="text-end">₹ ${totalDr.toLocaleString('en-IN')}</td>
              <td class="text-end">₹ ${totalCr.toLocaleString('en-IN')}</td>
              <td class="text-end">₹ ${finalNetBalance.toLocaleString('en-IN')} (${finalNetType})</td>
            </tr>
          </tfoot>
        </table>
        <script>window.onload = function() { window.focus(); window.print(); };</script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 960, width: '92%' }}>
        
        {/* Theme Header */}
        <div className="modal-box-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-journal-bookmark" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}></i>
            <div>
              <div className="fw-bold" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {party.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ledger Statement • {party.group || (isDebtor ? 'Sundry Debtors' : 'Sundry Creditors')} • {party.state || 'Delhi'}
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="modal-box-body" style={{ padding: '20px 24px', overflowY: 'auto' }}>
          
          {/* Stats Row aligned with theme */}
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-6">
              <div className="stat-card p-3">
                <div className="stat-card-label" style={{ fontSize: '0.7rem' }}>OPENING BALANCE</div>
                <div className="fw-bold fs-6 mt-1">
                  ₹ {rawOpeningBal.toLocaleString('en-IN')} <small className="text-muted">({openingType})</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card p-3" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div className="stat-card-label" style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>TOTAL DEBITS (DR)</div>
                <div className="fw-bold fs-6 mt-1" style={{ color: 'var(--primary)' }}>
                  ₹ {totalDr.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card p-3" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="stat-card-label" style={{ fontSize: '0.7rem', color: 'var(--success)' }}>TOTAL CREDITS (CR)</div>
                <div className="fw-bold fs-6 mt-1" style={{ color: 'var(--success)' }}>
                  ₹ {totalCr.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card p-3" style={{ background: 'var(--sidebar-hover-bg)', borderLeft: '4px solid var(--primary)' }}>
                <div className="stat-card-label" style={{ fontSize: '0.7rem' }}>NET CLOSING BALANCE</div>
                <div className="fw-bold fs-6 mt-1" style={{ color: 'var(--primary)' }}>
                  ₹ {finalNetBalance.toLocaleString('en-IN')} ({finalNetType})
                </div>
              </div>
            </div>
          </div>

          {/* Date Filter Bar */}
          <div className="v-card mb-3" style={{ background: '#f8fafc' }}>
            <div className="v-card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-calendar3 me-1"></i> Date Filter:
                </span>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ width: 140 }}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>to</span>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ width: 140 }}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
                {(dateFrom || dateTo) && (
                  <button className="btn-v light btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                    Clear
                  </button>
                )}
              </div>
              <button className="btn-v primary" onClick={handlePrint}>
                <i className="bi bi-printer"></i> Print Statement
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="v-card">
            <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
              <table className="v-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher Type</th>
                    <th>Voucher No</th>
                    <th>Particulars</th>
                    <th className="text-end">Debit (Dr ₹)</th>
                    <th className="text-end">Credit (Cr ₹)</th>
                    <th className="text-end">Closing Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr style={{ background: 'rgba(0,0,0,0.02)', fontWeight: 600 }}>
                    <td>-</td>
                    <td><span className="badge-v secondary">Opening Balance</span></td>
                    <td>-</td>
                    <td>B/F Opening Ledger Balance</td>
                    <td className="text-end">{openingType === 'Dr' ? `₹ ${rawOpeningBal.toLocaleString('en-IN')}` : '-'}</td>
                    <td className="text-end">{openingType === 'Cr' ? `₹ ${rawOpeningBal.toLocaleString('en-IN')}` : '-'}</td>
                    <td className="text-end">₹ {rawOpeningBal.toLocaleString('en-IN')} ({openingType})</td>
                  </tr>

                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        Loading statement transactions...
                      </td>
                    </tr>
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No voucher movements recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td>
                          <span className={`badge-v ${r.voucherType.includes('Sales') ? 'primary' : r.voucherType.includes('Receipt') ? 'success' : 'warning'}`}>
                            {r.voucherType}
                          </span>
                        </td>
                        <td className="fw-bold"><code style={{ color: 'var(--primary)' }}>{r.voucherNo}</code></td>
                        <td>{r.particulars}</td>
                        <td className="text-end fw-semibold" style={{ color: 'var(--primary)' }}>
                          {r.drAmount ? `₹ ${r.drAmount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="text-end fw-semibold" style={{ color: 'var(--success)' }}>
                          {r.crAmount ? `₹ ${r.crAmount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="text-end fw-bold">
                          ₹ {r.runningBalance.toLocaleString('en-IN')} <small className="text-muted">({r.balanceType})</small>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td colSpan="4">Total Movements & Net Closing Balance</td>
                    <td className="text-end" style={{ color: 'var(--primary)' }}>₹ {totalDr.toLocaleString('en-IN')}</td>
                    <td className="text-end" style={{ color: 'var(--success)' }}>₹ {totalCr.toLocaleString('en-IN')}</td>
                    <td className="text-end" style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                      ₹ {finalNetBalance.toLocaleString('en-IN')} ({finalNetType})
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onClose}>Close Statement</button>
        </div>
      </div>
    </div>
  );
}
