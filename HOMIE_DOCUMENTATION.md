# Homie — Housing Platform

## About

Homie is a housing platform that combines **coliving/roommate matching** with **property listings** and **in-app rent payments**. Unlike traditional platforms (OLX, Idealista, Facebook groups), Homie focuses on compatibility between people and provides financial transparency through integrated payments with digital receipts.

---

## Vision

Solving the housing crisis for young people — students, remote workers, expats — by making it easy to find the right place **and** the right people to live with.

---

## Business Model

### Revenue Streams

| Stream | Description | When |
|--------|-------------|------|
| **Rent payments (2% commission)** | Every rent paid through the app generates 2% for Homie. Recurring, predictable revenue. | MVP |
| **Freemium subscriptions** | Free tier with limits → paid tiers with premium features | Post-launch |
| **Listing boosts** | Landlords pay to feature their listings at the top | Post-launch |
| **Contextual ads** | Moving companies, insurance, furniture, internet providers | Growth phase |
| **Service marketplace** | Commission on cleaning, moving, contract services | Future |

### Subscription Tiers (Post-MVP)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | €0 | 1 listing, basic filters, limited messages/day |
| **Homie Plus** | ~€5-10/month | Unlimited messages, advanced filters, see who viewed your profile, verified badge |
| **Homie Pro** (landlords) | ~€15-20/month | Multiple listings, analytics (views, clicks), priority placement, tenant management tools |

### Why It Works

- **Real problem**: Housing crisis globally, especially for young people
- **Weak competition**: Idealista/OLX don't do personality matching. Facebook groups are chaotic
- **Daily retention**: People looking for housing check every day until they find one
- **Viral loop**: "I need a roommate" → share the app with friends
- **Multiple revenue streams**: Subs + payments + boosts + ads + services
- **Expandable market**: Start anywhere → go national → go international

### Launch Strategy

1. **Open launch** — no geographic restrictions, users set their location
2. **Focus marketing on university students** — start of academic year = peak demand
3. **Free for everyone initially** — grow the user base
4. **Monetize with traction** — introduce subs and boosts once there's critical mass

---

## Key Features

### 1. Property Listings
- Landlords/tenants post rooms, apartments, or coliving spaces
- Rich details: photos (up to 10), price, location, bedrooms, bathrooms, furnished, bills included
- House rules: smokers, pets, gender preference
- Feed with filters: city, price range, type, radius, furnished, etc.
- Map view with pins for each listing
- Status management: active, paused, rented, expired (auto-expires after 90 days)

### 2. Compatibility Matching
- Both seekers and landlords fill out a **habits questionnaire**:
  - Schedule: day person vs night person
  - Smoker: yes/no
  - Pets: yes/no
  - Cleanliness: 1-5 scale
  - Noise tolerance: 1-5 scale
  - Visitors frequency: 1-5 scale
  - Budget range: min/max monthly
- Every listing shows a **compatibility percentage** (0-100%) between the seeker and the listing owner
- Score is calculated on-the-fly based on 6 weighted metrics:

| Metric | Weight | Logic |
|--------|--------|-------|
| Schedule match | 25% | Same schedule = full score |
| Smoker match | 20% | Listing rules + personal preference |
| Pets match | 15% | Listing rules + personal preference |
| Cleanliness | 15% | Closer values = higher score |
| Noise tolerance | 10% | Closer values = higher score |
| Budget fit | 15% | Price within seeker's range = full score |

### 3. Interest System
- Seekers send an **interest request** on a listing (with optional intro message)
- Landlord sees received interests and can **accept** or **reject**
- Accepting creates a private **conversation** between the two
- Prevents spam — you can't message without mutual interest

### 4. Real-time Chat
- Powered by **Socket.io** for instant messaging
- Typing indicators (user is typing...)
- Read receipts (messages marked as read)
- Cursor-based pagination for message history
- Only available after interest is accepted

### 5. In-App Rent Payments
- Powered by **Stripe Connect** (marketplace model)
- Landlord onboards as a Stripe Express connected account
- Tenant pays rent through the app monthly
- **Homie takes 2% commission** on every payment
- Both parties receive **digital receipts** (proof of payment)
- Full payment history accessible anytime
- Automatic rent reminders (3 days before due date)
- Overdue payment detection and notifications

### 6. Favorites
- Save listings to review later
- Quick access to saved listings with key info

