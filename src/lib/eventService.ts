import { firebase } from './firebaseService';
import { Event, Ticket, EventLike, EventSave, RSVP } from './firebaseService';
import QRCode from 'qrcode';

export class EventService {
  // Create sample events for the system
  static async createSampleEvents(): Promise<Event[]> {
    const sampleEvents = [
      {
        title: "Whiskey Tasting Masterclass",
        description: "Join us for an exclusive whiskey tasting experience featuring rare and premium selections from Scotland, Ireland, and Japan. Our expert sommelier will guide you through the tasting notes, production processes, and the rich history behind each bottle. This intimate gathering is perfect for whiskey enthusiasts and newcomers alike.",
        image_url: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        location: {
          name: "The Copper Fox Distillery",
          address: "9 River Ln, Sperryville, VA 22740",
          coordinates: { lat: 38.6631, lng: -78.2247 }
        },
        start_date: new Date('2024-12-15T19:00:00'),
        end_date: new Date('2024-12-15T22:00:00'),
        price: 85,
        tickets_available: 24,
        tickets_sold: 18,
        rsvp_count: 22,
        likes_count: 47,
        saves_count: 23,
        organizer_id: 'organizer_1',
        organizer_name: 'Master Distiller James Wilson',
        organizer_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        category: 'tasting' as const,
        tags: ['whiskey', 'premium', 'educational', 'small-group'],
        policy: {
          age_restriction: 21,
          dress_code: 'Smart casual',
          refund_policy: 'Full refund up to 48 hours before the event. 50% refund up to 24 hours before.',
          terms: 'By purchasing this ticket, you agree to our terms of service. Please drink responsibly and arrange safe transportation.'
        },
        capacity: 24,
        status: 'upcoming' as const,
        featured: true
      },
      {
        title: "Cocktail Making Workshop: Classic & Modern",
        description: "Learn the art of mixology from professional bartenders in this hands-on workshop. Master classic cocktails like Old Fashioned, Manhattan, and Negroni, then explore modern molecular mixology techniques. Each participant will create 6 different cocktails and receive a recipe booklet to take home.",
        image_url: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        location: {
          name: "Mixology Lab NYC",
          address: "123 Broadway, New York, NY 10001",
          coordinates: { lat: 40.7505, lng: -73.9934 }
        },
        start_date: new Date('2024-12-20T18:30:00'),
        end_date: new Date('2024-12-20T21:30:00'),
        price: 95,
        tickets_available: 16,
        tickets_sold: 12,
        rsvp_count: 15,
        likes_count: 62,
        saves_count: 34,
        organizer_id: 'organizer_2',
        organizer_name: 'Sofia Martinez - Head Bartender',
        organizer_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b100?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        category: 'workshop' as const,
        tags: ['cocktails', 'hands-on', 'beginner-friendly', 'recipe-included'],
        policy: {
          age_restriction: 21,
          dress_code: 'Casual',
          refund_policy: 'Full refund up to 72 hours before the event.',
          terms: 'All materials included. Please inform us of any allergies or dietary restrictions.'
        },
        capacity: 16,
        status: 'upcoming' as const,
        featured: false
      },
      {
        title: "Happy Hour & Networking - Tech Professionals",
        description: "Connect with fellow tech professionals over craft cocktails and artisanal appetizers. This monthly networking event brings together developers, designers, product managers, and entrepreneurs in a relaxed atmosphere. Featured cocktails include tech-themed drinks like 'The Algorithm' and 'Debug Martini'.",
        image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        location: {
          name: "Silicon Valley Cocktail Lounge",
          address: "456 Innovation Way, Palo Alto, CA 94301",
          coordinates: { lat: 37.4419, lng: -122.1430 }
        },
        start_date: new Date('2024-12-18T17:00:00'),
        end_date: new Date('2024-12-18T20:00:00'),
        price: 35,
        tickets_available: 80,
        tickets_sold: 45,
        rsvp_count: 67,
        likes_count: 89,
        saves_count: 12,
        organizer_id: 'organizer_3',
        organizer_name: 'Tech Connect Events',
        organizer_avatar: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        category: 'networking' as const,
        tags: ['networking', 'tech', 'happy-hour', 'casual'],
        policy: {
          age_restriction: 21,
          dress_code: 'Business casual',
          refund_policy: 'No refunds, but tickets are transferable.',
          terms: 'Professional networking event. Business cards recommended.'
        },
        capacity: 80,
        status: 'upcoming' as const,
        featured: true
      },
      {
        title: "International Bartender Competition",
        description: "Watch the city's top bartenders compete in this exciting mixology competition. Three rounds of challenges including speed mixing, original cocktail creation, and flair bartending. Audience gets to taste the creations and vote for the People's Choice Award. Prize pool of $5,000 for winners.",
        image_url: "https://images.unsplash.com/photo-1573962364788-de1fa161c3e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        location: {
          name: "Grand Ballroom - Hotel Magnifico",
          address: "789 Luxury Ave, Beverly Hills, CA 90210",
          coordinates: { lat: 34.0696, lng: -118.4054 }
        },
        start_date: new Date('2024-12-22T19:00:00'),
        end_date: new Date('2024-12-22T23:00:00'),
        price: 65,
        tickets_available: 200,
        tickets_sold: 156,
        rsvp_count: 178,
        likes_count: 234,
        saves_count: 89,
        organizer_id: 'organizer_4',
        organizer_name: 'International Bartenders Guild',
        organizer_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        category: 'competition' as const,
        tags: ['competition', 'professional', 'entertainment', 'voting'],
        policy: {
          age_restriction: 18,
          dress_code: 'Cocktail attire',
          refund_policy: 'Refunds available up to 1 week before the event.',
          terms: 'Photography and filming may occur during the event for promotional purposes.'
        },
        capacity: 200,
        status: 'upcoming' as const,
        featured: true
      },
      {
        title: "Wine & Cocktail Pairing Dinner",
        description: "An exquisite 5-course dinner featuring wine and cocktail pairings curated by our sommelier and head bartender. Each course is paired with both a premium wine and a crafted cocktail that complement the flavors. Includes detailed tasting notes and pairing explanations.",
        image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        location: {
          name: "Le Jardin Restaurant",
          address: "321 Gourmet Street, Chicago, IL 60611",
          coordinates: { lat: 41.8781, lng: -87.6298 }
        },
        start_date: new Date('2024-12-28T18:00:00'),
        end_date: new Date('2024-12-28T22:30:00'),
        price: 145,
        tickets_available: 32,
        tickets_sold: 28,
        rsvp_count: 31,
        likes_count: 76,
        saves_count: 45,
        organizer_id: 'organizer_5',
        organizer_name: 'Chef Antoine & Sommelier Elena',
        organizer_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        category: 'tasting' as const,
        tags: ['fine-dining', 'wine', 'cocktails', 'pairing', 'luxury'],
        policy: {
          age_restriction: 21,
          dress_code: 'Formal attire required',
          refund_policy: 'Full refund up to 1 week before. 50% refund up to 48 hours before.',
          terms: 'Please inform us of dietary restrictions at least 48 hours in advance.'
        },
        capacity: 32,
        status: 'upcoming' as const,
        featured: false
      }
    ];

