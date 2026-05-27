interface SecondaryButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  className?: string;
}

const baseClass =
  "inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-gray-900 shadow-sm ring-1 ring-gray-100 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function SecondaryButton({
  children,
  type = "button",
  onClick,
  disabled,
  href,
  className = "",
}: SecondaryButtonProps) {
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