### 7. Notifications
- New interest on your listing
- Interest accepted (chat unlocked)
- New message
- Rent due / overdue
- Payment received / confirmed
- Real-time via Socket.io + persistent in-app notifications

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | Node.js + Express 5 (TypeScript) |
| **Database** | PostgreSQL |
| **ORM** | Prisma 6 |
| **Real-time** | Socket.io |
| **Auth** | JWT (access + refresh tokens) + bcrypt |
| **Validation** | Zod |
| **Payments** | Stripe Connect (Express accounts) |
| **Cron Jobs** | node-cron |
| **Frontend** | React Native + Expo SDK 55 (TypeScript) |
| **Navigation** | Expo Router (file-based) |
| **State** | Zustand |
| **API Client** | Axios with JWT interceptors + auto refresh |
| **Hosting** | Render (backend + DB) |

---

## Project Structure

```
Homie/
├── homie-api/                          # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── index.ts                    # Server entry point
│   │   ├── app.ts                      # Express app + routes
│   │   ├── socket.ts                   # Socket.io setup + events
│   │   ├── config/
│   │   │   ├── database.ts             # Prisma client singleton
│   │   │   ├── env.ts                  # Zod env validation
│   │   │   └── stripe.ts              # Stripe client
│   │   ├── modules/
│   │   │   ├── auth/                   # Signup, login, JWT refresh, logout
│   │   │   ├── user/                   # Profile CRUD, photos, habits
│   │   │   ├── listing/               # Listings CRUD, feed, map, filters
│   │   │   ├── compatibility/         # Score calculation engine
│   │   │   ├── interest/              # Like system, accept/reject
│   │   │   ├── chat/                  # Messages, read receipts
│   │   │   ├── favorite/             # Save/unsave listings
│   │   │   ├── notification/         # In-app notifications
│   │   │   └── payment/              # Stripe Connect, tenancies, rent
│   │   ├── shared/
│   │   │   ├── middleware/            # Error handler, validation, auth
│   │   │   ├── types/                # Shared TypeScript interfaces
│   │   │   └── utils/                # Geo (Haversine), scoring algorithm
│   │   └── jobs/
│   │       ├── scheduler.ts           # Cron job orchestrator
│   │       ├── rentReminder.job.ts    # Monthly rent reminders
│   │       ├── overdueRent.job.ts     # Flag overdue payments
│   │       └── listingExpiry.job.ts   # Expire 90-day listings
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema (12 models)
│   │   ├── migrations/                # SQL migration files
│   │   └── seed.ts                    # Seed data (6 users, 5 listings)
│   ├── test-api.js                    # Quick API test script
│   ├── docker-compose.yml             # PostgreSQL
│   ├── render.yaml                    # Render deployment config
│   └── .env.example                   # Environment variables template
│
├── homie-mobile/                       # Frontend (React Native + Expo SDK 55)
│   ├── app/
│   │   ├── _layout.tsx                 # Root layout (auth check)
│   │   ├── index.tsx                   # Entry redirect
│   │   ├── auth/
│   │   │   ├── login.tsx               # Login screen
│   │   │   ├── signup.tsx              # Registration screen
│   │   │   └── onboarding.tsx          # 4-step habits questionnaire
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx             # Tab navigator (5 tabs)
│   │   │   ├── explore.tsx             # Listing feed + filters + compatibility %
│   │   │   ├── map.tsx                 # Map view with listing pins
│   │   │   ├── favorites.tsx           # Saved listings
│   │   │   ├── messages.tsx            # Conversation list
│   │   │   ├── profile.tsx             # User profile + settings
│   │   │   └── chat/
│   │   │       └── [id].tsx            # Real-time chat screen
│   │   └── listing/
│   │       └── [id].tsx                # Listing detail + send interest
│   ├── services/
│   │   ├── api.ts                      # Axios instance + JWT interceptors
│   │   ├── auth.service.ts             # Auth API calls
│   │   ├── user.service.ts             # User/profile API calls
│   │   ├── listing.service.ts          # Listings API calls
│   │   ├── interest.service.ts         # Interest API calls
│   │   ├── chat.service.ts             # Chat API calls
│   │   ├── favorite.service.ts         # Favorites API calls
│   │   ├── notification.service.ts     # Notification API calls
│   │   └── socket.ts                   # Socket.io client singleton
│   ├── store/
│   │   ├── authStore.ts                # Auth state (Zustand)
│   │   ├── listingStore.ts             # Listings + favorites state
│   │   └── chatStore.ts                # Chat + conversations state
│   ├── types/
│   │   └── index.ts                    # All TypeScript interfaces
│   ├── utils/
│   │   └── constants.ts                # Colors, API URL
│   └── app.json                        # Expo configuration
│
└── HOMIE_DOCUMENTATION.md              # This file
```

