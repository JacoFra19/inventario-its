type ActivityCategoryIconProps = {
  category: string;
  className?: string;
};

function iconPath(category: string) {
  if (category === "assignee") {
    return (
      <>
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    );
  }

  if (category === "stock") {
    return (
      <>
        <path d="M4 7.5 12 3l8 4.5-8 4.5L4 7.5Z" />
        <path d="m4 12 8 4.5L20 12" />
        <path d="m4 16.5 8 4.5 8-4.5" />
      </>
    );
  }

  if (category === "event") {
    return (
      <>
        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <path d="M4 9h16" />
        <rect x="4" y="5" width="16" height="16" rx="3" />
      </>
    );
  }

  if (category === "import") {
    return (
      <>
        <path d="M12 3v11" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
      </>
    );
  }

  if (category === "transfer") {
    return (
      <>
        <path d="M7 7h12" />
        <path d="m15 3 4 4-4 4" />
        <path d="M17 17H5" />
        <path d="m9 13-4 4 4 4" />
      </>
    );
  }

  if (category === "system") {
    return (
      <>
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="m4.93 4.93 2.12 2.12" />
        <path d="m16.95 16.95 2.12 2.12" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
        <path d="m4.93 19.07 2.12-2.12" />
        <path d="m16.95 7.05 2.12-2.12" />
      </>
    );
  }

  return (
    <>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </>
  );
}

export default function ActivityCategoryIcon({
  category,
  className = "",
}: ActivityCategoryIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`h-5 w-5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {iconPath(category)}
    </svg>
  );
}
