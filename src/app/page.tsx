import { redirect } from "next/navigation";

/** The workspace starts on the task list (the login guard handles sign-in). */
export default function Home() {
  redirect("/tasks");
}
