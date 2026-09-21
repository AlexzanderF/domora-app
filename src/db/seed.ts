import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { loadEnvFiles } from "./index";
import {
  specialistProfiles,
  tariffs,
  users,
  type SpecialistProfileInsert,
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
      id: "client-demo-1",
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
      id: "spec-pending-1",
      name: "Димитър Петров",
      email: "dimitar@vik-specialist.bg",
      phone: "0888765432",
      passwordHash: defaultPasswordHash,
      role: "SPECIALIST",
      status: "PENDING",
    },
    profile: {
      id: "profile-spec-pending-1",
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
      id: "spec-active-1",
      name: "Георги Тодоров",
      email: "georgi@el-service.bg",
      phone: "0878123456",
      passwordHash: defaultPasswordHash,
      role: "SPECIALIST",
      status: "ACTIVE",
    },
    profile: {
      id: "profile-spec-active-1",
      category: "Електро",
      area: "София и област",
      experienceYears: 10,
      bio: "Лицензиран електротехник за битови инсталации и табла.",
    },
  },
  {
    user: {
      id: "admin-1",
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
    id: "tariff-0",
    category: "0",
    standardRate: 45,
    urgentRate: 68,
    holidayRate: 79,
    emergencyRate: 90,
  },
  {
    id: "tariff-1",
    category: "1",
    standardRate: 35,
    urgentRate: 53,
    holidayRate: 61,
    emergencyRate: 70,
  },
  {
    id: "tariff-2",
    category: "2",
    standardRate: 55,
    urgentRate: 83,
    holidayRate: 96,
    emergencyRate: 110,
  },
  {
    id: "tariff-3",
    category: "3",
    standardRate: 25,
    urgentRate: 38,
    holidayRate: 44,
    emergencyRate: 50,
  },
  {
    id: "tariff-4",
    category: "4",
    standardRate: 65,
    urgentRate: 98,
    holidayRate: 114,
    emergencyRate: 130,
  },
  {
    id: "tariff-5",
    category: "5",
    standardRate: 25,
    urgentRate: 38,
    holidayRate: 44,
    emergencyRate: 50,
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
            userId: item.user.id,
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

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void seedDatabase();
