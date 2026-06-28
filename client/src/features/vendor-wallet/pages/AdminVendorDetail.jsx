import { ArrowLeft, Ban, CheckCircle2, FileText, PauseCircle, Copy } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useVendor, useVendorAction, useResetStallQr, useToggleStallPremium, useGrantMultiPremium, useSetPremiumPriority, useAdminCreateStallForVendor } from '../../../admin/api/adminQueries';
import { AdminBadge } from '../../../admin/components/AdminBadge';
import { AdminModal } from '../../../admin/components/AdminModal';
import { AdminPageHeader } from '../../../admin/components/AdminPageHeader';
import { useAdminAuthStore } from '../../../admin/store/adminAuthStore';
import { formatCurrency, formatDate, formatDateTime } from '../../../admin/utils/formatters';
import { QRCodeCanvas } from 'qrcode.react';
import { appConfig } from '../../../config/appConfig';

export function AdminVendorDetail() {
  const { id } = useParams();
  const { data: vendor, isLoading, error } = useVendor(id);
  const isSuperAdmin = useAdminAuthStore((state) => state.isSuperAdmin());
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const approveMutation = useVendorAction('approve');
  const rejectMutation = useVendorAction('reject');
  const suspendMutation = useVendorAction('suspend');
  const forceMutation = useVendorAction('force-cancel');
  const [selectedStall, setSelectedStall] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('qr');
  const resetQrMutation = useResetStallQr();
  const togglePremiumMutation = useToggleStallPremium();
  const [copiedStallCode, setCopiedStallCode] = useState(false);

  // Admin overrides state & mutations
  const [showAddStallModal, setShowAddStallModal] = useState(false);
  const [newStallName, setNewStallName] = useState('');
  const [newStallDesc, setNewStallDesc] = useState('');
  const [newStallLat, setNewStallLat] = useState('10.77582');
  const [newStallLng, setNewStallLng] = useState('106.70208');

  const grantMultiPremiumMutation = useGrantMultiPremium();
  const setPremiumPriorityMutation = useSetPremiumPriority();
  const createStallForVendorMutation = useAdminCreateStallForVendor();

  async function handleGrantMultiPremium() {
    if (!window.confirm("Xác nhận kích hoạt trạng thái Premium (bán kính 10m) cho TẤT CẢ các sạp hàng của Vendor này?")) return;
    try {
      await grantMultiPremiumMutation.mutateAsync(vendor.id);
      alert("Đã cấp Premium thành công cho tất cả các sạp!");
    } catch (err) {
      alert(err.response?.data?.error ?? "Không thể cấp Premium.");
    }
  }

  async function handleSetPremiumPriority(stallId) {
    try {
      await setPremiumPriorityMutation.mutateAsync({ stallId, vendorId: vendor.id });
    } catch (err) {
      alert(err.response?.data?.error ?? "Không thể thay đổi ưu tiên Premium.");
    }
  }

  async function handleCreateStallForVendor() {
    if (!newStallName.trim()) {
      alert("Vui lòng điền tên sạp hàng.");
      return;
    }
    try {
      await createStallForVendorMutation.mutateAsync({
        vendorId: vendor.id,
        data: {
          name: newStallName.trim(),
          description: newStallDesc.trim(),
          latitude: parseFloat(newStallLat),
          longitude: parseFloat(newStallLng)
        }
      });
      setShowAddStallModal(false);
      setNewStallName('');
      setNewStallDesc('');
      alert("Đã tạo sạp thành công!");
    } catch (err) {
      alert(err.response?.data?.error ?? "Không thể tạo sạp.");
    }
  }

  async function handleResetQr(stallId) {
    try {
      const response = await resetQrMutation.mutateAsync(stallId);
      if (response && response.zoneCode) {
        setSelectedStall((prev) => prev ? { ...prev, zoneCode: response.zoneCode } : null);
      }
      setShowResetConfirm(false);
    } catch (err) {
      alert(err.response?.data?.error ?? 'Không thể reset mã QR.');
    }
  }

  function downloadQrPng() {
    const canvas = document.getElementById('admin-stall-qr-canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `stall-qr-${selectedStall?.zoneCode ?? 'code'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  function handleCopyStallCode(code) {
    navigator.clipboard.writeText(code);
    setCopiedStallCode(true);
    setTimeout(() => setCopiedStallCode(false), 2000);
  }

  async function handleConfirm() {
    if (!modal || !vendor) return;
    setActionError('');

    try {
      if (modal === 'approve') {
        await approveMutation.mutateAsync({ id: vendor.id });
      } else {
        if (!reason.trim()) {
          setActionError('Lý do là bắt buộc cho hành động này.');
          return;
        }
        const mutation = modal === 'reject' ? rejectMutation : modal === 'suspend' ? suspendMutation : forceMutation;
        await mutation.mutateAsync({ id: vendor.id, reason: reason.trim() });
      }
      setModal(null);
      setReason('');
    } catch (err) {
      setActionError(err.response?.data?.error ?? 'Không thể cập nhật vendor.');
    }
  }

  if (isLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500">Đang tải chi tiết vendor...</div>;
  }

  if (error || !vendor) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4">
        <Link to="/admin/vendors" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
          <ArrowLeft size={17} />
          Quay lại
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
          {error?.response?.data?.error ?? 'Không tìm thấy vendor.'}
        </div>
      </div>
    );
  }

  const transactions = vendor.wallet?.transactions ?? [];
  const topUps = vendor.topUpRequests ?? [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Chi tiết vendor"
        title={vendor.businessName}
        description="Thông tin hồ sơ, subscription, số dư ví, top-up và các hành động kiểm soát trạng thái."
        action={
          <Link
            to="/admin/vendors"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Quay lại
          </Link>
        }
      />

      {actionError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{actionError}</div>}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_400px]">
        <div className="space-y-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Hồ sơ kinh doanh</h2>
                <p className="mt-1 text-sm text-slate-500">Mã vendor #{vendor.id}</p>
              </div>
              <AdminBadge status={vendor.verificationStatus} />
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Info label="Người đại diện" value={vendor.ownerDisplayName ?? '-'} />
              <Info label="Email" value={vendor.ownerEmail} />
              <Info label="Số điện thoại" value={vendor.contactPhone ?? '-'} />
              <Info label="Mã số thuế" value={vendor.taxCode ?? '-'} />
              <Info label="Ngày đăng ký" value={formatDate(vendor.createdAt)} />
              <Info label="Số stall" value={`${vendor.stalls?.length ?? 0} stall`} />
            </dl>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-950">Stalls</h2>
              {(vendor.stalls ?? []).length < 3 && (
                <button
                  type="button"
                  onClick={() => setShowAddStallModal(true)}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-black text-white hover:bg-indigo-700 transition"
                >
                  + Thêm sạp phụ
                </button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(vendor.stalls ?? []).map((stall) => (
                <div
                  key={stall.id}
                  onClick={() => setSelectedStall(stall)}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 cursor-pointer hover:bg-slate-100 hover:border-slate-200 transition duration-150 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{stall.name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {stall.latitude ?? '-'}, {stall.longitude ?? '-'} | bán kính {stall.activationRadius}m
                        </p>
                      </div>
                      <AdminBadge status={stall.status} />
                    </div>
                  </div>

                  {/* Priority Swapper */}
                  <div className="mt-4 border-t border-slate-200/60 pt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="radio"
                      id={`priority-${stall.id}`}
                      name="premium-priority-group"
                      checked={Boolean(stall.isPremiumPriority)}
                      onChange={() => handleSetPremiumPriority(stall.id)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300"
                    />
                    <label htmlFor={`priority-${stall.id}`} className="text-xs font-bold text-slate-700 cursor-pointer">
                      Sắp đặt Đặc quyền Phát Premium
                    </label>
                  </div>
                </div>
              ))}
              {(vendor.stalls ?? []).length === 0 && <p className="text-sm font-semibold text-slate-500">Vendor chưa có stall.</p>}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Giao dịch ví gần đây</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="py-3">Loại</th>
                    <th className="py-3">Mô tả</th>
                    <th className="py-3">Số tiền</th>
                    <th className="py-3">Sau GD</th>
                    <th className="py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3"><AdminBadge status={tx.type} /></td>
                      <td className="py-3 font-semibold text-slate-700">{tx.description}</td>
                      <td className="py-3 font-bold text-slate-800">{formatCurrency(tx.amount)}</td>
                      <td className="py-3 font-bold text-slate-800">{formatCurrency(tx.balanceAfter)}</td>
                      <td className="py-3 text-slate-600">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm font-semibold text-slate-500">Chưa có giao dịch ví.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <aside className="space-y-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Subscription & ví</h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">{vendor.subscription?.plan?.name ?? 'Chưa có gói'}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Hết hạn {formatDate(vendor.subscription?.periodEnd)}</p>
              <div className="mt-3"><AdminBadge status={vendor.subscription?.status ?? 'DRAFT'} /></div>
            </div>
            <p className="mt-4 text-3xl font-black text-slate-950">{formatCurrency(vendor.wallet?.balance)}</p>
            <p className="text-sm font-semibold text-slate-500">Số dư ví vendor</p>

            <button
              type="button"
              onClick={handleGrantMultiPremium}
              className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-xl text-sm font-bold transition shadow-[0_0_10px_rgba(245,158,11,0.3)]"
            >
              ★ Cấp Đặc Quyền Multi-Premium
            </button>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Top-up gần đây</h2>
            <div className="mt-4 space-y-3">
              {topUps.map((topUp) => (
                <div key={topUp.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black text-slate-950">{formatCurrency(topUp.amount)}</span>
                    <AdminBadge status={topUp.status} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{formatDateTime(topUp.createdAt)}</p>
                </div>
              ))}
              {topUps.length === 0 && <p className="text-sm font-semibold text-slate-500">Chưa có top-up request.</p>}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Hành động</h2>
            <div className="mt-4 grid gap-2">
              <ActionButton icon={CheckCircle2} label="Duyệt vendor" tone="success" onClick={() => setModal('approve')} />
              <ActionButton icon={Ban} label="Từ chối hồ sơ" tone="danger" onClick={() => { setReason(''); setModal('reject'); }} />
              <ActionButton icon={PauseCircle} label="Tạm dừng vendor" onClick={() => { setReason(''); setModal('suspend'); }} />
              {isSuperAdmin && <ActionButton icon={FileText} label="Force cancel" tone="danger" onClick={() => { setReason(''); setModal('force-cancel'); }} />}
            </div>
          </article>
        </aside>
      </section>

      <AdminModal
        open={Boolean(modal)}
        title="Xác nhận thao tác vendor"
        description={modal === 'approve' ? 'Vendor sẽ chuyển sang APPROVED.' : 'Lý do là bắt buộc và sẽ được lưu vào AuditLog.'}
        confirmLabel="Xác nhận"
        tone={modal === 'approve' ? 'success' : 'danger'}
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      >
        {modal !== 'approve' && (
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Nhập lý do thao tác..."
          />
        )}
      </AdminModal>

      <AdminModal
        open={Boolean(selectedStall)}
        title={`Chi tiết Sạp: ${selectedStall?.name}`}
        confirmLabel="Đóng"
        onClose={() => { setSelectedStall(null); setActiveTab('qr'); }}
        onConfirm={() => { setSelectedStall(null); setActiveTab('qr'); }}
      >
        {selectedStall && (
          <div>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-4">
              <button
                type="button"
                className={`py-2 px-4 text-sm font-bold border-b-2 transition ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                onClick={() => setActiveTab('info')}
              >
                Thông tin chung
              </button>
              <button
                type="button"
                className={`py-2 px-4 text-sm font-bold border-b-2 transition ${activeTab === 'qr' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                onClick={() => setActiveTab('qr')}
              >
                Mã QR Trực tiếp
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <Info label="Tên sạp" value={selectedStall.name} />
                <Info label="Tọa độ" value={`${selectedStall.latitude ?? '-'}, ${selectedStall.longitude ?? '-'}`} />
                <Info label="Bán kính kích hoạt" value={`${selectedStall.activationRadius ?? 0}m`} />
                <Info label="Trạng thái" value={selectedStall.status} />

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-950">Trạng thái Premium</p>
                    <p className="text-xs text-slate-500">
                      {selectedStall.isPremium ? 'Đang hoạt động (Premium)' : 'Sạp thường (Miễn phí)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const targetPremium = !selectedStall.isPremium;
                        await togglePremiumMutation.mutateAsync({
                          stallId: selectedStall.id,
                          isPremium: targetPremium,
                          vendorId: vendor.id
                        });
                        setSelectedStall(prev => prev ? { ...prev, isPremium: targetPremium } : null);
                      } catch (err) {
                        alert('Không thể cập nhật trạng thái Premium.');
                      }
                    }}
                    className={`inline-flex h-9 items-center justify-center px-4 rounded-xl text-xs font-bold transition active:scale-[0.98] ${
                      selectedStall.isPremium
                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  >
                    {selectedStall.isPremium ? 'Hủy Premium' : 'Duyệt Premium'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                {selectedStall.zoneCode ? (
                  <>
                    <div className="text-center">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">Mã định danh khu vực</p>
                      <h3 className="text-2xl font-black text-slate-900 mt-1 select-all">
                        Mã Khu Vực: {selectedStall.zoneCode}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopyStallCode(selectedStall.zoneCode)}
                        className="text-xs text-blue-600 hover:underline mt-1 font-bold"
                      >
                        {copiedStallCode ? 'Đã sao chép!' : 'Sao chép mã'}
                      </button>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <QRCodeCanvas
                        id="admin-stall-qr-canvas"
                        value={`${import.meta.env.VITE_GUEST_APP_URL || appConfig.publicAppUrl || window.location.origin}/zone/${selectedStall.zoneCode}`}
                        size={200}
                        level="M"
                        includeMargin
                      />
                    </div>

                    <div className="flex gap-2 w-full">
                      <button
                        type="button"
                        onClick={downloadQrPng}
                        className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-black transition hover:bg-blue-700 active:scale-[0.98]"
                      >
                        Tải xuống QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 text-red-600 text-sm font-black transition hover:bg-red-50 active:scale-[0.98]"
                      >
                        Reset/Tạo mới QR
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm font-semibold text-slate-500 mb-4">Sạp này chưa cấu hình mã QR.</p>
                    <button
                      type="button"
                      onClick={() => handleResetQr(selectedStall.id)}
                      className="inline-flex h-11 items-center justify-center px-6 rounded-xl bg-blue-600 text-white text-sm font-black transition hover:bg-blue-700 active:scale-[0.98]"
                    >
                      Tạo mới QR
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </AdminModal>

      <AdminModal
        open={showResetConfirm}
        title="Xác nhận Reset Mã QR"
        description="Mã QR cũ sẽ bị vô hiệu hóa. Khách hàng quét mã cũ sẽ không truy cập được vào sạp này nữa. Bạn có chắc chắn muốn tạo mã QR mới?"
        confirmLabel="Xác nhận Reset"
        tone="danger"
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          if (selectedStall) {
            handleResetQr(selectedStall.id);
          }
        }}
      />

      <AdminModal
        open={showAddStallModal}
        title="Admin Thêm Sạp Phụ"
        description="Thêm sạp phụ trực tiếp cho Vendor (bỏ qua giới hạn Premium/Thanh toán)."
        confirmLabel="Tạo sạp hàng"
        tone="success"
        onClose={() => setShowAddStallModal(false)}
        onConfirm={handleCreateStallForVendor}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Tên sạp hàng</label>
            <input
              type="text"
              value={newStallName}
              onChange={(e) => setNewStallName(e.target.value)}
              placeholder="VD: Sạp Bánh Mì Cô Ba"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Mô tả</label>
            <textarea
              value={newStallDesc}
              onChange={(e) => setNewStallDesc(e.target.value)}
              placeholder="Nhập mô tả ngắn về sạp hàng..."
              className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Vĩ độ (Latitude)</label>
              <input
                type="number"
                step="any"
                value={newStallLat}
                onChange={(e) => setNewStallLat(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Kinh độ (Longitude)</label>
              <input
                type="number"
                step="any"
                value={newStallLng}
                onChange={(e) => setNewStallLng(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}

function ActionButton({ icon: Icon, label, tone = 'default', onClick }) {
  const toneClass =
    tone === 'success'
      ? 'border-green-200 text-green-700 hover:bg-green-50'
      : tone === 'danger'
        ? 'border-red-200 text-red-700 hover:bg-red-50'
        : 'border-slate-200 text-slate-700 hover:bg-slate-50';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-black transition ${toneClass}`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}
