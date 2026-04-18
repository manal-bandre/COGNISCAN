import bcrypt from "bcryptjs";
import { connectDb } from "./config/db.js";
import { UserModel } from "./models/User.js";

async function main() {
  await connectDb();
  const email = "doctor@example.com";
  const password = "Doctor123!";
  const passwordHash = await bcrypt.hash(password, 10);

  await UserModel.updateOne(
    { role: "doctor", email },
    { $setOnInsert: { role: "doctor", name: "Demo Doctor", email, passwordHash } },
    { upsert: true },
  );

  console.log(`Seeded doctor login: ${email} / ${password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

