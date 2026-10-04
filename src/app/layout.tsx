import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "The Contractor Broker | Umbrella Company Comparison",
    template: "%s | The Contractor Broker",
  },
  description:
    "The Contractor Broker connects contractors and agencies with the ideal umbrella company. Expert payroll, IR35 compliance and contractor support — completely free.",
  icons: { icon: "/images/cropped-Screenshot-2022-04-28-at-14.20.56-1.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GB"
      className={poppins.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
