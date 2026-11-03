const variants = {
  primary:
    "bg-[#133f7d] text-white shadow-sm hover:bg-[#0d2d5e] focus-visible:outline-[#00b4d8]",
  secondary:
    "border border-[#cbd5e1] bg-white text-[#133f7d] hover:border-[#133f7d] hover:bg-[#f8fafc] focus-visible:outline-[#00b4d8]",
  ghost:
    "border border-transparent bg-transparent text-[#64748b] hover:border-[#e2e8f0] hover:bg-[#f8fafc] hover:text-[#1e293b] focus-visible:outline-[#00b4d8]",
  danger:
    "bg-[#b91c1c] text-white shadow-sm hover:bg-[#991b1b] focus-visible:outline-[#ef4444]",
};

const sizes = {
  sm: "min-h-8 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-11 px-5 text-sm",
};

function Button({
  as: Element = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Element
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition duration-150 ease-out hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-55 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </Element>
  );
}

export default Button;
