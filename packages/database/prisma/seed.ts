import { PrismaClient, Gender, Interest, DatingIntent, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PROMPTS = [
  "A green flag about me is...",
  "My ideal first date is...",
  "I'm weirdly good at...",
  "You should swipe right if...",
  "The quickest way to make me laugh is...",
  "My most controversial opinion is...",
  "Two truths and a lie...",
  "The way to my heart is...",
  "A perfect Sunday looks like...",
  "I'll fall for you if...",
];

const FIRST_NAMES = [
  "Ava", "Liam", "Olivia", "Noah", "Emma", "Ethan", "Sophia", "Mason",
  "Isabella", "Lucas", "Mia", "Logan", "Charlotte", "Aiden", "Amelia",
  "James", "Harper", "Benjamin", "Evelyn", "Henry",
];

const CITIES = [
  { city: "Brooklyn", state: "NY", lat: 40.6782, lng: -73.9442 },
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  { city: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437 },
  { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
];

const BIOS = [
  "Coffee snob, hiking enthusiast, terrible at karaoke.",
  "Reading way too many books and pretending I have a five-year plan.",
  "Looking for someone to share spicy food and bad opinions with.",
  "Engineer by day, indecisive about brunch by weekend.",
  "If you can name three of my favorite albums, we're already engaged.",
  "Plant parent. Dog aunt. Disastrously honest.",
  "I'll probably make you laugh and then immediately regret the joke.",
  "Sucker for handwritten notes and absurdly specific playlists.",
];

const INTENTS: DatingIntent[] = ["long_term", "short_term", "figuring_it_out", "friends", "marriage"];

function placeholderPhoto(seed: string): string {

  return `https://i.pravatar.cc/600?u=${encodeURIComponent(seed)}`;
}

async function main() {
  console.log("Seeding...");


  const adminPassword = await bcrypt.hash("admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ten.app" },
    update: { role: Role.admin },
    create: {
      email: "admin@ten.app",
      passwordHash: adminPassword,
      firstName: "Admin",
      dateOfBirth: new Date("1990-01-01"),
      gender: Gender.other,
      interestedIn: Interest.everyone,
      role: Role.admin,
      isVerified: true,
      locationCity: "Brooklyn",
      locationState: "NY",
    },
  });
  console.log(`Admin: ${admin.email} / admin1234`);


  const prompts = await Promise.all(
    SEED_PROMPTS.map((text) =>
      prisma.prompt.upsert({
        where: { text },
        update: { isActive: true },
        create: { text },
      }),
    ),
  );
  console.log(`Prompts: ${prompts.length}`);


  await prisma.featureFlag.upsert({
    where: { key: "delayed_match_reveal" },
    update: {},
    create: { key: "delayed_match_reveal", value: false, description: "Reveal matches at 8pm instead of immediately" },
  });
  await prisma.featureFlag.upsert({
    where: { key: "streaks" },
    update: {},
    create: { key: "streaks", value: false, description: "Daily streak rewards" },
  });
  await prisma.appConfig.upsert({
    where: { key: "daily_free_swipe_limit" },
    update: {},
    create: { key: "daily_free_swipe_limit", value: "10" },
  });


  const userPassword = await bcrypt.hash("password123", 10);
  const sampleUsers = [];

  for (let i = 0; i < 20; i++) {
    const name = FIRST_NAMES[i % FIRST_NAMES.length];
    const city = CITIES[i % CITIES.length];
    const gender = i % 3 === 0 ? Gender.man : i % 3 === 1 ? Gender.woman : Gender.nonbinary;
    const interestedIn = i % 2 === 0 ? Interest.everyone : Interest.women;
    const dob = new Date(1995 + (i % 8), (i * 3) % 12, ((i * 7) % 28) + 1);

    const email = `${name.toLowerCase()}${i}@ten.app`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: userPassword,
        firstName: name,
        dateOfBirth: dob,
        gender,
        interestedIn,
        locationCity: city.city,
        locationState: city.state,
        latitude: city.lat,
        longitude: city.lng,
        isVerified: true,
        profile: {
          create: {
            bio: BIOS[i % BIOS.length],
            datingIntent: INTENTS[i % INTENTS.length],
            height: 160 + (i % 30),
            education: i % 2 === 0 ? "State U" : "Self-taught",
            work: ["Designer", "Teacher", "Engineer", "Writer", "Nurse"][i % 5],
            religion: i % 3 === 0 ? "Spiritual" : null,
            lifestyle: i % 2 === 0 ? "Active, mostly-vegetarian, occasional drinker" : null,
            hiddenTrait: "I once cried during a Pixar short.",
            isComplete: true,
          },
        },
        wallet: { create: { extraSwipes: 0, rewinds: 1, doubleDowns: 0 } },
      },
    });


    const photoCount = 2 + (i % 4);
    for (let p = 0; p < photoCount; p++) {
      const url = placeholderPhoto(`${user.id}-${p}`);
      await prisma.profilePhoto.upsert({
        where: { id: `${user.id}-photo-${p}` },
        update: {},
        create: {
          id: `${user.id}-photo-${p}`,
          userId: user.id,
          url,
          storageKey: `seed/${user.id}/${p}`,
          order: p,
          isPrimary: p === 0,
        },
      });
    }


    const userPrompts = prompts.slice(i % 3, (i % 3) + 3);
    for (const prompt of userPrompts) {
      await prisma.promptAnswer.upsert({
        where: { userId_promptId: { userId: user.id, promptId: prompt.id } },
        update: {},
        create: {
          userId: user.id,
          promptId: prompt.id,
          answer: `(${name}) ${prompt.text.replace("...", "")} something honest and slightly self-deprecating.`,
        },
      });
    }

    sampleUsers.push(user);
  }
  console.log(`Sample users: ${sampleUsers.length}`);


  const a = sampleUsers[0];
  const b = sampleUsers[1];
  await prisma.swipeAction.upsert({
    where: { swiperId_targetUserId: { swiperId: a.id, targetUserId: b.id } },
    update: {},
    create: { swiperId: a.id, targetUserId: b.id, action: "like" },
  });
  await prisma.swipeAction.upsert({
    where: { swiperId_targetUserId: { swiperId: b.id, targetUserId: a.id } },
    update: {},
    create: { swiperId: b.id, targetUserId: a.id, action: "like" },
  });
  const userAId = a.id < b.id ? a.id : b.id;
  const userBId = a.id < b.id ? b.id : a.id;
  const match = await prisma.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });
  await prisma.message.create({
    data: { matchId: match.id, senderId: a.id, body: "Hey! Your bio made me laugh." },
  });
  await prisma.message.create({
    data: { matchId: match.id, senderId: b.id, body: "Mission accomplished. What's your ideal first date?" },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
