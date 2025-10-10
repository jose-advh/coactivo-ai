"use client";
import { UploadFiles } from "@/components/dashboard/UploadFiles";
import { ViewDocs } from "@/components/dashboard/ViewDocs";

export default function dashboard() {
  return (
    <main className="w-[90%] min-h-screen m-auto py-5">
      <section className="w-[25%]  flex flex-col items-center gap-5 justify-between">
        <UploadFiles />
        <ViewDocs />
      </section>
    </main>
  );
}