    const createdEvents: Event[] = [];
    for (const eventData of sampleEvents) {
      try {
        const event = await firebase.entities.Event.create({
          ...eventData,
          start_date: eventData.start_date as any,
          end_date: eventData.end_date as any
        });
        
        if (typeof event === 'string') {
          // If create returns an ID, fetch the full event
          const fullEvent = await firebase.entities.Event.get(event);
          if (fullEvent) {
            createdEvents.push(fullEvent);
          }
        } else {
          createdEvents.push(event as Event);
        }
      } catch (error) {
        console.error('Error creating sample event:', error);
      }
    }

    return createdEvents;
  }

  // Purchase ticket with payment processing
  static async purchaseTicket(
    eventId: string,
    userId: string,
    quantity: number,
    paymentMethod: 'apple_pay' | 'google_pay' | 'card',
    userDetails: {
      name: string;
      email: string;
    }
  ): Promise<Ticket> {
    try {
      // Get event details
      const event = await firebase.entities.Event.get(eventId);
      if (!event) throw new Error('Event not found');

      const totalPrice = (event.price || 0) * quantity;
      
      // Generate unique ticket code and QR code
      const ticketCode = this.generateTicketCode();
      const qrCodeData = JSON.stringify({
        ticketId: ticketCode,
        eventId: eventId,
        userId: userId,
        quantity: quantity,
        purchaseDate: new Date().toISOString()
      });
      
      const qrCode = await QRCode.toDataURL(qrCodeData);

      // Create ticket
      const ticket = await firebase.entities.Ticket.create({
        event_id: eventId,
        event_title: event.title,
        event_date: event.start_date,
        event_location: event.location.name,
        buyer_id: userId,
        buyer_name: userDetails.name,
        buyer_email: userDetails.email,
        quantity: quantity,
        total_price: totalPrice,
        purchase_date: new Date() as any,
        ticket_code: ticketCode,
        qr_code: qrCode,
        status: 'active' as const,
        payment_method: paymentMethod,
        payment_id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      // Update event ticket counts
      await firebase.entities.Event.update(eventId, {
        tickets_sold: event.tickets_sold + quantity,
        tickets_available: Math.max(0, (event.tickets_available || 0) - quantity)
      });

      return typeof ticket === 'string' ? 
        await firebase.entities.Ticket.get(ticket) as Ticket : 
        ticket as Ticket;
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      throw error;
    }
  }

  // Like an event
  static async likeEvent(eventId: string, userId: string): Promise<void> {
    try {
      // Check if already liked
      const existingLike = await firebase.entities.EventLike.filter({
        event_id: eventId,
        user_id: userId
      });

      if (existingLike.length > 0) {
        // Unlike
        await firebase.entities.EventLike.delete(existingLike[0].id);
        
        // Update event like count
        const event = await firebase.entities.Event.get(eventId);
        if (event) {
          await firebase.entities.Event.update(eventId, {
            likes_count: Math.max(0, (event.likes_count || 0) - 1)
          });
        }
      } else {
        // Like
        await firebase.entities.EventLike.create({
          event_id: eventId,
          user_id: userId
        });

        // Update event like count
        const event = await firebase.entities.Event.get(eventId);
        if (event) {
          await firebase.entities.Event.update(eventId, {
            likes_count: (event.likes_count || 0) + 1
          });
        }
      }
    } catch (error) {
      console.error('Error liking event:', error);
      throw error;
    }
  }

  // Save an event
  static async saveEvent(eventId: string, userId: string): Promise<void> {
    try {
      // Check if already saved
      const existingSave = await firebase.entities.EventSave.filter({
        event_id: eventId,
        user_id: userId
      });

      if (existingSave.length > 0) {
        // Unsave
        await firebase.entities.EventSave.delete(existingSave[0].id);
        
        // Update event save count
        const event = await firebase.entities.Event.get(eventId);
        if (event) {
          await firebase.entities.Event.update(eventId, {
            saves_count: Math.max(0, (event.saves_count || 0) - 1)
          });
        }
      } else {
        // Save
        await firebase.entities.EventSave.create({
          event_id: eventId,
          user_id: userId
        });

        // Update event save count
        const event = await firebase.entities.Event.get(eventId);
        if (event) {
          await firebase.entities.Event.update(eventId, {
            saves_count: (event.saves_count || 0) + 1
          });
        }
      }
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  }

  // Get user's tickets
  static async getUserTickets(userId: string): Promise<Ticket[]> {
    try {
      return await firebase.entities.Ticket.filter({ buyer_id: userId });
    } catch (error) {
      console.error('Error getting user tickets:', error);
      return [];
    }
  }

  // Transfer ticket
  static async transferTicket(ticketId: string, fromUserId: string, toUserEmail: string): Promise<void> {
    try {
      // Find recipient by email
      const recipients = await firebase.entities.UserProfile.filter({});
      const recipient = recipients.find((u: any) => u.uid === toUserEmail); // In real app, you'd have email field

      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Update ticket
      await firebase.entities.Ticket.update(ticketId, {
        transferred_to: recipient.uid,
        status: 'transferred' as const
      });

      // Create new ticket for recipient
      const originalTicket = await firebase.entities.Ticket.get(ticketId);
      if (originalTicket) {
        await firebase.entities.Ticket.create({
          event_id: originalTicket.event_id,
          event_title: originalTicket.event_title,
          event_date: originalTicket.event_date,
          event_location: originalTicket.event_location,
          buyer_id: recipient.uid,
          buyer_name: recipient.display_name,
          buyer_email: toUserEmail,
          quantity: originalTicket.quantity,
          total_price: originalTicket.total_price,
          status: 'active' as const,
          ticket_code: this.generateTicketCode(),
          qr_code: originalTicket.qr_code,
          payment_method: originalTicket.payment_method,
          payment_id: originalTicket.payment_id
        });
      }
    } catch (error) {
      console.error('Error transferring ticket:', error);
      throw error;
    }
  }

  // Generate calendar event URL
  static generateCalendarUrl(event: any, provider: 'google' | 'apple' | 'outlook'): string {
    const startDate = event.start_date?.toDate ? event.start_date.toDate() : 
                     (event.start_date ? new Date(event.start_date as any) : new Date());
    const endDate = event.end_date?.toDate ? event.end_date.toDate() : 
                   (event.end_date ? new Date(event.end_date as any) : 
                    new Date(startDate.getTime() + 2 * 60 * 60 * 1000));
    
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    const details = {
      title: event.title,
      start: formatDate(startDate),
      end: formatDate(endDate),
      description: event.description,
      location: event.location?.name ? 
                `${event.location.name}${event.location.address ? ', ' + event.location.address : ''}` : 
                'Location TBD'
    };

    switch (provider) {
      case 'google':
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(details.title)}&dates=${details.start}/${details.end}&details=${encodeURIComponent(details.description)}&location=${encodeURIComponent(details.location)}`;
      
      case 'outlook':
        return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(details.title)}&startdt=${details.start}&enddt=${details.end}&body=${encodeURIComponent(details.description)}&location=${encodeURIComponent(details.location)}`;
      
      case 'apple':
        // Apple Calendar uses webcal protocol or ICS file
        return `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${details.start}
DTEND:${details.end}
SUMMARY:${details.title}
DESCRIPTION:${details.description}
LOCATION:${details.location}
END:VEVENT
END:VCALENDAR`;
      
      default:
        return '';
    }
  }

  // Generate share URL
  static generateShareUrl(eventId: string): string {
    return `${window.location.origin}/events/${eventId}`;
  }

  // Check if user liked event
  static async isEventLiked(eventId: string, userId: string): Promise<boolean> {
    try {
      const likes = await firebase.entities.EventLike.filter({
        event_id: eventId,
        user_id: userId
      });
      return likes.length > 0;
    } catch (error) {
      console.error('Error checking if event is liked:', error);
      return false;
    }
  }

  // Check if user saved event
  static async isEventSaved(eventId: string, userId: string): Promise<boolean> {
    try {
      const saves = await firebase.entities.EventSave.filter({
        event_id: eventId,
        user_id: userId
      });
      return saves.length > 0;
    } catch (error) {
      console.error('Error checking if event is saved:', error);
      return false;
    }
  }

  // Private helper methods
  private static generateTicketCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create a new event (for hosts)
  static async createEvent(data: {
    title: string;
    description: string;
    image_url: string;
    location: { name: string; address: string; coordinates?: { lat: number; lng: number } };
    start_date: Date;
    end_date: Date;
    price?: number;
    capacity: number;
    category: 'tasting' | 'workshop' | 'happy-hour' | 'networking' | 'competition' | 'other';
    tags?: string[];
    policy?: { age_restriction?: number; dress_code?: string; refund_policy?: string; terms?: string };
    organizer_id: string;
    organizer_name: string;
    organizer_avatar?: string;
  }): Promise<string> {
    try {
      const location = {
        name: data.location.name,
        address: data.location.address,
        coordinates: data.location.coordinates || { lat: 0, lng: 0 }
      };
      
      const policy = {
        refund_policy: data.policy?.refund_policy || 'Contact organizer for refund policy',
        terms: data.policy?.terms || 'Standard event terms apply',
        age_restriction: data.policy?.age_restriction,
        dress_code: data.policy?.dress_code
      };

      const event = await firebase.entities.Event.create({
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        location: location,
        start_date: data.start_date as any,
        end_date: data.end_date as any,
        price: data.price || 0,
        tickets_available: data.capacity,
        tickets_sold: 0,
        rsvp_count: 0,
        likes_count: 0,
        saves_count: 0,
        organizer_id: data.organizer_id,
        organizer_name: data.organizer_name,
        organizer_avatar: data.organizer_avatar || '',
        category: data.category,
        tags: data.tags || [],
        policy: policy,
        capacity: data.capacity,
        status: 'upcoming',
        featured: false
      });

      return typeof event === 'string' ? event : (event as any).id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }
}
