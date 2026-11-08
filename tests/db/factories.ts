import { requireDb, requests, users } from "@/db";
import type { RequestInsert } from "@/db";
import type { Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/features/auth/types";

let counter = 0;

// Inserts a user and returns it as an Actor, so tests can act as a real row.
export async function createActor(
  role: UserRole,
  status: UserStatus = UserStatus.Active,
): Promise<Actor> {
  counter += 1;
  const [row] = await requireDb()
    .insert(users)
    .values({
      name: `Test ${role} ${counter}`,
      email: `user${counter}@example.com`,
      phone: "0888000000",
      passwordHash: "x",
      role,
      status,
    })
    .returning({ id: users.id });
  return { id: row.id, role, status };
}

export async function insertRequest(
  values: Pick<RequestInsert, "clientId"> & Partial<RequestInsert>,
): Promise<number> {
  const [row] = await requireDb()
    .insert(requests)
    .values({
      title: "Смяна на кран",
      description: "Тече кранът в кухнята",
      category: "0",
      address: "София, ул. Тест 1",
      price: 45,
      clientPhone: "0888000000",
      ...values,
    })
    .returning({ id: requests.id });
  return row.id;
}
