import { PrismaClient, Schedule, ListingType, Gender, SmokingPolicy, PetsPolicy, PartiesPolicy, OvernightGuestsPolicy } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── USERS ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'ana@example.com',
        passwordHash,
        name: 'Ana Silva',
        dateOfBirth: new Date('1998-05-15'),
        bio: 'Estudante de design, adoro cozinhar e fazer yoga. Procuro quarto em Lisboa perto do metro.',
        city: 'Lisboa',
        role: 'SEEKER',
        gender: 'FEMALE',
        preferredCity: 'Lisboa',
        preferredCities: ['Lisboa'],
        preferredLatitude: 38.7223,
        preferredLongitude: -9.1393,
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', position: 0 },
          ],
        },
        habits: {
          create: {
            schedule: 'DAY',
            smoker: false,
            pets: false,
            cleanliness: 4,
            noise: 2,
            visitors: 3,
            budgetMin: 30000, // 300€
            budgetMax: 55000, // 550€
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'miguel@example.com',
        passwordHash,
        name: 'Miguel Costa',
        dateOfBirth: new Date('1995-11-22'),
        bio: 'Programador remoto. Tranquilo, organizado. Tenho um T2 em Arroios com quarto livre.',
        city: 'Lisboa',
        role: 'BOTH',
        gender: 'MALE',
        preferredCity: 'Lisboa',
        preferredCities: ['Lisboa'],
        preferredLatitude: 38.7223,
        preferredLongitude: -9.1393,
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', position: 0 },
          ],
        },
        habits: {
          create: {
            schedule: 'NIGHT',
            smoker: false,
            pets: false,
            cleanliness: 5,
            noise: 1,
            visitors: 2,
            budgetMin: 40000,
            budgetMax: 70000,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'sofia@example.com',
        passwordHash,
        name: 'Sofia Ferreira',
        dateOfBirth: new Date('1997-03-08'),
        bio: 'Enfermeira, horários rotativos. Gosto de animais e de manter a casa limpa.',
        city: 'Porto',
        role: 'SEEKER',
        gender: 'FEMALE',
        preferredCity: 'Porto',
        preferredCities: ['Porto'],
        preferredLatitude: 41.1579,
        preferredLongitude: -8.6291,
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', position: 0 },
          ],
        },
        habits: {
          create: {
            schedule: 'DAY',
            smoker: false,
            pets: true,
            cleanliness: 5,
            noise: 2,
            visitors: 2,
            budgetMin: 25000,
            budgetMax: 45000,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'tiago@example.com',
        passwordHash,
        name: 'Tiago Santos',
        dateOfBirth: new Date('1996-08-30'),
        bio: 'Músico e bartender. Noturno por natureza. Tenho apartamento no Bairro Alto com quartos livres.',
        city: 'Lisboa',
        role: 'LANDLORD',
        gender: 'MALE',
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', position: 0 },
          ],
        },
        habits: {
          create: {
            schedule: 'NIGHT',
            smoker: true,
            pets: false,
            cleanliness: 3,
            noise: 4,
            visitors: 5,
            budgetMin: 0,
            budgetMax: 100000,
          },
        },
        houseRules: {
          create: {
            smokingPolicy: 'OUTSIDE_ONLY',
            petsPolicy: 'NOT_ALLOWED',
            partiesPolicy: 'OCCASIONAL',
            overnightGuests: 'ALLOWED',
            quietHoursStart: '02:00',
            quietHoursEnd: '10:00',
            cleanlinessLevel: 3,
            preferredGender: 'ANY',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria@example.com',
        passwordHash,
        name: 'Maria Oliveira',
        dateOfBirth: new Date('1999-01-12'),
        bio: 'Estudante Erasmus de Barcelona. Procuro quarto para 6 meses no Porto.',
        city: 'Porto',
        role: 'SEEKER',
        gender: 'FEMALE',
        preferredCity: 'Porto',
        preferredCities: ['Porto'],
        preferredLatitude: 41.1579,
        preferredLongitude: -8.6291,
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', position: 0 },
          ],
        },
        habits: {
          create: {
            schedule: 'NIGHT',
            smoker: false,
            pets: false,
            cleanliness: 3,
            noise: 3,
            visitors: 4,
            budgetMin: 20000,
            budgetMax: 40000,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'joao@example.com',
        passwordHash,
        name: 'João Pereira',
        dateOfBirth: new Date('1993-07-19'),
        bio: 'Investidor imobiliário. Tenho vários apartamentos no Porto e Lisboa.',
        city: 'Porto',
        role: 'LANDLORD',
        gender: 'MALE',
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', position: 0 },
          ],
        },
        habits: {
          create: {
            schedule: 'DAY',
            smoker: false,
            pets: true,
            cleanliness: 4,
            noise: 2,
            visitors: 3,
            budgetMin: 0,
            budgetMax: 200000,
          },
        },
        houseRules: {
          create: {
            smokingPolicy: 'NOT_ALLOWED',
            petsPolicy: 'SMALL_ONLY',
            partiesPolicy: 'NOT_ALLOWED',
            overnightGuests: 'WITH_NOTICE',
            quietHoursStart: '23:00',
            quietHoursEnd: '08:00',
            cleanlinessLevel: 4,
            preferredGender: 'ANY',
          },
        },
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // ─── LISTINGS ─────────────────────────────────────────

  const listings = await Promise.all([
    // Miguel's listing in Arroios, Lisboa
    prisma.listing.create({
      data: {
        ownerId: users[1].id, // Miguel
        title: 'Quarto luminoso em T2 em Arroios',
        description: 'Quarto com janela grande, muita luz natural. Apartamento renovado com cozinha equipada. A 5 min do metro Arroios. Wi-Fi incluído.',
        type: 'ROOM',
        pricePerMonth: 45000, // 450€
        latitude: 38.7267,
        longitude: -9.1355,
        address: 'Rua Angelina Vidal 42, Arroios',
        city: 'Lisboa',
        bedrooms: 2,
        bathrooms: 1,
        furnished: true,
        billsIncluded: true,
        availableFrom: new Date('2026-04-01'),
        smokersAllowed: false,
        petsAllowed: false,
        preferredGender: null,
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', position: 0 },
            { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', position: 1 },
          ],
        },
      },
    }),
    // Tiago's listing in Bairro Alto, Lisboa
    prisma.listing.create({
      data: {
        ownerId: users[3].id, // Tiago
        title: 'Quarto no coração do Bairro Alto',
        description: 'Vive no centro da vida noturna de Lisboa! Apartamento com carácter, tetos altos. Quarto com varanda. Perfeito para quem gosta de sair.',
        type: 'ROOM',
        pricePerMonth: 55000, // 550€
        latitude: 38.7139,
        longitude: -9.1456,
        address: 'Rua da Rosa 88, Bairro Alto',
        city: 'Lisboa',
        bedrooms: 3,
        bathrooms: 1,
        furnished: true,
        billsIncluded: false,
        availableFrom: new Date('2026-03-20'),
        smokersAllowed: true,
        petsAllowed: false,
        preferredGender: null,
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', position: 0 },
            { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600', position: 1 },
          ],
        },
      },
    }),
    // João's listing in Porto - Apartment
    prisma.listing.create({
      data: {
        ownerId: users[5].id, // João
        title: 'T1 mobilado em Cedofeita',
        description: 'Apartamento T1 totalmente mobilado e equipado. Prédio com elevador, a 10 min a pé da Trindade. Ideal para estudantes ou jovens profissionais.',
        type: 'APARTMENT',
        pricePerMonth: 65000, // 650€
        latitude: 41.1530,
        longitude: -8.6190,
        address: 'Rua de Cedofeita 234, Porto',
        city: 'Porto',
        bedrooms: 1,
        bathrooms: 1,
        furnished: true,
        billsIncluded: false,
        availableFrom: new Date('2026-04-15'),
        smokersAllowed: false,
        petsAllowed: true,
        preferredGender: null,
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600', position: 0 },
            { url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600', position: 1 },
          ],
        },
      },
    }),
    // João's second listing - Room in Porto
    prisma.listing.create({
      data: {
        ownerId: users[5].id, // João
        title: 'Quarto em coliving no centro do Porto',
        description: 'Espaço de coliving com 4 quartos, sala comum, cozinha partilhada. Ambiente jovem e internacional. Limpeza semanal incluída.',
        type: 'COLIVING',
        pricePerMonth: 35000, // 350€
        latitude: 41.1496,
        longitude: -8.6110,
        address: 'Rua de Santa Catarina 150, Porto',
        city: 'Porto',
        bedrooms: 4,
        bathrooms: 2,
        furnished: true,
        billsIncluded: true,
        availableFrom: new Date('2026-03-25'),
        smokersAllowed: false,
        petsAllowed: false,
        preferredGender: null,
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600', position: 0 },
            { url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600', position: 1 },
            { url: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600', position: 2 },
          ],
        },
      },
    }),
    // Tiago's second listing - Apartment in Lisboa
    prisma.listing.create({
      data: {
        ownerId: users[3].id, // Tiago
        title: 'T2 com vista rio em Santos',
        description: 'Apartamento T2 com vista para o Tejo. Sala ampla, cozinha americana. Próximo da LX Factory e do Cais do Sodré.',
        type: 'APARTMENT',
        pricePerMonth: 95000, // 950€
        latitude: 38.7066,
        longitude: -9.1580,
        address: 'Rua de Santos-o-Velho 12, Santos',
        city: 'Lisboa',
        bedrooms: 2,
        bathrooms: 1,
        furnished: false,
        billsIncluded: false,
        availableFrom: new Date('2026-05-01'),
        smokersAllowed: true,
        petsAllowed: true,
        preferredGender: null,
        photos: {
          create: [
            { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', position: 0 },
          ],
        },
      },
    }),
  ]);

  console.log(`Created ${listings.length} listings`);

  // ─── FAVORITES ────────────────────────────────────────

  await Promise.all([
    prisma.favorite.create({
      data: { userId: users[0].id, listingId: listings[0].id }, // Ana saves Miguel's room
    }),
    prisma.favorite.create({
      data: { userId: users[0].id, listingId: listings[1].id }, // Ana saves Tiago's room
    }),
    prisma.favorite.create({
      data: { userId: users[4].id, listingId: listings[3].id }, // Maria saves João's coliving
    }),
  ]);

  console.log('Created 3 favorites');

  // ─── INTERESTS ────────────────────────────────────────

  const interest1 = await prisma.interest.create({
    data: {
      userId: users[0].id,  // Ana
      listingId: listings[0].id, // Miguel's room
      message: 'Olá Miguel! Estou muito interessada no quarto. Sou estudante de design, organizada e tranquila. Posso agendar uma visita?',
      status: 'ACCEPTED',
    },
  });

  const interest2 = await prisma.interest.create({
    data: {
      userId: users[4].id,  // Maria
      listingId: listings[3].id, // João's coliving
      message: 'Hola! Soy Maria, estudiante Erasmus de Barcelona. Me encantaría vivir en el coliving. ¿Podemos hablar?',
      status: 'ACCEPTED',
    },
  });

  await prisma.interest.create({
    data: {
      userId: users[2].id,  // Sofia
      listingId: listings[2].id, // João's apartment
      message: 'Boa tarde, sou enfermeira e procuro T1 no Porto. O apartamento aceita animais?',
      status: 'PENDING',
    },
  });

  console.log('Created 3 interests');

  // ─── CONVERSATIONS ───────────────────────────────────

  const conv1 = await prisma.conversation.create({
    data: {
      interestId: interest1.id,
      members: {
        create: [
          { userId: users[0].id }, // Ana
          { userId: users[1].id }, // Miguel
        ],
      },
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      interestId: interest2.id,
      members: {
        create: [
          { userId: users[4].id }, // Maria
          { userId: users[5].id }, // João
        ],
      },
    },
  });

  // ─── MESSAGES ─────────────────────────────────────────

  const now = new Date();
  await Promise.all([
    // Conv 1: Ana & Miguel
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: users[1].id, // Miguel
        content: 'Olá Ana! Claro, podemos marcar uma visita. Quando te dá jeito?',
        read: true,
        createdAt: new Date(now.getTime() - 86400000), // 1 day ago
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: users[0].id, // Ana
        content: 'Sábado de manhã seria perfeito! Às 10h?',
        read: true,
        createdAt: new Date(now.getTime() - 82800000),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: users[1].id, // Miguel
        content: 'Feito! Sábado às 10h. Mando-te a morada exata por aqui.',
        read: false,
        createdAt: new Date(now.getTime() - 79200000),
      },
    }),

    // Conv 2: Maria & João
    prisma.message.create({
      data: {
        conversationId: conv2.id,
        senderId: users[5].id, // João
        content: 'Olá Maria! Bem-vinda ao Porto! O coliving tem ambiente muito internacional, vais adorar.',
        read: true,
        createdAt: new Date(now.getTime() - 172800000), // 2 days ago
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv2.id,
        senderId: users[4].id, // Maria
        content: 'Que bom! Tenho uma pergunta: a limpeza semanal inclui o quarto ou só as áreas comuns?',
        read: true,
        createdAt: new Date(now.getTime() - 169200000),
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conv2.id,
        senderId: users[5].id, // João
        content: 'Inclui tudo! Quarto, casa de banho e áreas comuns. O preço também inclui Wi-Fi e todas as contas.',
        read: false,
        createdAt: new Date(now.getTime() - 165600000),
      },
    }),
  ]);

  console.log('Created 2 conversations with 6 messages');

  // ─── NOTIFICATIONS ───────────────────────────────────

  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[1].id, // Miguel
        type: 'NEW_INTEREST',
        title: 'Novo interesse no teu anúncio',
        body: 'Ana Silva está interessada no quarto em Arroios.',
        data: { listingId: listings[0].id, interestId: interest1.id },
        read: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[0].id, // Ana
        type: 'INTEREST_ACCEPTED',
        title: 'Interesse aceite!',
        body: 'Miguel aceitou o teu pedido. Podem agora conversar!',
        data: { listingId: listings[0].id, conversationId: conv1.id },
        read: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[5].id, // João
        type: 'NEW_INTEREST',
        title: 'Novo interesse no teu anúncio',
        body: 'Sofia Ferreira está interessada no T1 em Cedofeita.',
        data: { listingId: listings[2].id },
        read: false,
      },
    }),
  ]);

  console.log('Created 3 notifications');
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
