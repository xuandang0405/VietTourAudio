import { ArrowLeft, Ban, CheckCircle2, FileText, PauseCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AdminBadge } from '../components/AdminBadge';
import { AdminModal } from '../components/AdminModal';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { formatCurrency, payments, vendors } from '../data/adminMockData';
import { useState } from 'react';

export function AdminVendorDetail() {
  const { id } = useParams();
  const [modal, setModal] = useState(null);
  const vendor = vendors.find((item) => item.id === id) ?? vendors[0];
  const recentPayments = payments.filter((payment) => payment.vendorName === vendor.businessName || payment.vendorName === 'Quầy Cà Phê Di Sản');

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <AdminPageHeader
        eyebrow="Chi tiết vendor"
        title={vendor.businessName}
        description="Thông tin hồ sơ, subscription, doanh thu gần đây và các hành động kiểm soát trạng thái."
        action={
          <Link
            to="/admin/vendors"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition duration-200 ease-out hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Quay lại
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_380px]">
        <div className="space-y-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Hồ sơ kinh doanh</h2>
                <p className="mt-1 text-sm text-slate-500">Mã vendor {vendor.id}</p>
              </div>
              <AdminBadge status={vendor.verificationStatus} />
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Info label="Người đại diện" value={vendor.ownerDisplayName} />
              <Info label="Email" value={vendor.ownerEmail} />
              <Info label="Số điện thoại" value={vendor.contactPhone} />
              <Info label="Mã số thuế" value={vendor.taxCode} />
              <Info label="Ngày đăng ký" value={vendor.createdAt} />
              <Info label="Số sạp" value={`${vendor.stalls} sạp`} />
            </dl>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Thanh toán gần đây</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[640px] w-full text-left text-sm">
                <thead className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="py-3">Mã</th>
                    <th className="py-3">Loại</th>
                    <th className="py-3">Provider</th>
                    <th className="py-3">Số tiền</th>
                    <th className="py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="py-3 font-black text-slate-950">{payment.id}</td>
                      <td className="py-3 font-semibold text-slate-700">{payment.paymentType}</td>
                      <td className="py-3 text-slate-600">{payment.provider}</td>
                      <td className="py-3 font-bold text-slate-800">{formatCurrency(payment.amount)}</td>
                      <td className="py-3"><AdminBadge status={payment.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <aside className="space-y-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Subscription</h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">{vendor.subscription.plan}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Hết hạn {vendor.subscription.periodEnd}</p>
              <div className="mt-3"><AdminBadge status={vendor.subscription.status} /></div>
            </div>
            <p className="mt-4 text-3xl font-black text-slate-950">{formatCurrency(vendor.revenue)}</p>
            <p className="text-sm font-semibold text-slate-500">Doanh thu ghi nhận</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Hành động</h2>
            <div className="mt-4 grid gap-2">
              <ActionButton icon={CheckCircle2} label="Duyệt vendor" tone="success" onClick={() => setModal('approve')} />
              <ActionButton icon={Ban} label="Từ chối hồ sơ" tone="danger" onClick={() => setModal('reject')} />
              <ActionButton icon={PauseCircle} label="Tạm dừng vendor" onClick={() => setModal('suspend')} />
              <ActionButton icon={FileText} label="Force cancel subscription" onClick={() => setModal('force-cancel')} />
            </div>
          </article>
        </aside>
      </section>

      <AdminModal
        open={Boolean(modal)}
        title="Xác nhận thao tác vendor"
        description="Khi nối backend, thao tác này cần ghi audit log với beforeData, afterData và lý do nếu là hành động từ chối/tạm dừng."
        confirmLabel="Xác nhận"
        tone={modal === 'reject' || modal === 'force-cancel' ? 'danger' : modal === 'approve' ? 'success' : 'blue'}
        onClose={() => setModal(null)}
        onConfirm={() => setModal(null)}
      >
        {modal !== 'approve' && (
          <textarea
            className="h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Nhập lý do thao tác..."
          />
        )}
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
      className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-black transition duration-200 ease-out ${toneClass}`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}
