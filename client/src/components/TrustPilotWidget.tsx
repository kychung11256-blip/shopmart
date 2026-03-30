import React from 'react';

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement | null, force?: boolean) => void;
    };
  }
}

export const TrustPilotWidget: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (window.Trustpilot) {
      window.Trustpilot.loadFromElement(ref.current, true);
    }
  }, []);

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale="en-US"
      data-template-id="56278e9abfbbba0bdcd568bc"
      data-businessunit-id="69ca329a4b8f8e17f2b53f0e"
      data-style-height="52px"
      data-style-width="100%"
      data-token="c17328f1-daeb-4272-b9e2-e559ce742542"
    >
      <a href="https://www.trustpilot.com/review/mynft01.eu.cc" target="_blank" rel="noopener noreferrer">
        Trustpilot
      </a>
    </div>
  );
};
