export function ErrorState({ message, actionLabel = 'Thu lai', onAction }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p>{message || 'Da xay ra loi.'}</p>
      {onAction && (
        <button type="button" onClick={onAction} className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
