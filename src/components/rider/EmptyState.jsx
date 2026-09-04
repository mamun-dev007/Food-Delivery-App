const EmptyState = ({ icon: Icon, title, message, action = null }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-14 text-center">
    {Icon && (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200 text-base-content/40">
        <Icon className="h-7 w-7" />
      </span>
    )}
    <p className="mt-4 text-base font-bold text-base-content">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-base-content/50">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;