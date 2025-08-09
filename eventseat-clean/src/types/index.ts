export interface Guest {
  id: string;
  name: string;
  tableNumber: number;
  seatNumber?: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  themeColor?: string;
  logo?: string;
  guests: Guest[];
  createdAt: string;
} 