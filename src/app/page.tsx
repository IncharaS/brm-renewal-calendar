import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, CalendarDays, Upload } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center p-6 space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <h1 className="text-5xl font-semibold text-gray-800">
              BRM Renewal Calendar
            </h1>
            {isAuth && <UserButton />}
          </div>

          <p className="max-w-xl mt-3 text-lg text-slate-700">
            Upload your purchase agreements and track upcoming renewal and notice dates effortlessly.
          </p>

          <div className="flex mt-5 space-x-3">
            {isAuth ? (
              <>
                <Link href="/upload">
                  <Button className="flex items-center text-sm">
                    <Upload className="mr-2 w-5 h-5" /> Upload Agreement
                  </Button>
                </Link>

                <Link href="/calendar">
                  <Button className="flex items-center text-sm">
                    <CalendarDays className="mr-2 w-5 h-5" /> View Calendar
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/sign-in">
                <Button className="flex items-center text-sm">
                  <ArrowRight className="mr-2 w-5 h-5" /> Login to Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}