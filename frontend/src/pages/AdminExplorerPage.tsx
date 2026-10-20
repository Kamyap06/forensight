import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  Key,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  FileCode2,
  Cpu,
  RefreshCw,
  Lock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { User, DatabaseTable, ColumnMeta, ForeignKeyMeta } from '../types';

interface AdminExplorerPageProps {
  currentUser: User | null;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function AdminExplorerPage({
  currentUser,
  showToast
}: AdminExplorerPageProps) {
  const [overview, setOverview] = useState<{
    database_name: string;
    tables_count: number;
    tables: DatabaseTable[];
    views_count: number;
    views: string[];
    foreign_keys_count: number;
    foreign_keys: ForeignKeyMeta[];
  } | null>(null);

  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [tableData, setTableData] = useState<{
    table_name: string;
    columns: ColumnMeta[];
    foreign_keys: ForeignKeyMeta[];
    total_rows: number;
    page: number;
    limit: number;
    rows: Record<string, any>[];
  } | null>(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'records' | 'schema' | 'foreign_keys'>('records');
  const [recordSearch, setRecordSearch] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable, page);
    }
  }, [selectedTable, page]);

  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await api.getDatabaseOverview();
      setOverview(res);
      if (res.tables && res.tables.length > 0) {
        const currentSelectedExists = res.tables.some(
          (t) => (t.name || t.table_name || '').toLowerCase() === selectedTable.toLowerCase()
        );
        if (!currentSelectedExists) {
          setSelectedTable(res.tables[0].name || res.tables[0].table_name || 'users');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load database overview', 'error');
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadTableData = async (tableName: string, targetPage: number) => {
    try {
      setLoadingTable(true);
      const res = await api.getTableDetails(tableName.toLowerCase(), targetPage, 15);
      setTableData(res);
    } catch (err: any) {
      showToast(err.message || `Failed to introspect table ${tableName}`, 'error');
    } finally {
      setLoadingTable(false);
    }
  };

  const handleSelectTable = (tblName: string) => {
    setSelectedTable(tblName);
    setPage(1);
    setRecordSearch('');
  };

  if (currentUser?.role !== 'Admin') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <ShieldAlert className="w-12 h-12 text-red-500" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Restricted Administrator Console
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Direct MySQL introspection and schema analysis require Administrator privileges.
        </p>
      </div>
    );
  }

  const totalPages = tableData ? Math.ceil(tableData.total_rows / tableData.limit) || 1 : 1;

  // Filter rows locally if search is entered
  const displayedRows = (tableData?.rows || []).filter((r) => {
    if (!recordSearch.trim()) return true;
    const term = recordSearch.toLowerCase();
    return Object.values(r).some((v) =>
      v !== null && v !== undefined && String(v).toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="breadcrumb">
            <span>ForenSight</span>
            <span className="crumb-sep">/</span>
            <span>Administration</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Database Explorer</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="Database Schema & Table Explorer">Forensic Data & Schema Explorer</h1>
          <p className="page-subtitle">
            Inspect platform schemas, relational integrity, table structures, and indexed forensic records.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={loadOverview} title="Refresh database schema">
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh Schema</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry Header */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Target Schema</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', fontFamily: 'monospace' }}>
            {overview?.database_name || 'forensight'}
          </div>
          <div className="kpi-footer">Port 3306 • MySQL 8.0 InnoDB Live</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Relational Tables</span>
            <TableIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="kpi-value">{overview?.tables_count || 10}</div>
          <div className="kpi-footer">Normalized 3NF architecture</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Foreign Key Constraints</span>
            <Key className="w-4 h-4 text-amber-400" />
          </div>
          <div className="kpi-value">{overview?.foreign_keys_count || 12}</div>
          <div className="kpi-footer">Referential integrity enforced</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Programmable Views</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="kpi-value">{overview?.views_count || 3}</div>
          <div className="kpi-footer">Views active</div>
        </div>
      </div>

      {/* Relational Table Selector Ribbon */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {overview?.tables.map((t) => {
          const tName = t.name || t.table_name || '';
          const rowCount = t.row_count ?? t.exact_rows ?? 0;
          const isSelected = selectedTable.toLowerCase() === tName.toLowerCase();
          return (
            <button
              key={tName}
              onClick={() => handleSelectTable(tName)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: isSelected ? '#0284c7' : 'var(--bg-card-subtle)',
                color: isSelected ? '#ffffff' : 'var(--text-main)',
                border: `1px solid ${isSelected ? '#38bdf8' : 'var(--border-color)'}`,
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: isSelected ? 600 : 500,
                transition: 'all 0.15s'
              }}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{tName}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                {rowCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table Inspector Card */}
      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div className="panel-title">
              <Database className="w-4 h-4 text-sky-400" />
              <span>
                Table Inspector: <strong style={{ color: '#38bdf8' }}>{selectedTable}</strong>
              </span>
            </div>

            {/* Tab switchers */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: 'var(--bg-card-subtle)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            >
              <button
                onClick={() => setActiveTab('records')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'records' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'records' ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Live Records ({tableData?.total_rows || 0})
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'schema' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'schema' ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Columns Schema ({tableData?.columns?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('foreign_keys')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'foreign_keys' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'foreign_keys' ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Foreign Keys ({tableData?.foreign_keys?.length || 0})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeTab === 'records' && (
              <div style={{ position: 'relative' }}>
                <Search
                  className="w-3.5 h-3.5"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  placeholder="Filter loaded rows..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="input-field"
                  style={{ padding: '4px 10px 4px 30px', fontSize: '0.8rem', width: '180px' }}
                />
              </div>
            )}
            <button
              className="btn btn-outline btn-sm"
              onClick={() => loadTableData(selectedTable, page)}
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
              <span>Query MySQL</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Records */}
        {activeTab === 'records' && (
          <>
            <div className="table-wrap">
              <table className="cyber-table admin-table">
                <thead>
                  <tr>
                    {tableData?.columns.map((col) => {
                      const colName = col.name || col.column_name || '';
                      const colType = col.type || col.data_type || '';
                      const colKey = col.key || col.column_key || '';
                      return (
                        <th key={colName}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {colKey === 'PRI' && <Key className="w-3 h-3 text-amber-400 inline" />}
                            <span>{colName}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            {colType}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {loadingTable ? (
                    <tr>
                      <td
                        colSpan={tableData?.columns?.length || 5}
                        style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Streaming live records from MySQL...
                      </td>
                    </tr>
                  ) : displayedRows.length > 0 ? (
                    displayedRows.map((row, idx) => (
                      <tr key={idx}>
                        {tableData?.columns.map((col) => {
                          const colName = col.name || col.column_name || '';
                          const colKey = col.key || col.column_key || '';
                          const val = row[colName];

                          let displayVal = val;
                          if (val === null || val === undefined) {
                            displayVal = <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>;
                          } else if (typeof val === 'string' && val.includes('[PROTECTED_CRYPTOGRAPHIC_HASH]')) {
                            displayVal = (
                              <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                                ●●●●●●●● [SECURE HASH]
                              </span>
                            );
                          } else if (typeof val === 'string' && val.length > 40) {
                            displayVal = `${val.substring(0, 36)}...`;
                          }

                          return (
                            <td
                              key={colName}
                              style={{ fontFamily: colKey === 'PRI' ? 'monospace' : 'inherit' }}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={tableData?.columns?.length || 5}
                        style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {recordSearch ? 'No rows match filter criteria.' : 'No records stored in this table.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {tableData && tableData.total_rows > tableData.limit && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Showing records {(page - 1) * tableData.limit + 1} to{' '}
                  {Math.min(page * tableData.limit, tableData.total_rows)} of {tableData.total_rows}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                    <span>Previous</span>
                  </button>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-main)', padding: '6px 10px' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 inline ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Schema Columns */}
        {activeTab === 'schema' && (
          <div className="table-wrap">
            <table className="cyber-table admin-table">
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>SQL Data Type</th>
                  <th>Nullability</th>
                  <th>Key Constraint</th>
                  <th>Default Value</th>
                  <th>Extra Attribute</th>
                </tr>
              </thead>
              <tbody>
                {tableData?.columns.map((c) => {
                  const cName = c.name || c.column_name || '';
                  const cType = c.type || c.data_type || '';
                  const cNullable = c.nullable || c.is_nullable || '';
                  const cKey = c.key || c.column_key || '';
                  const cDef = c.default ?? c.default_value;
                  const cExtra = c.extra;

                  return (
                    <tr key={cName}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {cKey === 'PRI' && <Key className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{cName}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{cType}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              cNullable === 'YES' ? 'rgba(100, 116, 139, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: cNullable === 'YES' ? 'var(--text-muted)' : '#ef4444'
                          }}
                        >
                          {cNullable === 'YES' ? 'NULL' : 'NOT NULL'}
                        </span>
                      </td>
                      <td>
                        {cKey === 'PRI' ? (
                          <span className="badge badge-critical">PRIMARY KEY</span>
                        ) : cKey === 'MUL' ? (
                          <span className="badge badge-open">FOREIGN KEY</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {cDef !== null && cDef !== undefined ? String(cDef) : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{cExtra || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Foreign Keys */}
        {activeTab === 'foreign_keys' && (
          <div className="table-wrap">
            <table className="cyber-table admin-table">
              <thead>
                <tr>
                  <th>Constraint Name</th>
                  <th>Local Column</th>
                  <th>Referenced Relational Table</th>
                  <th>Referenced Primary Key</th>
                </tr>
              </thead>
              <tbody>
                {tableData && tableData.foreign_keys && tableData.foreign_keys.length > 0 ? (
                  tableData.foreign_keys.map((fk) => {
                    const refTable = fk.referenced_table_name || fk.referenced_table;
                    const refCol = fk.referenced_column_name || fk.referenced_column;

                    return (
                      <tr key={fk.constraint_name}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{fk.constraint_name}</td>
                        <td style={{ fontWeight: 600, color: '#38bdf8' }}>{fk.column_name}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(56, 189, 248, 0.12)',
                              color: '#38bdf8'
                            }}
                          >
                            {refTable}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#10b981' }}>{refCol}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No foreign key constraints originate from this table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
