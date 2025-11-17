'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign, 
  Search, 
  Filter,
  Heart,
  Bookmark,
  Share2,
  Ticket,
  CreditCard,
  ChevronRight,
  Star,
  UserCheck,
  Download,
  Send,
  Eye,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from "lucide-react";
import Layout from "@/components/Layout";
import { firebase } from "@/lib/firebaseService";
import { EventService } from "@/lib/eventService";
import { useAuth } from "@/contexts/AuthContext";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'google_pay' | 'card'>('card');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showHostModal, setShowHostModal] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', filterType],
    queryFn: async () => {
      const allEvents = await firebase.entities.Event.filter({}, {
        orderBy: { field: 'start_date', direction: 'asc' },
        limit: 50
      });
      return allEvents;
    },
    initialData: [],
  });

  // Get user's event interactions
  const { data: userInteractions } = useQuery({
    queryKey: ['user-event-interactions', user?.uid],
    queryFn: async () => {
      if (!user) return { likes: [], saves: [], tickets: [] };
      
      const [likes, saves, tickets] = await Promise.all([
        firebase.entities.EventLike.filter({ user_id: user.uid }),
        firebase.entities.EventSave.filter({ user_id: user.uid }),
        firebase.entities.Ticket.filter({ buyer_id: user.uid })
      ]);

      return { likes, saves, tickets };
    },
    enabled: !!user,
  });

  // Purchase ticket mutation
  const purchaseTicketMutation = useMutation({
    mutationFn: async ({ eventId, quantity, paymentMethod }: {
      eventId: string;
      quantity: number;
      paymentMethod: 'apple_pay' | 'google_pay' | 'card';
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Get user profile for ticket details
      const profiles = await firebase.entities.UserProfile.filter({ uid: user.uid });
      const userProfile = profiles[0];
      
      return EventService.purchaseTicket(
        eventId,
        user.uid,
        quantity,
        paymentMethod,
        {
          name: userProfile?.display_name || 'User',
          email: user.email || 'user@example.com'
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-event-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowPurchaseModal(false);
      alert('Ticket purchased successfully! Check your tickets in the Events section.');
    },
  });

  const hostEventMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user) throw new Error('Not authenticated');
      const profiles = await firebase.entities.UserProfile.filter({ uid: user.uid });
      const profile = profiles[0];
      
      return EventService.createEvent({
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        location: { 
          name: formData.location_name, 
          address: formData.location_address,
          coordinates: { lat: 0, lng: 0 }
        },
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
        price: parseFloat(formData.price) || 0,
        capacity: parseInt(formData.capacity) || 0,
        category: formData.category as any,
        tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        policy: { 
          refund_policy: formData.refund_policy || 'Contact organizer for refund policy',
          terms: formData.terms || 'Standard event terms apply'
        },
        organizer_id: user.uid,
        organizer_name: profile?.display_name || 'Event Organizer',
        organizer_avatar: profile?.avatar_url || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowHostModal(false);
      alert('Event created successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to create event: ${error.message}`);
    }
  });

  // Like event mutation
  const likeEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('User not authenticated');
      await EventService.likeEvent(eventId, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-event-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  // Save event mutation
  const saveEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('User not authenticated');
      await EventService.saveEvent(eventId, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-event-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const filteredEvents = events?.filter(event => {
    // Enhanced search functionality
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.location?.name && event.location.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (event.organizer_name && event.organizer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (event.tags && event.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    if (filterType === "all") return matchesSearch;
    if (filterType === "upcoming") {
      const now = new Date();
      const eventDate = event.start_date?.toDate ? event.start_date.toDate() : 
                       (typeof event.start_date === 'string' || typeof event.start_date === 'number' ? 
                        new Date(event.start_date) : new Date());
      return matchesSearch && eventDate > now;
    }
    if (filterType === "today") {
      const today = new Date();
      const eventDate = event.start_date?.toDate ? event.start_date.toDate() : 
                       (typeof event.start_date === 'string' || typeof event.start_date === 'number' ? 
                        new Date(event.start_date) : new Date());
      return matchesSearch && 
             eventDate.toDateString() === today.toDateString();
    }
    if (filterType === "free") {
      return matchesSearch && (!event.price || event.price === 0);
    }
    if (filterType === "featured") {
      return matchesSearch && event.featured;
    }
    
    return matchesSearch;
  }) || [];

  const handlePurchaseTicket = (event: any) => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setSelectedEvent(event);
    setShowPurchaseModal(true);
  };

  const handleLike = (eventId: string) => {
    likeEventMutation.mutate(eventId);
  };

  const handleSave = (eventId: string) => {
    saveEventMutation.mutate(eventId);
  };

  const handleShare = (event: any) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: EventService.generateShareUrl(event.id),
      });
    } else {
      navigator.clipboard.writeText(EventService.generateShareUrl(event.id));
      alert('Event link copied to clipboard!');
    }
  };

  const handleAddToCalendar = (event: any, provider: 'google' | 'apple' | 'outlook') => {
    const url = EventService.generateCalendarUrl(event, provider);
    if (provider === 'apple') {
      // For Apple Calendar, create and download ICS file
      const blob = new Blob([url.split(',')[1]], { type: 'text/calendar' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      link.click();
    } else {
      window.open(url, '_blank');
    }
  };

  const isEventLiked = (eventId: string) => {
    return userInteractions?.likes.some(like => like.event_id === eventId) || false;
  };

  const isEventSaved = (eventId: string) => {
    return userInteractions?.saves.some(save => save.event_id === eventId) || false;
  };

  const hasTicket = (eventId: string) => {
    return userInteractions?.tickets.some(ticket => ticket.event_id === eventId && ticket.status === 'active') || false;
  };

  const formatDate = (date: any) => {
    const eventDate = date?.toDate ? date.toDate() : new Date(date);
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: any) => {
    const eventDate = date?.toDate ? date.toDate() : new Date(date);
    return eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Events
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Discover amazing drink experiences, tastings, and social gatherings
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events, locations, or organizers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap items-center">
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'today', label: 'Today' },
                  { id: 'free', label: 'Free' },
                  { id: 'featured', label: 'Featured' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setFilterType(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterType === filter.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
                
                {/* Advanced Filters Toggle */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    showAdvancedFilters
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Advanced
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="mt-6 max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Advanced Filters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="500"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-400">
                        $0 - ${priceRange.max}
                      </div>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="tasting">Tasting</option>
                      <option value="workshop">Workshop</option>
                      <option value="networking">Networking</option>
                      <option value="competition">Competition</option>
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location
                    </label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Locations</option>
                      <option value="new york">New York</option>
                      <option value="los angeles">Los Angeles</option>
                      <option value="chicago">Chicago</option>
                      <option value="san francisco">San Francisco</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date Range
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">Any Time</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                      <option value="next_3_months">Next 3 Months</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setPriceRange({ min: 0, max: 500 });
                      setSelectedCategory('all');
                      setSelectedLocation('all');
                      setDateRange('all');
                    }}
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Featured Events */}
          {filterType === 'all' && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Featured Events</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEvents?.filter(event => event.featured).slice(0, 2).map((event) => (
                  <FeaturedEventCard 
                    key={event.id} 
                    event={event}
                    isLiked={isEventLiked(event.id)}
                    isSaved={isEventSaved(event.id)}
                    hasTicket={hasTicket(event.id)}
                    onLike={() => handleLike(event.id)}
                    onSave={() => handleSave(event.id)}
                    onShare={() => handleShare(event)}
                    onPurchase={() => handlePurchaseTicket(event)}
                    onViewDetails={() => {
                      setSelectedEvent(event);
                      setShowEventDetails(true);
                    }}
                    onAddToCalendar={handleAddToCalendar}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Events Grid Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {filterType === 'all' ? 'All Events' : 
               filterType === 'upcoming' ? 'Upcoming Events' :
               filterType === 'today' ? 'Today\'s Events' :
               filterType === 'free' ? 'Free Events' :
               filterType === 'featured' ? 'Featured Events' : 'Events'}
            </h2>
            
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <button
                    onClick={() => setShowHostModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Calendar className="w-4 h-4" />
                    Host Event
                  </button>
                  <button
                    onClick={() => router.push('/events/tickets')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Ticket className="w-4 h-4" />
                    My Tickets
                  </button>
                </>
              )}
              <div className="text-gray-400">
                {filteredEvents?.length || 0} events found
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 animate-pulse">
                  <div className="h-48 bg-gray-600 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-600 rounded flex-1"></div>
                    <div className="h-8 bg-gray-600 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isLiked={isEventLiked(event.id)}
                  isSaved={isEventSaved(event.id)}
                  hasTicket={hasTicket(event.id)}
                  onLike={() => handleLike(event.id)}
                  onSave={() => handleSave(event.id)}
                  onShare={() => handleShare(event)}
                  onPurchase={() => handlePurchaseTicket(event)}
                  onViewDetails={() => {
                    setSelectedEvent(event);
                    setShowEventDetails(true);
                  }}
                  onAddToCalendar={handleAddToCalendar}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No events found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? "No events match your search. Try different keywords."
                  : "No events available for the selected filter."
                }
              </p>
              {user && (
                <button
                  onClick={() => router.push('/demo')}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create Sample Events
                </button>
              )}
            </div>
          )}
        </div>

        {/* Purchase Modal */}
        {showPurchaseModal && selectedEvent && (
          <PurchaseModal
            event={selectedEvent}
            quantity={ticketQuantity}
            paymentMethod={paymentMethod}
            onQuantityChange={setTicketQuantity}
            onPaymentMethodChange={setPaymentMethod}
            onPurchase={() => {
              purchaseTicketMutation.mutate({
                eventId: selectedEvent.id,
                quantity: ticketQuantity,
                paymentMethod: paymentMethod
              });
            }}
            onClose={() => setShowPurchaseModal(false)}
            isLoading={purchaseTicketMutation.isPending}
          />
        )}

        {/* Event Details Modal */}
        {showEventDetails && selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            isLiked={isEventLiked(selectedEvent.id)}
            isSaved={isEventSaved(selectedEvent.id)}
            hasTicket={hasTicket(selectedEvent.id)}
            onLike={() => handleLike(selectedEvent.id)}
            onSave={() => handleSave(selectedEvent.id)}
            onShare={() => handleShare(selectedEvent)}
            onPurchase={() => {
              setShowEventDetails(false);
              handlePurchaseTicket(selectedEvent);
            }}
            onClose={() => setShowEventDetails(false)}
            onAddToCalendar={handleAddToCalendar}
          />
        )}

        {/* Host Event Modal */}
        {showHostModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full border border-white/10 shadow-2xl my-8">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-green-400" />
                    Host a New Event
                  </h2>
                  <button
                    onClick={() => setShowHostModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-white text-2xl">×</span>
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData.entries());
                  hostEventMutation.mutate(data);
                }}
                className="p-6 space-y-6"
              >
                {/* Event Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g., Summer Rooftop Mixer"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    placeholder="Describe your event..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Image URL *
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    required
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      name="location_name"
                      required
                      placeholder="e.g., The Rooftop Bar"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="location_address"
                      required
                      placeholder="123 Main St, City, State"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="start_date"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="end_date"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Price & Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ticket Price ($) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      required
                      min="1"
                      placeholder="100"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="networking">Networking</option>
                    <option value="tasting">Tasting</option>
                    <option value="party">Party</option>
                    <option value="workshop">Workshop</option>
                    <option value="festival">Festival</option>
                    <option value="competition">Competition</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    placeholder="cocktails, rooftop, summer, networking"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Policy */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Refund Policy
                    </label>
                    <textarea
                      name="refund_policy"
                      rows={2}
                      placeholder="e.g., Full refund up to 7 days before event"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Terms & Conditions
                    </label>
                    <textarea
                      name="terms"
                      rows={2}
                      placeholder="e.g., Must be 21+ to attend, Valid ID required"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHostModal(false)}
                    className="flex-1 px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={hostEventMutation.isPending}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {hostEventMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5" />
                        Create Event
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Component definitions will be added next...
function FeaturedEventCard({ 
  event, 
  isLiked, 
  isSaved, 
  hasTicket, 
  onLike, 
  onSave, 
  onShare, 
  onPurchase, 
  onViewDetails,
  onAddToCalendar 
}: any) {
  return (
    <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden group hover:bg-white/10 transition-all duration-300">
      <div className="relative">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
            Featured
          </span>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={onLike}
            className={`p-2 rounded-full backdrop-blur-sm border transition-colors ${
              isLiked 
                ? 'bg-red-500 text-white border-red-500' 
                : 'bg-black/20 text-white border-white/20 hover:bg-red-500'
            }`}
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            onClick={onSave}
            className={`p-2 rounded-full backdrop-blur-sm border transition-colors ${
              isSaved 
                ? 'bg-yellow-500 text-white border-yellow-500' 
                : 'bg-black/20 text-white border-white/20 hover:bg-yellow-500'
            }`}
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(event.start_date.toDate()).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{event.location.name}</span>
              </div>
            </div>
          </div>
          {event.price && (
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">${event.price}</div>
              <div className="text-xs text-gray-400">per ticket</div>
            </div>
          )}
        </div>
        
        <p className="text-gray-300 mb-4 line-clamp-3">{event.description}</p>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onViewDetails}
            className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            View Details
          </button>
          {hasTicket ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>Purchased</span>
            </div>
          ) : (
            <button
              onClick={onPurchase}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Get Tickets
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ 
  event, 
  isLiked, 
  isSaved, 
  hasTicket, 
  onLike, 
  onSave, 
  onShare, 
  onPurchase, 
  onViewDetails,
  onAddToCalendar 
}: any) {
  return (
    <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden group hover:bg-white/10 transition-all duration-300">
      <div className="relative">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 flex gap-1">
          <button
            onClick={onLike}
            className={`p-1.5 rounded-full backdrop-blur-sm border transition-colors ${
              isLiked 
                ? 'bg-red-500 text-white border-red-500' 
                : 'bg-black/20 text-white border-white/20 hover:bg-red-500'
            }`}
          >
            <Heart className="w-3 h-3" />
          </button>
          <button
            onClick={onSave}
            className={`p-1.5 rounded-full backdrop-blur-sm border transition-colors ${
              isSaved 
                ? 'bg-yellow-500 text-white border-yellow-500' 
                : 'bg-black/20 text-white border-white/20 hover:bg-yellow-500'
            }`}
          >
            <Bookmark className="w-3 h-3" />
          </button>
        </div>
        {event.price && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-sm rounded">
            ${event.price}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-white mb-2 line-clamp-2">{event.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.start_date.toDate()).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{event.location.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{event.rsvp_count} interested</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 px-3 py-2 border border-white/20 text-white text-sm rounded-lg hover:bg-white/10 transition-colors"
          >
            Details
          </button>
          {hasTicket ? (
            <div className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg">
              <CheckCircle className="w-3 h-3" />
              <span>Owned</span>
            </div>
          ) : (
            <button
              onClick={onPurchase}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
            >
              Tickets
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Additional modal components will be added in the next part...
function PurchaseModal({ 
  event, 
  quantity, 
  paymentMethod, 
  onQuantityChange, 
  onPaymentMethodChange, 
  onPurchase, 
  onClose, 
  isLoading 
}: any) {
  const totalPrice = (event.price || 0) * quantity;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Purchase Tickets</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Event Info */}
          <div className="mb-6">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
            <h3 className="font-semibold text-white">{event.title}</h3>
            <div className="text-sm text-gray-400">
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(event.start_date.toDate()).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{event.location.name}</span>
              </div>
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Tickets
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                -
              </button>
              <span className="text-white font-medium w-8 text-center">{quantity}</span>
              <button
                onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
                className="w-8 h-8 rounded border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Payment Method
            </label>
            <div className="space-y-2">
              {[
                { id: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
                { id: 'google_pay', label: 'Google Pay', icon: 'G' },
                { id: 'card', label: 'Credit/Debit Card', icon: '💳' }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => onPaymentMethodChange(method.id as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    paymentMethod === method.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <span className="text-lg">{method.icon}</span>
                  <span className="text-white">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total ({quantity} ticket{quantity > 1 ? 's' : ''})</span>
              <span className="text-xl font-bold text-purple-400">${totalPrice}</span>
            </div>
          </div>

          {/* Purchase Button */}
          <button
            onClick={onPurchase}
            disabled={isLoading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Purchase Tickets
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventDetailsModal({ 
  event, 
  isLiked, 
  isSaved, 
  hasTicket, 
  onLike, 
  onSave, 
  onShare, 
  onPurchase, 
  onClose,
  onAddToCalendar 
}: any) {
  const formatDate = (date: any) => {
    const eventDate = date?.toDate ? date.toDate() : new Date(date);
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: any) => {
    const eventDate = date?.toDate ? date.toDate() : new Date(date);
    return eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-64 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={onLike}
              className={`p-2 rounded-full backdrop-blur-sm border transition-colors ${
                isLiked 
                  ? 'bg-red-500 text-white border-red-500' 
                  : 'bg-black/20 text-white border-white/20 hover:bg-red-500'
              }`}
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={onSave}
              className={`p-2 rounded-full backdrop-blur-sm border transition-colors ${
                isSaved 
                  ? 'bg-yellow-500 text-white border-yellow-500' 
                  : 'bg-black/20 text-white border-white/20 hover:bg-yellow-500'
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              onClick={onShare}
              className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Title and Host */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-3">{event.title}</h1>
            <div className="flex items-center gap-3">
              <img
                src={event.organizer_avatar}
                alt={event.organizer_name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="text-white font-medium">{event.organizer_name}</div>
                <div className="text-sm text-gray-400">Event Organizer</div>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Event Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="text-white">{formatDate(event.start_date)}</div>
                    <div className="text-sm text-gray-400">
                      {formatTime(event.start_date)} - {formatTime(event.end_date)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="text-white">{event.location.name}</div>
                    <div className="text-sm text-gray-400">{event.location.address}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <div className="text-white">
                    {event.rsvp_count} interested • {event.capacity} capacity
                  </div>
                </div>
                
                {event.price && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                    <div className="text-white">${event.price} per ticket</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => onAddToCalendar(event, 'google')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Google Calendar
                  </button>
                  <button
                    onClick={() => onAddToCalendar(event, 'apple')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Apple Calendar
                  </button>
                </div>
                <button
                  onClick={() => onAddToCalendar(event, 'outlook')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Outlook Calendar
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">About This Event</h3>
            <p className="text-gray-300 leading-relaxed">{event.description}</p>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Policy */}
          {event.policy && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Event Policy</h3>
              <div className="space-y-2 text-sm text-gray-300">
                {event.policy.age_restriction && (
                  <div>
                    <strong>Age Restriction:</strong> {event.policy.age_restriction}+ only
                  </div>
                )}
                {event.policy.dress_code && (
                  <div>
                    <strong>Dress Code:</strong> {event.policy.dress_code}
                  </div>
                )}
                <div>
                  <strong>Refund Policy:</strong> {event.policy.refund_policy}
                </div>
                <div>
                  <strong>Terms:</strong> {event.policy.terms}
                </div>
              </div>
            </div>
          )}

          {/* Purchase Button */}
          <div className="flex gap-3">
            {hasTicket ? (
              <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>You have tickets for this event</span>
              </div>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={onPurchase}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Ticket className="w-5 h-5" />
                  Get Tickets {event.price && `- $${event.price}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
