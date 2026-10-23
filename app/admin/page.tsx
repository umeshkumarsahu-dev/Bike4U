'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  UploadCloud,
  History,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export default function AdminPage() {
  const [tab, setTab] = useState<'dashboard' | 'import' | 'versions' | 'variants'>('dashboard');

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // CSV Import state
  const [csvContent, setCsvContent] = useState<string>('');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  // Versions state
  const [versions, setVersions] = useState<any[]>([]);
  const [versionLoading, setVersionLoading] = useState(false);

  // Variants list
  const [variants, setVariants] = useState<any[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchVersions = async () => {
    setVersionLoading(true);
    try {
      const res = await fetch('/api/admin/versions');
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setVersionLoading(false);
    }
  };

  const fetchVariants = async () => {
    setVariantsLoading(true);
    try {
      const res = await fetch(`/api/admin/variants?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setVariantsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === 'versions') fetchVersions();
    if (tab === 'variants') fetchVariants();
  }, [tab]);

  // Handle CSV Preview
  const handlePreviewCsv = async () => {
    if (!csvContent.trim()) return;
    setPreviewLoading(true);
    setPublishMessage(null);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent, mode: 'preview' }),
      });
      const data = await res.json();
      setImportPreview(data);
    } catch (err: any) {
      alert('Failed to preview CSV: ' + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle CSV Publish
  const handlePublishCsv = async () => {
    if (!csvContent.trim()) return;
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent, mode: 'publish' }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishMessage(`Successfully published dataset version ${data.publishedVersion}!`);
        setImportPreview(null);
        setCsvContent('');
        fetchStats();
      } else {
        alert(data.error || 'Failed to publish dataset');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle Rollback
  const handleRollback = async (version: string) => {
    if (!confirm(`Are you sure you want to rollback the active dataset to version ${version}?`)) return;
    try {
      const res = await fetch('/api/admin/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback', targetVersion: version }),
      });
      if (res.ok) {
        alert(`Successfully rolled back to version ${version}`);
        fetchVersions();
        fetchStats();
      }
    } catch (e: any) {
      alert('Rollback failed: ' + e.message);
    }
  };

  const sampleCsvTemplate = `brand,model,variant,segment,price,mileage,range,primary_style,abs,disc_brakes,digital_console,bluetooth
Hero,Splendor Plus,XTEC 2.0,Commuter,82911,73,,Minimal,none,false,true,true
Honda,Shine 100,Standard Drum,Commuter,65011,65,,Minimal,none,false,false,false
Ather,450X,Gen 3 Pro,Electric,154999,,150,Sporty,none,true,true,true
Bajaj,Pulsar NS200,Dual ABS,Sports,157427,36,,Sporty,dual,true,true,true`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-orange bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
            Internal Operations &bull; RBAC
          </span>
          <h1 className="text-3xl font-black text-brand-navy mt-1">Bike for U &bull; Admin CMS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage catalogue, dataset versioning, CSV diff publishing, and track data quality freshness.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setTab('dashboard')}
            className={`px-4 py-2 rounded-xl transition ${
              tab === 'dashboard' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600 hover:text-brand-navy'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab('import')}
            className={`px-4 py-2 rounded-xl transition ${
              tab === 'import' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600 hover:text-brand-navy'
            }`}
          >
            Bulk CSV Import
          </button>
          <button
            onClick={() => setTab('versions')}
            className={`px-4 py-2 rounded-xl transition ${
              tab === 'versions' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600 hover:text-brand-navy'
            }`}
          >
            Dataset Versions
          </button>
          <button
            onClick={() => setTab('variants')}
            className={`px-4 py-2 rounded-xl transition ${
              tab === 'variants' ? 'bg-brand-navy text-white shadow-sm' : 'text-slate-600 hover:text-brand-navy'
            }`}
          >
            Variants Manager
          </button>
        </div>
      </div>

      {/* ================= TAB 1: DASHBOARD ================= */}
      {tab === 'dashboard' && (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Variants</span>
              <div className="text-3xl font-black text-brand-navy mt-1">
                {loadingStats ? '...' : stats?.activeVariants ?? 0}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">In recommendation pool</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Freshness Rate</span>
              <div className="text-3xl font-black text-brand-green mt-1">
                {loadingStats ? '...' : `${stats?.verifiedRate ?? 95}%`}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Verified within 60 days</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reports</span>
              <div className="text-3xl font-black text-brand-navy mt-1">
                {loadingStats ? '...' : stats?.totalPdfReports ?? 0}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">PDFs generated & delivered</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Result Helpfulness</span>
              <div className="text-3xl font-black text-brand-orange mt-1">
                {loadingStats ? '...' : `${stats?.helpfulnessRate ?? 100}%`}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Positive consumer signal</span>
            </div>
          </div>

          {/* Data Quality & Governance Strip (FR-504) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-brand-navy mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-brand-green" /> Data Quality Gates & Audit Log
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Active Dataset Version</span>
                <span className="text-base font-black text-brand-orange">v{stats?.activeDatasetVersion || '1.0.0'}</span>
                <p className="mt-2 text-slate-400">Deterministic snapshot tagging enforced across all user sessions.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Stale Record Threshold</span>
                <span className="text-base font-black text-slate-700">{stats?.staleRecords ?? 0} Variants</span>
                <p className="mt-2 text-slate-400">Records unverified for &gt;60 days are flagged for editor audit.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Price Outlier Detection</span>
                <span className="text-base font-black text-brand-green">15% Tolerance Alert</span>
                <p className="mt-2 text-slate-400">CSV bulk import flags any price shift greater than 15% before publishing.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: BULK CSV IMPORT ================= */}
      {tab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-brand-navy mb-2 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-brand-orange" /> Bulk CSV Import with Diff Preview (FR-502)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Paste CSV contents below. The system validates required fields, checks for duplicate slugs, and flags price changes exceeding &plusmn;15% before publishing.
            </p>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">CSV Data</label>
                <button
                  type="button"
                  onClick={() => setCsvContent(sampleCsvTemplate)}
                  className="text-xs text-brand-orange font-semibold hover:underline"
                >
                  Load Sample Template
                </button>
              </div>
              <textarea
                rows={8}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full font-mono text-xs p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-brand-navy outline-none"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreviewCsv}
                disabled={previewLoading || !csvContent.trim()}
                className="px-6 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {previewLoading ? 'Analyzing...' : 'Generate Diff Preview'}
              </button>

              {importPreview && importPreview.isValid && (
                <button
                  onClick={handlePublishCsv}
                  disabled={previewLoading}
                  className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs transition shadow-md"
                >
                  Publish & Create Immutable Version
                </button>
              )}
            </div>

            {publishMessage && (
              <div className="mt-4 p-4 bg-green-50 text-green-800 border border-green-200 rounded-2xl text-xs font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> {publishMessage}
              </div>
            )}
          </div>

          {/* Import Preview Results */}
          {importPreview && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-brand-navy text-sm">
                Diff Preview Summary ({importPreview.diffs?.length ?? 0} variants)
              </h4>

              {importPreview.errors?.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-1">
                  <div className="font-bold text-red-800 text-xs flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-red-600" /> Validation Errors Found
                  </div>
                  {importPreview.errors.map((e: any, idx: number) => (
                    <div key={idx} className="text-xs text-red-700">
                      Row {e.row} [{e.field}]: {e.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Brand & Model</th>
                      <th className="py-2.5 px-3">Variant</th>
                      <th className="py-2.5 px-3">Old Price</th>
                      <th className="py-2.5 px-3">New Price</th>
                      <th className="py-2.5 px-3">Change %</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreview.diffs.map((d: any) => (
                      <tr key={d.key} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              d.action === 'insert' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {d.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {d.brand} {d.model}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{d.variant}</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {d.oldPrice ? `INR ${d.oldPrice.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-brand-navy">
                          INR {d.newPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3">
                          {d.priceChangePct !== undefined ? (
                            <span className={d.isOutlier ? 'text-red-600 font-bold' : 'text-slate-600'}>
                              {d.priceChangePct > 0 ? `+${d.priceChangePct}%` : `${d.priceChangePct}%`}
                            </span>
                          ) : (
                            'New'
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {d.isOutlier ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              Outlier &gt;15%
                            </span>
                          ) : (
                            <span className="text-[10px] text-green-700">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: DATASET VERSIONS ================= */}
      {tab === 'versions' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-brand-navy">Immutable Dataset Versions (FR-503)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Every publish creates an immutable dataset version. Roll back instantly in case of data errors.
              </p>
            </div>

            <button
              onClick={fetchVersions}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {versions.map((ver) => (
              <div key={ver.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black text-brand-navy">v{ver.version}</span>
                    {ver.isActive && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase">
                        Active Live Version
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Published by {ver.publishedBy} &bull; {new Date(ver.publishedAt).toLocaleString('en-IN')} &bull;{' '}
                    {ver.recordCount} variants
                  </div>
                  {ver.notes && <div className="text-xs text-slate-400 mt-0.5 italic">{ver.notes}</div>}
                </div>

                {!ver.isActive && (
                  <button
                    onClick={() => handleRollback(ver.version)}
                    className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" /> One-Click Rollback
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: VARIANTS MANAGER ================= */}
      {tab === 'variants' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-brand-navy">Active Two-Wheeler Catalogue</h3>
              <p className="text-xs text-slate-500 mt-1">Showing all variants currently scoring in the recommendation engine.</p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search model or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchVariants()}
                className="px-3.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none w-full sm:w-64"
              />
              <button
                onClick={fetchVariants}
                className="px-4 py-1.5 rounded-xl bg-brand-navy text-white text-xs font-bold"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-3">Brand & Model</th>
                  <th className="py-2.5 px-3">Variant</th>
                  <th className="py-2.5 px-3">Segment</th>
                  <th className="py-2.5 px-3">Ex-Showroom</th>
                  <th className="py-2.5 px-3">Efficiency / Range</th>
                  <th className="py-2.5 px-3">Style</th>
                  <th className="py-2.5 px-3">Last Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variants.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {v.model.brand.name} {v.model.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{v.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                        {v.model.segment}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-brand-navy">
                      INR {v.exShowroomPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {v.araiMileage ? `${v.araiMileage} km/l` : v.evRange ? `${v.evRange} km/charge` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{v.primaryStyle}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(v.lastVerifiedAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
