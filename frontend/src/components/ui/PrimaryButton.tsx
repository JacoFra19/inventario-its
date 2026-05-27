

interface PrimaryButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  className?: string;
}

const baseClass =
  "inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50";

export default function PrimaryButton({
  children,
  type = "button",
  onClick,
  disabled,
  href,
  className = "",
}: PrimaryButtonProps) {
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