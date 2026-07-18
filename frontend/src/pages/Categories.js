import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* Mock Categories Database */
let categoriesDB = [
  { 
    id: 'CAT-001', 
    name: 'Electronics', 
    slug: 'electronics',
    parent: null,
    description: 'Electronic devices and gadgets',
    icon: 'bi-lightning-charge',
    color: '#7367f0',
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
    color: '#00cfe8',
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
    color: '#28c76f',
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
    color: '#ff9f43',
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
    color: '#ea5455',
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
    color: '#ff9f43',
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
    color: '#7367f0',
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

  // Filter logic
  const filteredCategories = categories.filter((cat) => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      cat.name.toLowerCase().includes(q) || 
      cat.slug.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || cat.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Get parent categories (no parent)
  const parentCategories = categories.filter(c => !c.parent);

  // Get children for a parent
  const getChildren = (parentId) => categories.filter(c => c.parent === parentId);

  // Get parent name
  const getParentName = (parentId) => {
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : 'None';
  };

  // Stats
  const stats = {
    total: categories.length,
    parent: parentCategories.length,
    child: categories.filter((c) => c.parent).length,
    totalProducts: categories.reduce((sum, c) => sum + c.products, 0),
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { color: 'success', icon: 'bi-check-circle', label: 'Active' },
      inactive: { color: 'secondary', icon: 'bi-dash-circle', label: 'Inactive' },
    };
    const s = map[status] || map.active;
    return <span className={`badge-v ${s.color}`}><i className={`bi ${s.icon}`}></i> {s.label}</span>;
  };

  const handleDelete = (id) => {
    const hasChildren = categories.some(c => c.parent === id);
    if (hasChildren) {
      alert('Cannot delete category with subcategories. Please delete or reassign subcategories first.');
      return;
    }
    if (window.confirm('Delete this category? This action cannot be undone.')) {
      setCategories(categories.filter((c) => c.id !== id));
      categoriesDB = categories.filter((c) => c.id !== id);
    }
  };

  const handleCreate = (newCategory) => {
    const category = {
      ...newCategory,
      id: `CAT-${String(nextCategoryNum++).padStart(3, '0')}`,
      products: 0,
      createdDate: new Date(),
    };
    setCategories([category, ...categories]);
    categoriesDB = [category, ...categories];
  };

  const handleUpdate = (updatedCategory) => {
    setCategories(categories.map((c) => c.id === updatedCategory.id ? updatedCategory : c));
    categoriesDB = categories.map((c) => c.id === updatedCategory.id ? updatedCategory : c);
  };

  if (!can('categories.view')) {
    return (
      <div className="empty-state-v" style={{ paddingTop: 80 }}>
        <i className="bi bi-shield-x" style={{ color: 'var(--danger)' }}></i>
        <h5>Access Denied</h5>
        <p>You don't have permission to view categories.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">
              <i className="bi bi-tag me-2" style={{ color: 'var(--primary)' }}></i>
              Product Categories
            </h1>
            <p className="page-subtitle">Organize products into hierarchical categories</p>
          </div>
          {can('categories.add') && (
            <button className="btn-v primary" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-lg"></i>
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <i className="bi bi-tag"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Categories</div>
              <div className="stat-card-value">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon success">
              <i className="bi bi-diagram-3"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Parent Categories</div>
              <div className="stat-card-value">{stats.parent}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon warning">
              <i className="bi bi-diagram-2"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Subcategories</div>
              <div className="stat-card-value">{stats.child}</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="stat-card">
            <div className="stat-card-icon info">
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="stat-card-body">
              <div className="stat-card-label">Total Products</div>
              <div className="stat-card-value">{stats.totalProducts}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="v-card mb-4">
        <div className="v-card-body" style={{ padding: '16px 24px' }}>
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <div className="search-box-v">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search categories, descriptions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1" style={{ fontSize: '0.75rem' }}>Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn-v light w-100" onClick={() => { setSearch(''); setStatusFilter('all'); }} style={{ justifyContent: 'center' }}>
                <i className="bi bi-x-lg"></i> Clear
              </button>
            </div>
            <div className="col-md-2">
              <button className="btn-v light w-100" style={{ justifyContent: 'center' }} title="Export">
                <i className="bi bi-download"></i> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid View */}
      <div className="row g-3 mb-4">
        {filteredCategories.filter(c => !c.parent).map((parent) => {
          const children = getChildren(parent.id);
          return (
            <div key={parent.id} className="col-md-6 col-lg-4">
              <div className="category-card">
                <div className="category-card-header" style={{ background: `${parent.color}15`, borderLeft: `4px solid ${parent.color}` }}>
                  <div className="d-flex align-items-start gap-3">
                    <div className="category-icon" style={{ background: parent.color }}>
                      <i className={`bi ${parent.icon}`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{parent.name}</h6>
                      <p className="category-desc">{parent.description}</p>
                      <div className="d-flex gap-2 align-items-center mt-2">
                        <span className="badge-v light" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-box-seam"></i> {parent.products} products
                        </span>
                        {children.length > 0 && (
                          <span className="badge-v info" style={{ fontSize: '0.75rem' }}>
                            {children.length} subcategories
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="category-children">
                    {children.map((child) => (
                      <div key={child.id} className="category-child-item">
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi ${child.icon}`} style={{ color: child.color, fontSize: '1rem' }}></i>
                          <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{child.name}</span>
                          <span className="ms-auto text-muted" style={{ fontSize: '0.75rem' }}>
                            {child.products} items
                          </span>
                        </div>
                        <div className="category-child-actions">
                          <button className="btn-v-mini outline-primary" onClick={() => setViewCategory(child)} title="View">
                            <i className="bi bi-eye"></i>
                          </button>
                          {can('categories.edit') && (
                            <button className="btn-v-mini outline-primary" onClick={() => setEditCategory(child)} title="Edit">
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {can('categories.delete') && (
                            <button className="btn-v-mini outline-danger" onClick={() => handleDelete(child.id)} title="Delete">
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="category-card-footer">
                  <button className="btn-v-text primary" onClick={() => setViewCategory(parent)}>
                    <i className="bi bi-eye"></i> View Details
                  </button>
                  {can('categories.edit') && (
                    <button className="btn-v-text primary" onClick={() => setEditCategory(parent)}>
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                  )}
                  {can('categories.delete') && (
                    <button className="btn-v-text danger" onClick={() => handleDelete(parent.id)}>
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="v-card">
          <div className="v-card-body">
            <div className="empty-state-v">
              <i className="bi bi-inbox"></i>
              <h5>No Categories Found</h5>
              <p>{search || statusFilter !== 'all' ? 'Try adjusting filters' : 'Click "Add Category" to get started'}</p>
            </div>
          </div>
        </div>
      )}

      {/* View Category Modal */}
      {viewCategory && <ViewCategoryModal category={viewCategory} getParentName={getParentName} onClose={() => setViewCategory(null)} />}

      {/* Create/Edit Category Modal */}
      {showCreateModal && <CategoryFormModal categories={categories} onClose={() => setShowCreateModal(false)} onSave={handleCreate} />}
      {editCategory && <CategoryFormModal category={editCategory} categories={categories} onClose={() => setEditCategory(null)} onSave={handleUpdate} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW CATEGORY MODAL
═══════════════════════════════════════════════════════════ */
function ViewCategoryModal({ category, getParentName, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-box-header">
          <i className="bi bi-tag" style={{ color: 'var(--primary)' }}></i>
          Category Details
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-box-body">
          {/* Header Card */}
          <div className="v-card mb-3" style={{ background: `${category.color}15`, border: `1px solid ${category.color}40` }}>
            <div className="v-card-body" style={{ padding: '20px' }}>
              <div className="d-flex align-items-start gap-3">
                <div className="category-icon-large" style={{ background: category.color }}>
                  <i className={`bi ${category.icon}`}></i>
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-1">{category.name}</h5>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {category.description}
                  </div>
                  <div className="d-flex gap-2">
                    {getStatusBadge(category.status)}
                    <span className="badge-v light">
                      <i className="bi bi-box-seam"></i> {category.products} products
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Category ID</label>
              <div className="info-box">{category.id}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">URL Slug</label>
              <div className="info-box">{category.slug}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Parent Category</label>
              <div className="info-box">{getParentName(category.parent)}</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Created Date</label>
              <div className="info-box">
                {new Date(category.createdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Icon</label>
              <div className="info-box">
                <i className={`bi ${category.icon}`} style={{ color: category.color, marginRight: '8px' }}></i>
                {category.icon}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Color</label>
              <div className="info-box">
                <span style={{ display: 'inline-block', width: 20, height: 20, background: category.color, borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }}></span>
                {category.color}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-box-footer">
          <button className="btn-v light" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CATEGORY FORM MODAL (Create/Edit)
═══════════════════════════════════════════════════════════ */
function CategoryFormModal({ category, categories, onClose, onSave }) {
  const [form, setForm] = useState(category || {
    name: '',
    slug: '',
    parent: null,
    description: '',
    icon: 'bi-tag',
    color: '#7367f0',
    status: 'active',
  });
  const [error, setError] = useState('');

  const icons = [
    'bi-tag', 'bi-lightning-charge', 'bi-laptop', 'bi-phone', 'bi-briefcase', 
    'bi-back', 'bi-pen', 'bi-usb-symbol', 'bi-hdd-network', 'bi-printer',
    'bi-camera', 'bi-headphones', 'bi-tv', 'bi-watch', 'bi-controller'
  ];

  const colors = [
    '#7367f0', '#00cfe8', '#28c76f', '#ff9f43', '#ea5455',
    '#9c27b0', '#3f51b5', '#009688', '#ff5722', '#795548'
  ];

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name) => {
    setForm({ ...form, name, slug: generateSlug(name) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.slug || !form.description) {
      setError('Please fill all required fields');
      return;
    }

    // Check for duplicate slug
    const duplicateSlug = categories.find(c => c.slug === form.slug && c.id !== category?.id);
    if (duplicateSlug) {
      setError('A category with this slug already exists');
      return;
    }

    onSave(form);
    onClose();
  };

  const parentCategories = categories.filter(c => !c.parent && c.id !== category?.id);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 700 }}>
        <div className="modal-box-header">
          <i className="bi bi-tag" style={{ color: 'var(--primary)' }}></i>
          {category ? 'Edit Category' : 'Add New Category'}
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-box-body">
            {error && (
              <div className="alert-v danger mb-3">
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="form-section-title mb-2">
              <i className="bi bi-info-circle"></i> Basic Information
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Category Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Electronics"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">URL Slug *</label>
                <input
                  className="form-control"
                  placeholder="e.g. electronics"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Auto-generated from name
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Brief description of the category"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label">Parent Category</label>
                <select className="form-select" value={form.parent || ''} onChange={(e) => setForm({ ...form, parent: e.target.value || null })}>
                  <option value="">None (Parent Category)</option>
                  {parentCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-divider"></div>

            {/* Appearance */}
            <div className="form-section-title mb-2">
              <i className="bi bi-palette"></i> Appearance
            </div>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Icon</label>
                <div className="icon-selector">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option${form.icon === icon ? ' selected' : ''}`}
                      onClick={() => setForm({ ...form, icon })}
                      title={icon}
                    >
                      <i className={`bi ${icon}`}></i>
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">Color</label>
                <div className="color-selector">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option${form.color === color ? ' selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setForm({ ...form, color })}
                      title={color}
                    >
                      {form.color === color && <i className="bi bi-check"></i>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-12">
                <div className="alert-v info" style={{ fontSize: '0.85rem', padding: '12px 16px' }}>
                  <div className="d-flex align-items-center gap-2">
                    <div className="category-icon-preview" style={{ background: form.color }}>
                      <i className={`bi ${form.icon}`}></i>
                    </div>
                    <div>
                      <strong>Preview:</strong> {form.name || 'Category Name'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-box-footer">
            <button className="btn-v light" type="button" onClick={onClose}>Cancel</button>
            <button className="btn-v primary" type="submit">
              <i className="bi bi-check-circle"></i> {category ? 'Update' : 'Create'} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
