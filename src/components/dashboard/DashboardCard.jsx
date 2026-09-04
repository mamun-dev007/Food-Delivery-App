const DashboardCard = ({
  title,
  subtitle,
  action,
  children,
  className = "",
  bodyClassName = "",
}) => (
  <section
    className={`rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}
  >
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-base-content">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-base-content/50">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export default DashboardCard;