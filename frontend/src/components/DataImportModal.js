import React, { useState } from 'react';
import { parseCSVFile, downloadSampleTemplate } from '../utils/exportHelper';

export default function DataImportModal({
  isOpen,
  onClose,
  title = 'Import Register Data',
  templateHeaders = [],
  sampleRows = [],
  onImport
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await parseCSVFile(file);
      if (!result.headers || result.headers.length === 0 || !result.rows || result.rows.length === 0) {
        setErrorMsg('The selected file is empty or formatted incorrectly. Please download the sample template.');
        setParsedData(null);
        return;
      }
      setParsedData(result);
    } catch (err) {
      setErrorMsg('Failed to parse file. Please upload a valid CSV or Excel text file.');
      setParsedData(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData || !parsedData.rows || parsedData.rows.length === 0) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      if (onImport) {
        await onImport(parsedData);
      }
      setSuccessMsg(`Successfully imported ${parsedData.rows.length} records into the system!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setSelectedFile(null);
        setParsedData(null);
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || 'Import failed. Please check data rows and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadSampleTemplate(
      title.replace(/\s+/g, '_'),
      templateHeaders,
      sampleRows
    );
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div className="modal-box-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-arrow-up" style={{ fontSize: '1.3rem', color: '#ffffff' }}></i>
            <span className="fw-bold" style={{ color: '#ffffff' }}>{title.toUpperCase()}</span>
          </div>
          <button className="close-btn text-white" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="modal-box-body p-4">
          {successMsg ? (
            <div className="alert-v success text-center py-4">
              <i className="bi bi-check-circle-fill" style={{ fontSize: '2.5rem', color: '#4CAF50', display: 'block', marginBottom: '12px' }}></i>
              <h5 className="fw-bold mb-1 text-dark">Data Import Completed</h5>
              <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>{successMsg}</p>
            </div>
          ) : (
            <>
              {/* Step 1: Download Template Banner */}
              <div className="p-3 mb-4 rounded-3 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
                    <i className="bi bi-file-earmark-excel text-success me-1.5"></i> Need the Excel/CSV Column Format?
                  </div>
                  <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                    Download the pre-formatted sample template with required headers.
                  </div>
                </div>
                <button className="btn-v outline-primary btn-sm style-cursor" onClick={handleDownloadTemplate}>
                  <i className="bi bi-download me-1"></i> Sample Template
                </button>
              </div>

              {/* Step 2: File Upload Box */}
              <div className="mb-4">
                <label className="form-label fw-bold text-dark mb-1">
                  Select Excel (.csv / .xls) File to Import *
                </label>
                <input 
                  type="file" 
                  className="form-control" 
                  accept=".csv, .xls, .xlsx, .txt"
                  onChange={handleFileChange}
                />
                <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                  Supported formats: CSV, Excel Spreadsheets (.csv, .xls, .xlsx)
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="alert-v danger mb-3">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Step 3: Data Preview Table */}
              {parsedData && (
                <div className="border rounded-3 p-3 bg-white mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-bold text-dark small">
                      <i className="bi bi-eye text-primary me-1"></i> Data Preview ({parsedData.rows.length} rows detected)
                    </div>
                    <span className="badge bg-success bg-opacity-15 text-success fw-bold" style={{ fontSize: '0.72rem' }}>
                      Ready to Import
                    </span>
                  </div>

                  <div className="table-responsive border rounded" style={{ maxHeight: 220, overflowY: 'auto' }}>
                    <table className="v-table mb-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          {parsedData.headers.map((h, i) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.rows.slice(0, 10).map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td>{rIdx + 1}</td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.rows.length > 10 && (
                    <div className="text-center text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                      Showing first 10 of {parsedData.rows.length} rows...
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!successMsg && (
          <div className="modal-box-footer d-flex align-items-center justify-content-between p-3 border-top bg-light">
            <button className="btn-v outline-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn-v primary btn-sm style-cursor" 
              disabled={!parsedData || loading} 
              onClick={handleConfirmImport}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-1.5"></span>Importing Data...</>
              ) : (
                <><i className="bi bi-cloud-arrow-up me-1"></i> Import {parsedData?.rows?.length || 0} Records</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
