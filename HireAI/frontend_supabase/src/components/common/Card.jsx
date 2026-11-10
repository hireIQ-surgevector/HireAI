function Card({ as: Element = "div", className = "", children, ...props }) {
  return (
    <Element
      className={`rounded-xl border border-[#e2e8f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.035)] ${className}`}
      {...props}
    >
      {children}
    </Element>
  );
}

export function CardHeader({ title, description, action, className = "" }) {
  return (
    <div
      className={`mb-4 flex items-start justify-between gap-4 max-[600px]:flex-col ${className}`}
    >
      <div className="min-w-0">
        {title && (
          <h2 className="m-0 text-base font-bold tracking-tight text-[#1e293b]">
            {title}
          </h2>
        )}
        {description && (
          <p className="mb-0 mt-1 text-sm leading-6 text-[#64748b]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export default Card;
