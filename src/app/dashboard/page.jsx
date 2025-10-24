"use client";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { UploadFiles } from "@/components/dashboard/UploadFiles";
import { ViewDocs } from "@/components/dashboard/ViewDocs";

export default function dashboard() {
  return (
    <main className="w-[90%] min-h-screen m-auto py-5">
      <section className="w-[90%] m-auto flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex flex-col gap-5 w-[40%] md:w-[25%]">
          <UploadFiles />
          <LogoutButton />
        </div>
        <ViewDocs />
      </section>
    </main>
  );
}
