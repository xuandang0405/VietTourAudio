export function PermissionGuide({ type }) {
  const text = type === 'camera'
    ? 'Ban da tu choi camera. Hay cap quyen camera de quet QR hoac nhap token thu cong.'
    : 'Ban da tu choi GPS. Hay mo quyen vi tri de bat autoplay theo geofence.';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      {text}
    </div>
  );
}
