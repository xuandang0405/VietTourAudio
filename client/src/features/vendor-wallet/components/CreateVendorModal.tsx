import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminModal } from '../../../admin/components/AdminModal';
import { useToursList } from '../../../admin/api/adminQueries';

interface CreateVendorModalProps {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    vendorCode: string;
    assignedTourId: string | null;
    legalName: string;
    tradeName: string;
    contactEmail: string;
  }) => void;
}

export function CreateVendorModal({ open, onClose, onConfirm, isSubmitting }: CreateVendorModalProps) {
  const { t } = useTranslation();
  const { data: tours = [] } = useToursList();

  const [vendorCode, setVendorCode] = useState('');
  const [assignedTourId, setAssignedTourId] = useState('');
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    setValidationError('');

    if (!vendorCode.trim()) {
      setValidationError(t('admin.vendors.validation.code_required', { defaultValue: 'Mã vendor không được để trống.' }));
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(vendorCode.trim())) {
      setValidationError(t('admin.vendors.validation.code_invalid', { defaultValue: 'Mã vendor chỉ được chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới.' }));
      return;
    }
    if (!legalName.trim()) {
      setValidationError(t('admin.vendors.validation.legal_name_required', { defaultValue: 'Tên pháp lý không được để trống.' }));
      return;
    }
    if (!tradeName.trim()) {
      setValidationError(t('admin.vendors.validation.trade_name_required', { defaultValue: 'Tên sạp hàng không được để trống.' }));
      return;
    }
    if (!contactEmail.trim()) {
      setValidationError(t('admin.vendors.validation.email_required', { defaultValue: 'Email liên hệ không được để trống.' }));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(contactEmail)) {
      setValidationError(t('admin.vendors.validation.email_invalid', { defaultValue: 'Email liên hệ không đúng định dạng.' }));
      return;
    }

    onConfirm({
      vendorCode: vendorCode.trim(),
      assignedTourId: assignedTourId ? String(assignedTourId) : null,
      legalName: legalName.trim(),
      tradeName: tradeName.trim(),
      contactEmail: contactEmail.trim(),
    });
  };

  return (
    <AdminModal
      open={open}
      title={t('admin.vendors.create_btn')}
      confirmLabel={isSubmitting ? t('common.saving', { defaultValue: 'Đang lưu...' }) : t('common.save')}
      onClose={onClose}
      onConfirm={handleSubmit}
    >
      <div className="space-y-4">
        {validationError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600">
            {validationError}
          </div>
        )}

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
            {t('admin.vendors.table.code')}
          </label>
          <input
            type="text"
            value={vendorCode}
            onChange={(e) => setVendorCode(e.target.value)}
            placeholder="VND-HOIAN-01"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
            {t('admin.vendors.table.zone')}
          </label>
          <select
            value={assignedTourId}
            onChange={(e) => setAssignedTourId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition duration-200"
          >
            <option value="">{t('common.select')}</option>
            {tours.map((tour: any) => (
              <option key={tour.id} value={tour.id}>
                {tour.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
            {t('vendor.legal_name', { defaultValue: 'Tên pháp lý' })}
          </label>
          <input
            type="text"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="Công ty TNHH Du lịch Hội An"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
            {t('admin.vendors.table.name')}
          </label>
          <input
            type="text"
            value={tradeName}
            onChange={(e) => setTradeName(e.target.value)}
            placeholder="Sạp ẩm thực số 1"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
            {t('admin.vendors.table.email')}
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition duration-200"
          />
        </div>
      </div>
    </AdminModal>
  );
}