---

## Database Schema

### 12 Models

| Model | Description |
|-------|-------------|
| `User` | Accounts, preferences, role (SEEKER/LANDLORD/BOTH), Stripe IDs |
| `UserPhoto` | Profile photos (max 6, ordered by position) |
| `Habits` | Questionnaire: schedule, smoker, pets, cleanliness, noise, visitors, budget |
| `Listing` | Property ads: photos, location, price, type, rules, status |
| `ListingPhoto` | Listing photos (max 10, ordered by position) |
| `Interest` | Like/request on a listing (PENDING/ACCEPTED/REJECTED) |
| `Conversation` | Chat between interested user and listing owner |
| `ConversationMember` | Many-to-many: users ↔ conversations |
| `Message` | Chat messages with read status |
| `Favorite` | Saved listings |
| `Notification` | Push notification records |
| `Tenancy` | Rental agreement (tenant + landlord + listing + rent amount) |
| `Payment` | Rent payments with Stripe references, commission, receipts |

### Key Relationships

```
User 1──N UserPhoto
User 1──1 Habits
User 1──N Listing (as owner)
User 1──N Interest (as sender)
User N──N Conversation (via ConversationMember)
User 1──N Message
User 1──N Favorite
User 1──N Notification
User 1──N Tenancy (as tenant)
User 1──N Tenancy (as landlord)
User 1──N Payment (as tenant)
User 1──N Payment (as landlord)

Listing 1──N ListingPhoto
Listing 1──N Interest
Listing 1──N Favorite
Listing 1──N Tenancy

Interest 1──1 Conversation
Conversation 1──N Message
Conversation 1──N ConversationMember

Tenancy 1──N Payment
```

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Register (email, password, name, dateOfBirth, city) |
| POST | `/login` | Login, returns JWT tokens |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Invalidate refresh token |

### Users (`/api/users`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Get own profile + photos + habits |
| PUT | `/me` | Update profile (name, bio, city, role) |
| PUT | `/me/habits` | Create/update habits questionnaire |
| POST | `/me/photos` | Add photo (max 6) |
| DELETE | `/me/photos/:photoId` | Remove photo |
| GET | `/:id` | View another user's public profile |

### Listings (`/api/listings`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create listing |
| GET | `/` | Feed with filters + compatibility % |
| GET | `/map` | Listings within bounding box |
| GET | `/mine` | My listings (as owner) |
| GET | `/:id` | Listing detail + compatibility |
| PUT | `/:id` | Update listing |
| DELETE | `/:id` | Delete listing |
| PATCH | `/:id/status` | Change status (ACTIVE/PAUSED/RENTED) |
| POST | `/:id/photos` | Add listing photo |
| DELETE | `/:id/photos/:photoId` | Remove listing photo |

**Feed query parameters:**
```
?page=1&limit=20&city=Lisboa&type=ROOM,APARTMENT
&minPrice=30000&maxPrice=80000&furnished=true
&lat=38.72&lng=-9.14&radius=10
&sortBy=price|compatibility|date|distance
```

### Interests (`/api/interests`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Send interest { listingId, message? } |
| GET | `/sent` | My sent interests |
| GET | `/received` | Interests on my listings |
| PATCH | `/:id/accept` | Accept (creates conversation) |
| PATCH | `/:id/reject` | Reject |

### Chat (`/api/chat`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id/messages` | Messages (paginated) |
| POST | `/conversations/:id/messages` | Send message |
| PATCH | `/conversations/:id/read` | Mark as read |

### Favorites (`/api/favorites`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Add favorite { listingId } |
| DELETE | `/:listingId` | Remove favorite |
| GET | `/` | List favorites |

### Notifications (`/api/notifications`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications (paginated) |
| PATCH | `/:id/read` | Mark as read |
| PATCH | `/read-all` | Mark all as read |
| GET | `/unread-count` | Unread count |

### Payments (`/api/payments`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/connect/onboard` | Create Stripe Connect account (landlord) |
| GET | `/connect/status` | Check if account is ready |
| POST | `/tenancies` | Create tenancy (rental agreement) |
| GET | `/tenancies` | List tenancies |
| GET | `/tenancies/:id` | Tenancy detail |
| PATCH | `/tenancies/:id/end` | End tenancy |
| POST | `/tenancies/:id/pay` | Pay rent |
| GET | `/history` | Payment history |
| GET | `/:id` | Payment detail |
| GET | `/:id/receipt` | Digital receipt |
| PATCH | `/tenancies/:id/mark-overdue` | Mark payment as overdue |
| POST | `/webhook` | Stripe webhook |

