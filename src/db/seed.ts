import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { loadEnvFiles } from "./index";
import {
  specialistProfiles,
  subscriptions,
  tariffs,
  users,
  type SpecialistProfileInsert,
  type SubscriptionInsert,
  type TariffInsert,
  type UserInsert,
} from "./schema";

loadEnvFiles();

const { Pool } = pg;

const defaultPasswordHash = bcrypt.hashSync("password", 10);

const seedUsers: {
  user: UserInsert;
  profile?: Omit<SpecialistProfileInsert, "userId">;
}[] = [
  {
    user: {
      id: 1,
      name: "Иван Иванов",
      email: "client@domora.bg",
      phone: "0888123456",
      passwordHash: defaultPasswordHash,
      role: "CLIENT",
      status: "ACTIVE",
    },
  },
  {
    user: {
      id: 2,
      name: "Димитър Петров",
      email: "dimitar@vik-specialist.bg",
      phone: "0888765432",
      passwordHash: defaultPasswordHash,
      role: "SPECIALIST",
      status: "PENDING",
    },
    profile: {
      id: 1,
      category: "ВиК",
      area: "София",
      experienceYears: 7,
      bio: "ВиК майстор с дългогодишен опит в аварийни и планови ремонти.",
      companyName: "ВиК Мастер ЕООД",
      eik: "204567891",
    },
  },
  {
    user: {
      id: 3,
      name: "Георги Тодоров",
      email: "georgi@el-service.bg",
      phone: "0878123456",
      passwordHash: defaultPasswordHash,
      role: "SPECIALIST",
      status: "ACTIVE",
    },
    profile: {
      id: 2,
      category: "Електро",
      area: "София и област",
      experienceYears: 10,
      bio: "Лицензиран електротехник за битови инсталации и табла.",
    },
  },
  {
    user: {
      id: 4,
      name: "Администратор",
      email: "admin@domora.bg",
      phone: "0899000111",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  },
];

const seedTariffs: TariffInsert[] = [
  {
    id: 1,
    category: "0",
    standardRate: 45,
    urgentRate: 68,
    holidayRate: 79,
    emergencyRate: 90,
  },
  {
    id: 2,
    category: "1",
    standardRate: 35,
    urgentRate: 53,
    holidayRate: 61,
    emergencyRate: 70,
  },
  {
    id: 3,
    category: "2",
    standardRate: 55,
    urgentRate: 83,
    holidayRate: 96,
    emergencyRate: 110,
  },
  {
    id: 4,
    category: "3",
    standardRate: 25,
    urgentRate: 38,
    holidayRate: 44,
    emergencyRate: 50,
  },
  {
    id: 5,
    category: "4",
    standardRate: 65,
    urgentRate: 98,
    holidayRate: 114,
    emergencyRate: 130,
  },
  {
    id: 6,
    category: "5",
    standardRate: 25,
    urgentRate: 38,
    holidayRate: 44,
    emergencyRate: 50,
  },
];

const seedSubscriptions: SubscriptionInsert[] = [
  {
    id: 1,
    userId: 1,
    planType: "HOME",
    propertyAddress: "София, ул. Примерна 12, ап. 5",
    propertyArea: 85,
    status: "ACTIVE",
    visitsRemaining: 3,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
];

async function seedDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "DATABASE_URL environment variable is required to seed the database.",
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
  });

  const db = drizzle(pool);

  console.log("Seeding baseline users and specialist profiles...");
  try {
    for (const item of seedUsers) {
      await db
        .insert(users)
        .values(item.user)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: item.user.name,
            email: item.user.email,
            phone: item.user.phone,
            passwordHash: item.user.passwordHash,
            role: item.user.role,
            status: item.user.status,
            updatedAt: new Date(),
          },
        });

      if (item.profile) {
        await db
          .insert(specialistProfiles)
          .values({
            ...item.profile,
            userId: item.user.id!,
          })
          .onConflictDoUpdate({
            target: specialistProfiles.userId,
            set: {
              category: item.profile.category,
              area: item.profile.area,
              experienceYears: item.profile.experienceYears,
              bio: item.profile.bio,
              companyName: item.profile.companyName ?? null,
              eik: item.profile.eik ?? null,
              updatedAt: new Date(),
            },
          });
      }
    }

    console.log("Seeding baseline tariffs...");
    for (const tariff of seedTariffs) {
      await db
        .insert(tariffs)
        .values(tariff)
        .onConflictDoUpdate({
          target: tariffs.category,
          set: {
            standardRate: tariff.standardRate,
            urgentRate: tariff.urgentRate,
            holidayRate: tariff.holidayRate,
            emergencyRate: tariff.emergencyRate,
            updatedAt: new Date(),
          },
        });
    }

    console.log("Seeding baseline subscriptions...");
    for (const sub of seedSubscriptions) {
      await db
        .insert(subscriptions)
        .values(sub)
        .onConflictDoUpdate({
          target: subscriptions.id,
          set: {
            planType: sub.planType,
            propertyAddress: sub.propertyAddress,
            propertyArea: sub.propertyArea,
            status: sub.status,
            visitsRemaining: sub.visitsRemaining,
            validUntil: sub.validUntil,
            updatedAt: new Date(),
          },
        });
    }

    console.log("Synchronizing sequence counters...");
    await db.execute(sql`
      SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);
      SELECT setval(pg_get_serial_sequence('specialist_profiles', 'id'), COALESCE((SELECT MAX(id) FROM specialist_profiles), 0) + 1, false);
      SELECT setval(pg_get_serial_sequence('tariffs', 'id'), COALESCE((SELECT MAX(id) FROM tariffs), 0) + 1, false);
      SELECT setval(pg_get_serial_sequence('subscriptions', 'id'), COALESCE((SELECT MAX(id) FROM subscriptions), 0) + 1, false);
      SELECT setval(pg_get_serial_sequence('requests', 'id'), COALESCE((SELECT MAX(id) FROM requests), 0) + 1, false);
      SELECT setval(pg_get_serial_sequence('sessions', 'id'), COALESCE((SELECT MAX(id) FROM sessions), 0) + 1, false);
    `);

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void seedDatabase();
