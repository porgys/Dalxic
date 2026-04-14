import { redirect } from "next/navigation";

export default function InjectionRoomRedirect() {
  redirect("/nurse-station?tab=injections");
}