---

## WebSocket Events (Socket.io)

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:join` | conversationId | Join chat room |
| `chat:leave` | conversationId | Leave chat room |
| `chat:typing` | conversationId | User is typing |
| `chat:stopTyping` | conversationId | User stopped typing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:newMessage` | { conversationId, message } | New chat message |
| `chat:typing` | { conversationId, userId } | Someone is typing |
| `chat:stopTyping` | { conversationId, userId } | Stopped typing |
| `chat:messagesRead` | { conversationId, readBy } | Messages marked as read |
| `interest:received` | { interest } | New interest on your listing |
| `interest:accepted` | { interest, conversationId } | Your interest was accepted |
| `interest:rejected` | { interest } | Your interest was rejected |
| `payment:received` | { payment } | Rent payment received (landlord) |
| `payment:confirmed` | { payment } | Payment confirmed (tenant) |
| `payment:overdue` | { payment } | Payment is overdue (tenant) |
| `notification:new` | { notification } | New notification |
| `notification:count` | { unreadCount } | Updated unread count |

---

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Rent Reminder | Daily at 10:00 | Creates monthly payment records, sends reminders 3 days before due date |
| Overdue Check | Daily at 09:00 | Marks overdue payments, notifies tenants |
| Listing Expiry | Daily at 00:00 | Expires listings older than 90 days, notifies owners |

---

## Stripe Connect Payment Flow

```
1. LANDLORD ONBOARDING
   → POST /api/payments/connect/onboard
   → Creates Stripe Express account
   → Returns onboarding URL
   → Landlord completes KYC in Stripe

2. TENANT PAYS RENT
   → POST /api/payments/tenancies/:id/pay
   → Creates PaymentIntent:
     • amount = rent (e.g., €600 = 60000 cents)
     • application_fee = 2% (€12 = 1200 cents)
     • transfer_data.destination = landlord's Stripe account
   → If 3D Secure required, returns client_secret

3. WEBHOOK CONFIRMS
   → Stripe sends payment_intent.succeeded
   → Payment status → COMPLETED
   → Receipt URL stored
   → Both parties notified
```

---

## Seed Data

The seed (`prisma/seed.ts`) creates:

### Users (password: `password123` for all)

| Email | Name | Role | City | Schedule |
|-------|------|------|------|----------|
| ana@example.com | Ana Silva | SEEKER | Lisboa | Day |
| miguel@example.com | Miguel Costa | BOTH | Lisboa | Night |
| sofia@example.com | Sofia Ferreira | SEEKER | Porto | Day |
| tiago@example.com | Tiago Santos | LANDLORD | Lisboa | Night |
| maria@example.com | Maria Oliveira | SEEKER | Porto | Night |
| joao@example.com | João Pereira | LANDLORD | Porto | Day |

### Listings

| Title | Owner | City | Price | Type |
|-------|-------|------|-------|------|
| Quarto luminoso em T2 em Arroios | Miguel | Lisboa | €450 | Room |
| Quarto no coração do Bairro Alto | Tiago | Lisboa | €550 | Room |
| T1 mobilado em Cedofeita | João | Porto | €650 | Apartment |
| Quarto em coliving no centro do Porto | João | Porto | €350 | Coliving |
| T2 com vista rio em Santos | Tiago | Lisboa | €950 | Apartment |

### Also includes
- 3 favorites (Ana saved 2 listings, Maria saved 1)
- 3 interests (2 accepted with conversations, 1 pending)
- 6 messages across 2 conversations
- 3 notifications

---

## Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT tokens with separate secrets for access (15m) and refresh (7d)
- Sensitive fields (`passwordHash`, `refreshToken`) never exposed in API responses
- Input validation on all endpoints via **Zod schemas**
- Auth middleware protects all routes except signup/login/refresh
- Stripe webhook signature verification
- CORS + Helmet security headers

---

## Local Development

### Prerequisites
- Node.js v18+
- Docker Desktop (for PostgreSQL) or PostgreSQL installed locally

### 1. Backend Setup

```bash
cd homie-api

# Start PostgreSQL
docker compose up -d

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run db:seed

# Start dev server
npm run dev
# → API running at http://localhost:3001
```

### 2. Frontend Setup

