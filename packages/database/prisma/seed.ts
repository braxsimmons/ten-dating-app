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

type SeedPerson = {
  name: string;
  gender: Gender;
  interestedIn: Interest;
  city: { city: string; state: string; lat: number; lng: number };
  yob: number;
  intent: DatingIntent;
  bio: string;
  height: number;
  work: string;
  education: string | null;
  religion: string | null;
  lifestyle: string | null;
  hiddenTrait: string;
  vibe: { hair: string; setting: string; mood: string; style: string };
};

const CITIES = {
  brk: { city: "Brooklyn", state: "NY", lat: 40.6782, lng: -73.9442 },
  atx: { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  lax: { city: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437 },
  den: { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  chi: { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
};

const PEOPLE: SeedPerson[] = [
  {
    name: "Maya", gender: "woman", interestedIn: "everyone", city: CITIES.brk, yob: 1996,
    intent: "long_term", height: 168, work: "Product designer", education: "RISD",
    religion: null, lifestyle: "Mostly vegetarian, gym 4x/week, never says no to live music",
    bio: "Designer who falls hard for kerning and slow mornings. Will love-bomb your dog.",
    hiddenTrait: "I cried during the first 8 minutes of Up. Multiple times.",
    vibe: { hair: "long dark wavy hair", setting: "rooftop in Brooklyn at golden hour", mood: "warm genuine smile", style: "linen shirt and jeans" },
  },
  {
    name: "Jordan", gender: "man", interestedIn: "women", city: CITIES.brk, yob: 1993,
    intent: "long_term", height: 183, work: "Software engineer", education: "NYU",
    religion: null, lifestyle: "Runs the bridge most mornings, chef-on-weekends",
    bio: "Engineer who'd rather be a chef. I'll cook. You bring the wine and the gossip.",
    hiddenTrait: "I have a spreadsheet ranking every taco truck in Bushwick.",
    vibe: { hair: "short dark hair, light stubble", setting: "industrial kitchen window light", mood: "amused half-smile", style: "navy henley" },
  },
  {
    name: "Aisha", gender: "woman", interestedIn: "men", city: CITIES.brk, yob: 1997,
    intent: "marriage", height: 165, work: "ER nurse", education: "Johns Hopkins",
    religion: "Spiritual", lifestyle: "12-hour shifts, then yoga. Reads paperbacks in the park.",
    bio: "I keep people alive at work and feed everyone at home. Love is loud here.",
    hiddenTrait: "I name every plant. The fiddle leaf is Beatrice.",
    vibe: { hair: "natural curls", setting: "sunny park in spring", mood: "open laughing smile", style: "yellow sundress" },
  },
  {
    name: "Diego", gender: "man", interestedIn: "everyone", city: CITIES.lax, yob: 1995,
    intent: "short_term", height: 178, work: "Cinematographer", education: "USC film",
    religion: null, lifestyle: "Surf at sunrise, write at sunset, in bed by 10",
    bio: "I shoot stories for a living. Looking for someone worth a long lens.",
    hiddenTrait: "I have a crippling celebrity crush on Stanley Tucci. We get it.",
    vibe: { hair: "wavy brown hair tousled by wind", setting: "Malibu beach golden hour", mood: "calm thoughtful gaze", style: "cream sweater" },
  },
  {
    name: "Priya", gender: "woman", interestedIn: "everyone", city: CITIES.lax, yob: 1998,
    intent: "figuring_it_out", height: 162, work: "TV writer", education: "UCLA",
    religion: null, lifestyle: "Pilates, oat milk, occasional all-nighter",
    bio: "Writer's room by day, pickleball by 7. I'll absolutely make you a playlist.",
    hiddenTrait: "I've watched Pride & Prejudice (2005) 41 times. I'm counting.",
    vibe: { hair: "long straight black hair, side part", setting: "Echo Park lake background", mood: "playful smirk", style: "vintage band tee" },
  },
  {
    name: "Marcus", gender: "man", interestedIn: "women", city: CITIES.atx, yob: 1994,
    intent: "long_term", height: 188, work: "Architect", education: "UT Austin",
    religion: null, lifestyle: "Climbs, hikes, drinks too much espresso",
    bio: "I draw buildings and love a good Sunday market. Find me at the cheese stand.",
    hiddenTrait: "I keep losing chess to my niece. She's seven.",
    vibe: { hair: "short curly black hair", setting: "Austin coffee shop interior", mood: "warm direct smile", style: "denim jacket" },
  },
  {
    name: "Sloane", gender: "nonbinary", interestedIn: "everyone", city: CITIES.atx, yob: 1996,
    intent: "long_term", height: 170, work: "Community organizer", education: null,
    religion: null, lifestyle: "Dancer at heart, vegan-ish, always organizing something",
    bio: "Organizer, dancer, occasional muralist. I'll text you a thesis at 2am.",
    hiddenTrait: "I once tried to teach my landlord how to skateboard. He fell. I cried.",
    vibe: { hair: "buzzed hair, gold septum ring", setting: "warehouse studio with mural background", mood: "confident gaze", style: "oversized white tee" },
  },
  {
    name: "Riley", gender: "woman", interestedIn: "women", city: CITIES.den, yob: 1995,
    intent: "long_term", height: 172, work: "Park ranger", education: "CU Boulder",
    religion: null, lifestyle: "Outside as much as humanly possible",
    bio: "Park ranger. I'll teach you to read a topo map. Or just hand-feed marmots together.",
    hiddenTrait: "I name every summit I climb after my dog Pickles.",
    vibe: { hair: "shoulder-length blonde hair", setting: "Rocky Mountain trail with peaks behind", mood: "sun-kissed grin", style: "flannel shirt" },
  },
  {
    name: "Kai", gender: "man", interestedIn: "men", city: CITIES.den, yob: 1992,
    intent: "long_term", height: 175, work: "Pediatric dentist", education: "U Penn",
    religion: null, lifestyle: "Skis hard, reads at altitude, makes excellent ramen",
    bio: "I'm the dentist your six-year-old loves and your friends fight over at brunch.",
    hiddenTrait: "I've kept the same houseplant alive for 11 years. Her name is Janet.",
    vibe: { hair: "short black hair, glasses", setting: "snowy mountain cabin window", mood: "cozy genuine smile", style: "cable-knit sweater" },
  },
  {
    name: "Nora", gender: "woman", interestedIn: "men", city: CITIES.chi, yob: 1994,
    intent: "marriage", height: 167, work: "Chef de partie", education: null,
    religion: "Catholic-ish", lifestyle: "Restaurant hours, wine after, books between",
    bio: "I cook for a living and eat for a personality. Take me to the worst diner you know.",
    hiddenTrait: "I have a secret Yelp account where I'm a thousand-word reviewer.",
    vibe: { hair: "auburn red hair tied back, freckles", setting: "restaurant kitchen with copper pots", mood: "soft confident smile", style: "white chef's coat" },
  },
  {
    name: "Theo", gender: "man", interestedIn: "everyone", city: CITIES.chi, yob: 1991,
    intent: "long_term", height: 180, work: "Jazz pianist", education: "Berklee",
    religion: null, lifestyle: "Plays four nights a week, sleeps in, walks the lake",
    bio: "Pianist. Late nights, longer mornings. I'll write you something embarrassing.",
    hiddenTrait: "I have an irrational fear of hot air balloons. They are unholy.",
    vibe: { hair: "wavy dark hair, small earring", setting: "dim jazz club at piano", mood: "intent focused look", style: "black turtleneck" },
  },
  {
    name: "Eliza", gender: "woman", interestedIn: "everyone", city: CITIES.brk, yob: 1999,
    intent: "figuring_it_out", height: 160, work: "Grad student in neuroscience",
    education: "Columbia", religion: null,
    lifestyle: "Rock climbing, terrible coffee, the New Yorker subscription she actually reads",
    bio: "Studying brains and avoiding mine. Will out-debate you about hot dog ontology.",
    hiddenTrait: "I won my middle-school spelling bee with 'syzygy.' It haunts me.",
    vibe: { hair: "short pixie cut, strawberry blonde", setting: "indoor climbing gym chalk dust", mood: "mid-laugh", style: "tank top and chalk-dusted hands" },
  },
  {
    name: "Sam", gender: "nonbinary", interestedIn: "everyone", city: CITIES.lax, yob: 1993,
    intent: "long_term", height: 171, work: "Tattoo artist", education: null,
    religion: null, lifestyle: "Quiet at home, loud on the page, runs at midnight",
    bio: "I draw on people for a living. Big into long letters and short kisses.",
    hiddenTrait: "I learned American Sign Language for a girl in 8th grade. We were doomed but I got fluent.",
    vibe: { hair: "shaved sides with mohawk teal tips", setting: "tattoo studio neon", mood: "knowing smile", style: "black sleeveless" },
  },
  {
    name: "Henry", gender: "man", interestedIn: "women", city: CITIES.atx, yob: 1990,
    intent: "marriage", height: 185, work: "Veterinarian", education: "Texas A&M",
    religion: "Christian", lifestyle: "Cattle ranch weekends, marathon runs, three rescue dogs",
    bio: "Vet. I have three dogs and zero shame about it. They're better than most people.",
    hiddenTrait: "I sing to the dogs. Mostly Fleetwood Mac. They prefer Stevie.",
    vibe: { hair: "short sandy hair, light beard", setting: "ranch fence golden field behind", mood: "easy crinkle-eyed smile", style: "denim shirt" },
  },
  {
    name: "Lana", gender: "woman", interestedIn: "women", city: CITIES.den, yob: 1996,
    intent: "long_term", height: 169, work: "Mountain guide", education: null,
    religion: null, lifestyle: "On a mountain or about to be",
    bio: "I'll take you somewhere with no service. You'll thank me by sunset.",
    hiddenTrait: "I keep a list of every shooting star I've seen. I'm at 412.",
    vibe: { hair: "long brown braid", setting: "alpine lake with snow-capped peaks", mood: "calm peaceful smile", style: "patagonia fleece" },
  },
  {
    name: "Owen", gender: "man", interestedIn: "men", city: CITIES.chi, yob: 1995,
    intent: "long_term", height: 177, work: "High-school English teacher",
    education: "Northwestern", religion: null,
    lifestyle: "Reads four books at once, runs slowly, bakes bread badly",
    bio: "I teach kids to actually like Shakespeare. Bring snacks; I love a critic.",
    hiddenTrait: "I have a rotating Top 5 boy bands and I will defend each one.",
    vibe: { hair: "tousled brown hair, glasses", setting: "vintage bookstore aisle", mood: "soft amused look", style: "corduroy jacket" },
  },
  {
    name: "Devon", gender: "woman", interestedIn: "everyone", city: CITIES.lax, yob: 1992,
    intent: "short_term", height: 175, work: "Stunt coordinator",
    education: null, religion: null,
    lifestyle: "Lifts, jumps off things, rests like she means it",
    bio: "I get paid to fall down. Not looking to settle, just to be honestly delightful.",
    hiddenTrait: "I cry every time someone says nice things about their grandma.",
    vibe: { hair: "platinum blonde slicked-back ponytail", setting: "open desert highway", mood: "fierce half-smile", style: "leather jacket" },
  },
  {
    name: "Luca", gender: "man", interestedIn: "women", city: CITIES.brk, yob: 1996,
    intent: "long_term", height: 181, work: "Furniture maker",
    education: null, religion: null,
    lifestyle: "Sawdust, espresso, Sunday dinners with way too many people",
    bio: "I build chairs that outlive me. You can sit on one and tell me about your day.",
    hiddenTrait: "I keep all my grandfather's voicemails. Every birthday I play one.",
    vibe: { hair: "dark hair pushed back, slight stubble", setting: "woodworking shop with warm lights", mood: "shy genuine smile", style: "apron over henley" },
  },
  {
    name: "Imani", gender: "woman", interestedIn: "everyone", city: CITIES.den, yob: 1997,
    intent: "long_term", height: 173, work: "Investigative journalist",
    education: "Northwestern Medill", religion: null,
    lifestyle: "Travels light, speaks four languages, can't cook to save her life",
    bio: "Journalist. I'll ask you questions you'll think about for years. Bring takeout.",
    hiddenTrait: "I have a Polaroid of every airport I've ever cried in. There are 22.",
    vibe: { hair: "natural afro, gold hoops", setting: "city street at twilight neon reflections", mood: "thoughtful confident smile", style: "trench coat" },
  },
  {
    name: "Nico", gender: "nonbinary", interestedIn: "everyone", city: CITIES.atx, yob: 1995,
    intent: "figuring_it_out", height: 174, work: "Indie game dev",
    education: "self-taught", religion: null,
    lifestyle: "Night owl, ramen connoisseur, very into board games",
    bio: "I make weird little games. Will absolutely beat you at Catan and apologize.",
    hiddenTrait: "I have a karaoke ringtone for every friend. Yours would be a banger.",
    vibe: { hair: "shoulder-length brown hair half tied", setting: "softly lit home office with monitors", mood: "thoughtful smile", style: "oversized hoodie" },
  },
];

function pollinationsUrl(person: SeedPerson, photoIndex: number, w = 800, h = 1000): string {
  const genderWord = person.gender === "woman" ? "woman" : person.gender === "man" ? "man" : "androgynous person";
  const ageWord = `${new Date().getFullYear() - person.yob} year old`;
  const angles = ["centered portrait", "candid three-quarter view", "looking off to the side", "natural laughing moment", "soft profile shot"];
  const angle = angles[photoIndex % angles.length];

  const promptText = [
    `${ageWord} ${genderWord}`,
    angle,
    person.vibe.setting,
    person.vibe.style,
    person.vibe.hair,
    person.vibe.mood,
    "natural lighting",
    "shot on 35mm film",
    "shallow depth of field",
    "photorealistic dating app profile photo",
    "high quality",
  ].join(", ");

  const seed = stableSeed(`${person.name}-${photoIndex}`);
  const params = new URLSearchParams({
    model: "flux",
    width: String(w),
    height: String(h),
    seed: String(seed),
    nologo: "true",
    enhance: "true",
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?${params.toString()}`;
}

function stableSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
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

  for (let i = 0; i < PEOPLE.length; i++) {
    const p = PEOPLE[i];
    const dob = new Date(p.yob, (i * 3) % 12, ((i * 7) % 28) + 1);
    const email = `${p.name.toLowerCase()}${i}@ten.app`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: userPassword,
        firstName: p.name,
        dateOfBirth: dob,
        gender: p.gender,
        interestedIn: p.interestedIn,
        locationCity: p.city.city,
        locationState: p.city.state,
        latitude: p.city.lat,
        longitude: p.city.lng,
        isVerified: true,
        profile: {
          create: {
            bio: p.bio,
            datingIntent: p.intent,
            height: p.height,
            education: p.education,
            work: p.work,
            religion: p.religion,
            lifestyle: p.lifestyle,
            hiddenTrait: p.hiddenTrait,
            isComplete: true,
          },
        },
        wallet: { create: { extraSwipes: 0, rewinds: 1, doubleDowns: 0 } },
      },
    });

    const photoCount = 3 + (i % 3);
    for (let j = 0; j < photoCount; j++) {
      const url = pollinationsUrl(p, j);
      await prisma.profilePhoto.upsert({
        where: { id: `${user.id}-photo-${j}` },
        update: { url, isPrimary: j === 0, order: j },
        create: {
          id: `${user.id}-photo-${j}`,
          userId: user.id,
          url,
          storageKey: `pollinations:${p.name}-${j}`,
          order: j,
          isPrimary: j === 0,
        },
      });
    }

    const userPrompts = prompts.slice(i % 3, (i % 3) + 3);
    const sampleAnswers: Record<string, string> = {
      "A green flag about me is...": "I text my mom back. I tip well. I never go to bed mad.",
      "My ideal first date is...": "Walk somewhere with snacks. We sit. You tell me a secret.",
      "I'm weirdly good at...": "Reading people. Knowing exactly which song just changed.",
      "You should swipe right if...": "You can talk for two hours about something dumb you love.",
      "The quickest way to make me laugh is...": "An incorrect British accent. Just commit.",
      "My most controversial opinion is...": "Pineapple on pizza is fine. Cilantro is the war.",
      "Two truths and a lie...": "I've met a president, broken three bones, and lived in Tokyo.",
      "The way to my heart is...": "Show up early and ask the second question.",
      "A perfect Sunday looks like...": "Slow coffee, a long walk, something fried, an early bedtime.",
      "I'll fall for you if...": "You laugh at your own jokes a half-second too soon.",
    };
    for (const prompt of userPrompts) {
      const answer = sampleAnswers[prompt.text] ?? "Honestly, depends on the day.";
      await prisma.promptAnswer.upsert({
        where: { userId_promptId: { userId: user.id, promptId: prompt.id } },
        update: { answer },
        create: { userId: user.id, promptId: prompt.id, answer },
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

  const existingMessages = await prisma.message.count({ where: { matchId: match.id } });
  if (existingMessages === 0) {
    await prisma.message.create({
      data: { matchId: match.id, senderId: a.id, body: "Hey! Your bio made me laugh." },
    });
    await prisma.message.create({
      data: { matchId: match.id, senderId: b.id, body: "Mission accomplished. What's your ideal first date?" },
    });
  }

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
