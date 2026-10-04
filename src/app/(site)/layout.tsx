import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Tracker from "@/components/Tracker";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <Tracker />
      {/* clip (not hidden) so off-screen reveal start positions can't widen
          the page on mobile, without breaking position: sticky */}
      <main className="overflow-x-clip">{children}</main>
      <Footer />
    </>
  );
}
