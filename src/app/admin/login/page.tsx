import Image from "next/image";
import { redirect } from "next/navigation";
import LoginForm from "@/app/admin/login/LoginForm";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Sign in — TCB CRM" };

export default async function AdminLoginPage() {
  if (await currentUser()) redirect("/admin");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6">
      <div
        className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-orange-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-center">
            <Image
              src="/images/tcb-logo-2.png"
              alt="The Contractor Broker"
              width={300}
              height={90}
              className="h-10 w-auto rounded bg-white px-2 py-1"
              priority
            />
          </div>
          <h1 className="mt-8 text-center text-2xl font-bold text-white">
            CRM Sign In
          </h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            Staff access to leads and enquiries
          </p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          The Contractor Broker — internal use only
        </p>
      </div>
    </main>
  );
}
