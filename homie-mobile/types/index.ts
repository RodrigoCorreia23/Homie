export interface User {
  id: string;
  email: string;
  name: string;
  dateOfBirth?: string;
  bio?: string;
  city?: string;
  role: string;
  preferredCity?: string;
  expoPushToken?: string;
  photos: UserPhoto[];
  habits?: Habits;
  stripeAccountReady?: boolean;
  createdAt: string;
}

export interface UserPhoto {
  id: string;
  url: string;
  position: number;
}

export interface Habits {
  schedule: 'DAY' | 'NIGHT';
  smoker: boolean;
  pets: boolean;
  cleanliness: 1 | 2 | 3 | 4 | 5;
  noise: 1 | 2 | 3 | 4 | 5;
  visitors: 1 | 2 | 3 | 4 | 5;
  budgetMin?: number;
  budgetMax?: number;
}

export interface ListingPhoto {
  id: string;
  url: string;
  position: number;
}

export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: 'ROOM' | 'APARTMENT' | 'COLIVING';
  pricePerMonth: number;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  billsIncluded: boolean;
  availableFrom: string;
  smokersAllowed: boolean;
  petsAllowed: boolean;
  preferredGender?: string;
  status: string;
  photos: ListingPhoto[];
  owner?: User;
  compatibility?: number;
  distance?: number;
}

export interface Interest {
  id: string;
  userId: string;
  listingId: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  listing?: Listing;
  user?: User;
}

export interface Conversation {
  id: string;
  interestId: string;
  members: User[];
  messages?: Message[];
  interest?: Interest;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  listing?: Listing;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Tenancy {
  id: string;
  listingId: string;
  tenantId: string;
  landlordId: string;
  rentAmount: number;
  startDate: string;
  endDate?: string;
  status: string;
  listing?: Listing;
  tenant?: User;
  landlord?: User;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  tenancyId: string;
  amount: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt?: string;
  receiptUrl?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ListingFeedResponse {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
