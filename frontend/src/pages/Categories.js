import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportHelper';
import DataImportModal from '../components/DataImportModal';

/* Mock Categories Database */
let categoriesDB = [
  { 
    id: 'CAT-001', 
    name: 'Electronics', 
    slug: 'electronics',
    parent: null,
    description: 'Electronic devices and gadgets',
    icon: 'bi-lightning-charge',
    color: '#1E4D2B',
    products: 145,
    status: 'active',
    createdDate: new Date('2022-01-10'),
  },
  { 
    id: 'CAT-002', 
    name: 'Computers', 
    slug: 'computers',
    parent: 'CAT-001',
    description: 'Laptops, desktops, and accessories',
    icon: 'bi-laptop',
    color: '#4CAF50',
    products: 78,
    status: 'active',
    createdDate: new Date('2022-01-15'),
  },
  { 
    id: 'CAT-003', 
    name: 'Mobile Phones', 
    slug: 'mobile-phones',
    parent: 'CAT-001',
    description: 'Smartphones and mobile accessories',
    icon: 'bi-phone',
    color: '#1E4D2B',
    products: 52,
    status: 'active',
    createdDate: new Date('2022-01-20'),
  },
  { 
    id: 'CAT-004', 
    name: 'Office Supplies', 
    slug: 'office-supplies',
    parent: null,
    description: 'Stationery and office equipment',
    icon: 'bi-briefcase',
    color: '#4CAF50',
    products: 89,
    status: 'active',
    createdDate: new Date('2022-02-05'),
  },
  { 
    id: 'CAT-005', 
    name: 'Furniture', 
    slug: 'furniture',
    parent: 'CAT-004',
    description: 'Office chairs, desks, and tables',
    icon: 'bi-back',
    color: '#1E4D2B',
    products: 34,
    status: 'active',
    createdDate: new Date('2022-02-10'),
  },
  { 
    id: 'CAT-006', 
    name: 'Stationery', 
    slug: 'stationery',
    parent: 'CAT-004',
    description: 'Pens, papers, and writing materials',
    icon: 'bi-pen',
    color: '#4CAF50',
    products: 45,
    status: 'active',
    createdDate: new Date('2022-02-12'),
  },
  { 
    id: 'CAT-007', 
    name: 'Accessories', 
    slug: 'accessories',
    parent: 'CAT-001',
    description: 'Cables, chargers, and other accessories',
    icon: 'bi-usb-symbol',
    color: '#1E4D2B',
    products: 15,
    status: 'active',
    createdDate: new Date('2022-03-01'),
  },
  { 
    id: 'CAT-008', 
    name: 'Hardware', 
    slug: 'hardware',
    parent: null,
    description: 'Networking and server equipment',
    icon: 'bi-hdd-network',
    color: '#00cfe8',
    products: 56,
    status: 'active',
    createdDate: new Date('2022-03-15'),
  },
];

let nextCategoryNum = 9;

