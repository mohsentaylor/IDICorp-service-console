import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto my-[12vh] max-w-[700px] p-[30px]">
      <h1>Page not found</h1>
      <Link className="underline" href="/tasks">
        Back to the workspace
      </Link>
    </main>
  );
}
