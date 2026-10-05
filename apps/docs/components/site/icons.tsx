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

export function SoundIcon({ size = 16, muted = false }: IconProps & { muted?: boolean }): React.JSX.Element {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 16 16" width={size}>
      <path d="M2 6h2.5L8 3v10L4.5 10H2V6Z" fill="currentColor" />
      {muted ? (
        <path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      ) : (
        <>
          <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M12.5 3.5a6.5 6.5 0 0 1 0 9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}
