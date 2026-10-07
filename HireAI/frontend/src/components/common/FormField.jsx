const controlClasses =
  "min-h-10 w-full rounded-lg border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] hover:border-[#cbd5e1] focus:border-[#00b4d8] focus:ring-4 focus:ring-[#00b4d8]/10 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#94a3b8]";

function FieldLabel({ htmlFor, children, optional = false }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold text-[#334155]"
    >
      {children}
      {optional ? (
        <span className="ml-1 font-normal text-[#94a3b8]">Optional</span>
      ) : (
        <span aria-hidden="true" className="ml-1 text-[#dc2626]">
          *
        </span>
      )}
    </label>
  );
}

export function Input({
  id,
  label,
  optional,
  className = "",
  controlClassName = "",
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <FieldLabel htmlFor={id} optional={optional}>
          {label}
        </FieldLabel>
      )}
      <input
        id={id}
        className={`${controlClasses} ${controlClassName}`}
        {...props}
      />
    </div>
  );
}

export function Select({
  id,
  label,
  optional,
  className = "",
  controlClassName = "",
  children,
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <FieldLabel htmlFor={id} optional={optional}>
          {label}
        </FieldLabel>
      )}
      <select
        id={id}
        className={`${controlClasses} ${controlClassName}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({
  id,
  label,
  optional,
  className = "",
  controlClassName = "",
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <FieldLabel htmlFor={id} optional={optional}>
          {label}
        </FieldLabel>
      )}
      <textarea
        id={id}
        className={`${controlClasses} min-h-28 resize-y ${controlClassName}`}
        {...props}
      />
    </div>
  );
}

export default Input;
