


interface DangerButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  className?: string;
}

const baseClass =
  "inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function DangerButton({
  children,
  type = "button",
  onClick,
  disabled,
  href,
  className = "",
}: DangerButtonProps) {
  const finalClass = `${baseClass} ${className}`;

  if (href) {
    return (
      <a href={href} className={finalClass}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={finalClass}
    >
      {children}
    </button>
  );
}