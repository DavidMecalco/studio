
import type { SVGProps } from 'react';

const CompanyLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="60" 
    height="30"
    viewBox="0 0 120 60" // Adjusted viewBox
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Company Logo"
    {...props}
  >
    {/* Simplified 'd' shape in dark gray */}
    <path
      d="M45 50 C25 50 15 38 15 25 C15 12 25 0 45 0 L55 0 L55 50 L45 50 Z M45 42 C30 42 23 35 23 25 C23 15 30 8 45 8 L47 8 L47 42 L45 42 Z"
      fill="#4A5568" // Dark Gray
    />
    {/* Simplified 'a' shape in blue, overlapping */}
    <path
      d="M90 50 C78 50 65 40 65 25 C65 10 78 0 90 0 C102 0 105 10 105 25 L105 40 L97 40 L97 25 C97 15 92 8 90 8 C85 8 80 15 80 25 C80 35 85 42 90 42 C95 42 97 35 97 30 L105 30 C105 40 102 50 90 50 Z M65 50 L65 58 L90 58 C90 58 100 58 100 50 L65 50Z"
      fill="#4299E1" // Blue
      transform="translate(-15, 0)" // Adjust overlap
    />
  </svg>
);

export default CompanyLogo;
