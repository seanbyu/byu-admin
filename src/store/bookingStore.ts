import { create } from 'zustand';
import { Booking, BookingStatus } from '@/types';

interface BookingState {
  bookings: Booking[];
  selectedDate: Date;
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;
  setSelectedDate: (date: Date) => void;
  getBookingsByDate: (date: Date) => Booking[];
  getBookingsByStaff: (staffId: string) => Booking[];
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  selectedDate: new Date(),

  setBookings: (bookings) => set({ bookings }),

  addBooking: (booking) =>
    set((state) => ({
      bookings: [...state.bookings, booking],
    })),

  updateBooking: (id, data) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, ...data } : b
      ),
    })),

  cancelBooking: (id) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: BookingStatus.CANCELLED } : b
      ),
    })),

  setSelectedDate: (date) => set({ selectedDate: date }),

  getBookingsByDate: (date) => {
    const bookings = get().bookings;
    return bookings.filter((b) => {
      const bookingDate = new Date(b.date);
      return (
        bookingDate.getFullYear() === date.getFullYear() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getDate() === date.getDate()
      );
    });
  },

  getBookingsByStaff: (staffId) => {
    const bookings = get().bookings;
    return bookings.filter((b) => b.staffId === staffId);
  },
}));
