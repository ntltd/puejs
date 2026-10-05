type IconProps = { size?: number };

export function ArrowRightIcon({ size = 14 }: IconProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 16 16" width={size}>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function CopyIcon({ size = 14 }: IconProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 16 16" width={size}>
      <rect height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="9" x="5.25" y="5.25" />
      <path
        d="M10.75 2.75v-.5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: IconProps): React.JSX.Element {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 16 16" width={size}>
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
    </svg>
  );
}
