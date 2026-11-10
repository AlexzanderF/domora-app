// PROTOTYPE (throwaway): phone navigation variants for issue #189 / map #188.
// Three variants on /prototype/phone-nav, switch with ?variant=A|B|C and ?role=client|specialist.
import { notFound } from "next/navigation";
import { PhoneNavPrototype } from "./phone-nav-prototype";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; role?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant, role } = await searchParams;
  return (
    <PhoneNavPrototype
      variant={variant === "B" || variant === "C" ? variant : "A"}
      role={role === "specialist" ? "specialist" : "client"}
    />
  );
}
