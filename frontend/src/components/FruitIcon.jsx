import React from 'react';

export default function FruitIcon({ dark }) {
  return dark ? (
    /* Bitten apple — shown when currently in dark mode */
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 5 Q13.5 2.5 16 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M13.2 4.2 Q16 1.5 17.5 3 Q15.5 5 13.2 4.2Z" />
      <path
        fillRule="evenodd"
        d="
          M12 6.5
          C10.5 4.5 6.5 4.8 5 7.5
          C3 11 3.5 16.5 6 19.5
          C7.5 21.5 9.5 22.5 11.2 22.5
          C11.8 22.5 12.2 22.2 12 22
          C12.8 22.2 13.2 22.5 14.8 22.5
          C16.5 22.5 18.5 21.5 20 19.5
          C22.5 16.5 21 8 17 6
          C15.5 5.2 13.5 4.5 12 6.5Z
          M17 7
          C15.1 7 13.5 8.6 13.5 10.5
          C13.5 12.4 15.1 14 17 14
          C18.9 14 20.5 12.4 20.5 10.5
          C20.5 8.6 18.9 7 17 7Z
        "
      />
    </svg>
  ) : (
    /* Full apple — shown when currently in light mode */
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 5 Q13.5 2.5 16 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M13.2 4.2 Q16 1.5 17.5 3 Q15.5 5 13.2 4.2Z" />
      <path
        d="
          M12 6.5
          C10.5 4.5 6.5 4.8 5 7.5
          C3 11 3.5 16.5 6 19.5
          C7.5 21.5 9.5 22.5 11.2 22.5
          C11.8 22.5 12.2 22.2 12 22
          C12.8 22.2 13.2 22.5 14.8 22.5
          C16.5 22.5 18.5 21.5 20 19.5
          C22.5 16.5 21 8 17 6
          C15.5 5.2 13.5 4.5 12 6.5Z
        "
      />
    </svg>
  );
}
