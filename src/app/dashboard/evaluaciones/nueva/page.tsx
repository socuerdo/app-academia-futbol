import { redirect } from "next/navigation";
export default function Page() {
  redirect("/dashboard/evaluaciones?tab=nueva");
}