```bash
cd homie-mobile

# Install dependencies
npm install --legacy-peer-deps

# Start Expo (web)
npx expo start --web
# → Opens in browser at http://localhost:8081

# Or for mobile:
npx expo start
# Then scan QR code with Expo Go (Android/iOS)
```

> **Note**: The backend must be running for the frontend to work. Open two terminal windows — one for each.

> **Note**: For mobile devices, update `API_URL` in `homie-mobile/utils/constants.ts` to your computer's local IP (e.g., `http://192.168.1.100:3001`) instead of `localhost`.

### Backend Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `node test-api.js` | Quick API test (health, login, profile, listings, favorites) |

### Frontend Scripts

| Command | Description |
|---------|-------------|
| `npx expo start` | Start Expo dev server |
| `npx expo start --web` | Start for web browser |
| `npx expo start --android` | Start for Android |
| `npx expo start --ios` | Start for iOS (macOS only) |

### Testing the API

```bash
# With the backend running:
cd homie-api
node test-api.js

# Or test individual endpoints:
curl.exe http://localhost:3001/api/health
```

### App Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Login | `/auth/login` | Email + password login |
| Signup | `/auth/signup` | Registration with name, email, password, DOB |
| Onboarding | `/auth/onboarding` | 4-step habits questionnaire (schedule, lifestyle, preferences, budget) |
| Explore | `/(tabs)/explore` | Listing feed with filters, type chips, compatibility % |
| Map | `/(tabs)/map` | Map view with listing pins and bottom sheet preview |
| Favorites | `/(tabs)/favorites` | Saved listings with remove option |
| Messages | `/(tabs)/messages` | Conversations list with last message preview |
| Chat | `/(tabs)/chat/[id]` | Real-time messaging with typing indicators |
| Profile | `/(tabs)/profile` | User profile, habits summary, logout |
| Listing Detail | `/listing/[id]` | Full listing with photos, details, send interest modal |

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://postgres:password@localhost:5432/homie` |
| `JWT_SECRET` | Access token secret (32+ chars) | Random string |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars) | Random string |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_xxx` |
| `FRONTEND_URL` | Frontend URL (for CORS) | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |

---

## Deployment (Render)

The `render.yaml` configures:
- **Web service**: `homie-api` (free tier, auto-deploy from GitHub)
- **Database**: PostgreSQL (free tier)
- **Build command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start command**: `node dist/index.js`

---

## Future Ideas

### Short-term (Post-MVP)
- [ ] Photo upload to cloud storage (AWS S3 / Cloudinary)
- [ ] Premium subscriptions (Homie Plus / Homie Pro)
- [ ] Listing boost (pay to feature)
- [ ] Profile verification (ID check)
- [ ] Report/block user
- [ ] Push notifications (Expo / Firebase)
- [ ] Reviews and ratings after tenancy ends

### Medium-term
- [ ] AI-powered listing recommendations
- [ ] Virtual tours (video uploads)
- [ ] Digital rental contracts (e-signature)
- [ ] Automatic rent collection (recurring Stripe payments)
- [ ] Landlord dashboard with analytics
- [ ] Multi-language support (PT, EN, ES, FR)

### Long-term
- [ ] Insurance marketplace integration
- [ ] Moving/cleaning service marketplace
- [ ] Roommate-only mode (no listings, just people matching)
- [ ] Student housing partnerships (universities)
- [ ] Corporate housing (companies finding accommodation for employees)
- [ ] Expand to other countries (housing crisis is global)

---

## Target Markets

| Market | Why |
|--------|-----|
| **University students** | Move every year, need roommates, price-sensitive |
| **Young professionals** | Remote workers, relocating for jobs |
| **Expats / Digital nomads** | Need furnished rooms, short-term, trust is key |
| **Erasmus students** | International, 6-month stays, need compatible roommates |
| **Landlords with rooms** | Want reliable tenants, hate managing payments manually |

---

## GitHub Repository

- **Repository:** https://github.com/RodrigoCorreia23/Homie
- **Clone:** `git clone git@github.com:RodrigoCorreia23/Homie.git`
- **Visibility:** Private

---

## Competitive Advantages

| vs | Homie advantage |
|----|-----------------|
| **OLX / Idealista** | Compatibility matching, in-app payments, chat, no spam |
| **Facebook Groups** | Structured listings, verified users, payment receipts |
| **Uniplaces / HousingAnywhere** | Lower commission (2% vs 10%+), roommate matching |
| **Badi** | Payment integration, broader market (not just rooms) |