export default function Categories() {
  const { can } = useAuth();
  const [categories, setCategories] = useState(categoriesDB);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewCategory, setViewCategory] = useState(null);
  const [editCategory, setEditCategory] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredCategories = categories.filter((cat) => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      cat.name.toLowerCase().includes(q) || 
      cat.slug.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || cat.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const parentCategories = categories.filter(c => !c.parent);

  const getParentName = (parentId) => {
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : 'Primary Group';
  };

  const stats = {
    total: categories.length,
    parent: parentCategories.length,
    child: categories.filter((c) => c.parent).length,
    totalProducts: categories.reduce((sum, c) => sum + c.products, 0),
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && e.key !== 'F2' && !(e.altKey && (e.key === 'c' || e.key === 'C' || e.key === 'e' || e.key === 'E'))) return;

      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('category-search-input')?.focus();
      } else if (e.key === 'F4') {
        if (can('categories.add')) {
          e.preventDefault();
          setShowCreateModal(true);
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        setCategories([...categoriesDB]);
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        exportCSV();
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        exportTallyXML();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [can]);

  const getStatusBadge = (status) => {
    const map = {
      active: { color: 'success', icon: 'bi-check-circle', label: 'ACTIVE' },
      inactive: { color: 'secondary', icon: 'bi-dash-circle', label: 'INACTIVE' },
    };
    const s = map[status] || map.active;
    return <span className={`badge-v ${s.color}`} style={{ fontSize: '0.7rem' }}><i className={`bi ${s.icon} me-1`}></i> {s.label}</span>;
  };

  const handleDelete = (id) => {
    const hasChildren = categories.some(c => c.parent === id);
    if (hasChildren) {
      alert('Cannot delete stock group with sub-groups. Reassign sub-groups first.');
      return;
    }
    if (window.confirm('Delete this stock group master? This action cannot be undone.')) {
      setCategories(categories.filter((c) => c.id !== id));
      categoriesDB = categories.filter((c) => c.id !== id);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Slug', 'Parent Group', 'Description', 'Linked Products', 'Status'];
    const rows = categories.map(c => [
      `"${c.id}"`,
      `"${c.name || ''}"`,
      `"${c.slug || ''}"`,
      `"${getParentName(c.parent)}"`,
      `"${c.description || ''}"`,
      c.products || 0,
      c.status ? 'ACTIVE' : 'INACTIVE'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Groups_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTallyXML = () => {
    alert('Exporting Stock Group Masters XML for EHN One ERP...');
  };

  if (!can('categories.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>You don't have permission to access stock group masters register.</p>
      </div>
    );
  }

  const [showImportModal, setShowImportModal] = useState(false);

  const getExportData = () => {
    const headers = ['Category Name', 'Slug', 'Parent Group', 'Description', 'Linked Products', 'Status'];
    const rows = categories.map(c => [
      c.name || '',
      c.slug || '',
      getParentName(c.parent),
      c.description || '',
      c.products || 0,
      c.status === 'active' ? 'Active' : 'Inactive'
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    exportToCSV('Stock_Groups_Categories_Register', headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel('Stock_Groups_Categories_Register', 'Categories', headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    exportToPDF('STOCK GROUPS & CATEGORIES REGISTER', { name: 'Kedvass Hygiene Products' }, headers, rows, { label: 'Total Stock Groups', value: `${categories.length}` });
  };

  const handleImportCategories = async (parsedData) => {
    const newCats = [];
    for (const row of parsedData.rows) {
      if (!row || row.length === 0 || !row[0]) continue;
      const catObj = {
        id: `CAT-${String(Math.floor(100 + Math.random() * 900))}`,
        name: row[0] || 'Imported Category',
        slug: (row[0] || 'imported').toLowerCase().replace(/\s+/g, '-'),
        parent: null,
        description: row[3] || 'Imported category group',
        icon: 'bi-tag',
        color: '#1E4D2B',
        products: Number(row[4]) || 0,
        status: 'active',
        createdDate: new Date()
      };
      newCats.push(catObj);
    }
    setCategories([...newCats, ...categories]);
    categoriesDB = [...newCats, ...categories];
  };

  return (
    <div className="py-2">
      {/* Clean Modern Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>Stock Groups & Categories</h4>
          <p className="text-muted small mb-0">Organize stock items into hierarchical categories & stock groups</p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button className="btn-v outline-secondary btn-sm" onClick={handleExportCSV} title="Export CSV">
            <i className="bi bi-filetype-csv me-1"></i> CSV
          </button>
          <button className="btn-v outline-success btn-sm" onClick={handleExportExcel} title="Export Excel">
            <i className="bi bi-file-earmark-excel me-1"></i> Excel
          </button>
          <button className="btn-v outline-danger btn-sm" onClick={handleExportPDF} title="Export PDF">
            <i className="bi bi-file-earmark-pdf me-1"></i> PDF
          </button>
          <button className="btn-v outline-primary btn-sm style-cursor" onClick={() => setShowImportModal(true)} title="Import Categories Excel/CSV">
            <i className="bi bi-file-earmark-arrow-up me-1"></i> Import
          </button>
          {can('categories.add') && (
            <button className="btn-v primary btn-sm" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-lg me-1"></i> Add Stock Group
            </button>
          )}
        </div>
      </div>

      {/* Tally Metric Summary Cards */}
      <div className="row g-2 mb-3">
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">TOTAL STOCK GROUPS</div>
            <div className="tally-stat-value">{stats.total}</div>
            <div className="tally-stat-sub text-muted">Configured Item Groups</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">PRIMARY GROUPS</div>
            <div className="tally-stat-value text-primary">{stats.parent}</div>
            <div className="tally-stat-sub text-muted">Top-Level Categories</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">SUB-GROUPS</div>
            <div className="tally-stat-value text-info">{stats.child}</div>
            <div className="tally-stat-sub text-muted">Nested Child Categories</div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="tally-stat-card">
            <div className="tally-stat-label">LINKED ITEM MASTERS</div>
            <div className="tally-stat-value text-success">{stats.totalProducts}</div>
            <div className="tally-stat-sub text-muted">Total Associated Items</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="v-card mb-3">
        <div className="v-card-body p-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="search-box-v">
                <i className="bi bi-search"></i>
                <input
                  id="category-search-input"
                  type="text"
                  className="form-control"
                  placeholder="Filter stock groups by name, slug, description... [Press F2]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select btn-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Group Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2 text-end">
              <span className="badge-v secondary fw-bold" style={{ fontSize: '0.72rem' }}>
                {filteredCategories.length} GROUPS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Tally Table */}
      <div className="v-card">
        <div className="v-card-header d-flex justify-content-between align-items-center">
          <span><i className="bi bi-tag me-2" style={{ color: 'var(--primary)' }}></i>STOCK GROUP MASTERS REGISTER</span>
          <span className="text-muted small">HIGH-DENSITY ERP VIEW</span>
        </div>
        <div className="v-card-body p-0" style={{ overflowX: 'auto' }}>
          {filteredCategories.length === 0 ? (
            <div className="empty-state-v py-4">
              <i className="bi bi-tag text-muted" style={{ fontSize: '2rem' }}></i>
              <h5 className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.88rem' }}>No Stock Groups Found</h5>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Click "[F4] Add Stock Group Master" to define a category</p>
            </div>
          ) : (
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>STOCK GROUP NAME</th>
                  <th>PARENT GROUP</th>
                  <th>SLUG / ALIAS KEY</th>
                  <th className="text-end">LINKED ITEMS</th>
                  <th>STATUS</th>
                  <th className="text-end" style={{ width: 120 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map((c, i) => (
                  <tr key={c.id}>
                    <td className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                      {(currentPage - 1) * pageSize + i + 1}
                    </td>
                    <td>
                      <div className="fw-bold" style={{ color: 'var(--primary)' }}>{c.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>{c.description || 'No description'}</div>
                    </td>
                    <td>
                      <span className={`badge-v ${c.parent ? 'info' : 'primary'}`} style={{ fontSize: '0.7rem' }}>
                        <i className={`bi ${c.parent ? 'bi-diagram-2' : 'bi-diagram-3'} me-1`}></i>
                        {getParentName(c.parent)}
                      </span>
                    </td>
                    <td>
                      <code style={{ color: 'var(--primary)', fontSize: '0.78rem' }}>{c.slug}</code>
                    </td>
                    <td className="text-end fw-bold">{c.products} Items</td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button className="btn-v outline-primary btn-sm px-2" onClick={() => setViewCategory(c)} title="View Details">
                          <i className="bi bi-eye"></i>
                        </button>
                        {can('categories.edit') && (
                          <button className="btn-v outline-primary btn-sm px-2" onClick={() => setEditCategory(c)} title="Edit Master">
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {can('categories.delete') && (
                          <button className="btn-v outline-danger btn-sm px-2" onClick={() => handleDelete(c.id)} title="Delete Master">
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {filteredCategories.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredCategories.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* View Stock Group Modal */}
      {viewCategory && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewCategory(null); }}>
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-box-header d-flex align-items-center justify-content-between">
              <span>STOCK GROUP MASTER DETAILS &mdash; {viewCategory.id}</span>
              <button className="close-btn" onClick={() => setViewCategory(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-box-body p-3">
              <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                <i className={`bi ${viewCategory.icon || 'bi-tag'} text-primary fs-3`}></i>
                <div>
                  <h6 className="mb-0 fw-bold">{viewCategory.name}</h6>
                  <div className="text-muted small">Slug Key: {viewCategory.slug}</div>
                </div>
              </div>
              <div className="row g-2 small">
                <div className="col-6"><strong>Parent Group:</strong> {getParentName(viewCategory.parent)}</div>
                <div className="col-6"><strong>Status:</strong> {getStatusBadge(viewCategory.status)}</div>
                <div className="col-6"><strong>Linked Items:</strong> {viewCategory.products} Products</div>
                <div className="col-6"><strong>Created Date:</strong> {new Date(viewCategory.createdDate).toLocaleDateString('en-IN')}</div>
                <div className="col-12 mt-2"><strong>Description:</strong> {viewCategory.description || 'N/A'}</div>
              </div>
            </div>
            <div className="modal-box-footer d-flex justify-content-end">
              <button className="btn-v outline-secondary btn-sm" onClick={() => setViewCategory(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editCategory) && (
        <CategoryModal
          category={editCategory}
          parentCategories={parentCategories}
          onClose={() => { setShowCreateModal(false); setEditCategory(null); }}
          onSave={(data) => {
            if (editCategory) {
              setCategories(categories.map(c => c.id === data.id ? data : c));
              categoriesDB = categories.map(c => c.id === data.id ? data : c);
            } else {
              const newCat = { ...data, id: `CAT-${String(nextCategoryNum++).padStart(3, '0')}`, products: 0, createdDate: new Date() };
              setCategories([newCat, ...categories]);
              categoriesDB = [newCat, ...categoriesDB];
            }
            setShowCreateModal(false);
            setEditCategory(null);
          }}
        />
      )}

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Stock Groups & Categories Master"
        templateHeaders={['Category Name', 'Slug', 'Parent Group', 'Description', 'Linked Products', 'Status']}
        sampleRows={[
          ['Electronics', 'electronics', 'Primary Group', 'Electronic items and gadgets', 145, 'Active'],
          ['Hardware', 'hardware', 'Primary Group', 'Cleaners and hygiene products', 92, 'Active']
        ]}
        onImport={handleImportCategories}
      />
    </div>
  );
}

function CategoryModal({ category, parentCategories, onClose, onSave }) {
  const [name, setName] = useState(category ? category.name : '');
  const [slug, setSlug] = useState(category ? category.slug : '');
  const [parent, setParent] = useState(category ? category.parent || '' : '');
  const [description, setDescription] = useState(category ? category.description : '');
  const [icon, setIcon] = useState(category ? category.icon : 'bi-tag');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...(category || {}),
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      parent: parent || null,
      description,
      icon,
      status: 'active',
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 550 }}>
        <div className="modal-box-header d-flex align-items-center justify-content-between">
          <span>{category ? 'MODIFY STOCK GROUP MASTER' : 'CREATE NEW STOCK GROUP MASTER'}</span>
          <button className="close-btn" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-box-body p-3">
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="form-label">Stock Group Name *</label>
                <input className="form-control" placeholder="e.g. Raw Materials" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Slug / Alias Key</label>
                <input className="form-control" placeholder="e.g. raw-materials" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Parent Group</label>
                <select className="form-select" value={parent} onChange={(e) => setParent(e.target.value)}>
                  <option value="">Primary (Top Level)</option>
                  {parentCategories.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Display Icon</label>
                <select className="form-select" value={icon} onChange={(e) => setIcon(e.target.value)}>
                  <option value="bi-tag">Tag</option>
                  <option value="bi-box-seam">Box</option>
                  <option value="bi-lightning-charge">Lightning</option>
                  <option value="bi-laptop">Laptop</option>
                  <option value="bi-briefcase">Briefcase</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Description / Remarks</label>
                <textarea className="form-control" rows={2} placeholder="Optional group notes" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-box-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn-v outline-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-v primary btn-sm">
              <i className="bi bi-check-circle me-1"></i> {category ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
