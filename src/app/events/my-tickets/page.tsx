'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Ticket,
  QrCode,
  Download,
  Share2,
  Eye,
  CheckCircle,
  AlertCircle,
  Send,
  Copy,
  Filter,
  Search,
  MoreVertical,
  Mail,
  MessageSquare
} from "lucide-react";
import Layout from "@/components/Layout";
import { firebase } from "@/lib/firebaseService";
import { EventService } from "@/lib/eventService";
import { useAuth } from "@/contexts/AuthContext";

export default function MyTickets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Load user's tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['user-tickets', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      const userTickets = await firebase.entities.Ticket.filter({ 
        buyer_id: user.uid 
      }, {
        orderBy: { field: 'purchase_date', direction: 'desc' }
      });
      
      // Get event details for each ticket
      const ticketsWithEvents = await Promise.all(
        userTickets.map(async (ticket) => {
          const events = await firebase.entities.Event.filter({ id: ticket.event_id });
          const event = events[0];
          return { ...ticket, event };
        })
      );
      
      return ticketsWithEvents;
    },
    enabled: !!user,
    initialData: [],
  });

  // Transfer ticket mutation
  const transferTicketMutation = useMutation({
    mutationFn: async ({ ticketId, recipientEmail }: { ticketId: string, recipientEmail: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      return await EventService.transferTicket(ticketId, user.uid, recipientEmail);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
      setShowTransferModal(false);
      setTransferEmail("");
      alert('Ticket transferred successfully!');
    },
  });

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = ticket.event?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.event?.location?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const now = new Date();
    const eventDate = ticket.event?.start_date?.toDate ? 
      ticket.event.start_date.toDate() : 
      (ticket.event?.start_date ? new Date(ticket.event.start_date as any) : now);
    
    if (filterType === "all") return matchesSearch;
    if (filterType === "upcoming") {
      return matchesSearch && eventDate > now && ticket.status === 'active';
    }
    if (filterType === "past") {
      return matchesSearch && eventDate < now;
    }
    if (filterType === "used") {
      return matchesSearch && ticket.status === 'used';
    }
    if (filterType === "transferred") {
      return matchesSearch && ticket.status === 'transferred';
    }
    
    return matchesSearch;
  }) || [];

  const handleShowQR = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  const handleTransfer = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowTransferModal(true);
  };

  const handleDownloadTicket = (ticket: any) => {
    // Generate and download ticket as PDF or image
    const ticketData = {
      title: ticket.event?.title,
      date: ticket.event?.start_date,
      location: ticket.event?.location?.name,
      qrCode: ticket.qr_code,
      ticketId: ticket.id
    };
    
    // This would typically generate a PDF
    console.log('Download ticket:', ticketData);
    alert('Ticket download functionality would be implemented here');
  };

  const handleShareTicket = async (ticket: any) => {
    if (navigator.share) {
      await navigator.share({
        title: `Ticket for ${ticket.event?.title}`,
        text: `I have a ticket for ${ticket.event?.title}!`,
        url: EventService.generateShareUrl(ticket.event_id),
      });
    } else {
      navigator.clipboard.writeText(EventService.generateShareUrl(ticket.event_id));
      alert('Event link copied to clipboard!');
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'used':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'transferred':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
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

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Ticket className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sign in to view your tickets</h2>
            <p className="text-gray-400 mb-6">
              Access your purchased event tickets and manage your bookings
            </p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                My Tickets
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Manage your event tickets, view QR codes, and transfer to friends
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search your tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'all', label: 'All Tickets' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'past', label: 'Past Events' },
                  { id: 'used', label: 'Used' },
                  { id: 'transferred', label: 'Transferred' }
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
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold text-purple-400">
                {tickets?.filter(t => t.status === 'active').length || 0}
              </div>
              <div className="text-sm text-gray-400">Active Tickets</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold text-green-400">
                {tickets?.filter(t => {
                  const eventDate = t.event?.start_date?.toDate ? 
                    t.event.start_date.toDate() : 
                    (t.event?.start_date ? new Date(t.event.start_date as any) : new Date());
                  return eventDate > new Date() && t.status === 'active';
                }).length || 0}
              </div>
              <div className="text-sm text-gray-400">Upcoming Events</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold text-blue-400">
                {tickets?.filter(t => t.status === 'used').length || 0}
              </div>
              <div className="text-sm text-gray-400">Events Attended</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold text-yellow-400">
                {tickets?.filter(t => t.status === 'transferred').length || 0}
              </div>
              <div className="text-sm text-gray-400">Transferred</div>
            </div>
          </div>

          {/* Tickets Grid */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {filterType === 'all' ? 'All Tickets' : 
               filterType === 'upcoming' ? 'Upcoming Events' :
               filterType === 'past' ? 'Past Events' :
               filterType === 'used' ? 'Used Tickets' :
               filterType === 'transferred' ? 'Transferred Tickets' : 'Tickets'}
            </h2>
            <div className="text-gray-400">
              {filteredTickets?.length || 0} tickets
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
          ) : filteredTickets?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onShowQR={() => handleShowQR(ticket)}
                  onTransfer={() => handleTransfer(ticket)}
                  onDownload={() => handleDownloadTicket(ticket)}
                  onShare={() => handleShareTicket(ticket)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {searchQuery ? 'No tickets found' : 'No tickets yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? "No tickets match your search criteria."
                  : "Start by purchasing tickets to upcoming events!"
                }
              </p>
              <button
                onClick={() => router.push('/events')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Browse Events
              </button>
            </div>
          )}
        </div>

        {/* QR Code Modal */}
        {showQRModal && selectedTicket && (
          <QRModal
            ticket={selectedTicket}
            onClose={() => setShowQRModal(false)}
          />
        )}

        {/* Transfer Modal */}
        {showTransferModal && selectedTicket && (
          <TransferModal
            ticket={selectedTicket}
            email={transferEmail}
            onEmailChange={setTransferEmail}
            onTransfer={() => {
              transferTicketMutation.mutate({
                ticketId: selectedTicket.id,
                recipientEmail: transferEmail
              });
            }}
            onClose={() => setShowTransferModal(false)}
            isLoading={transferTicketMutation.isPending}
          />
        )}
      </div>
    </Layout>
  );
}

// Ticket Card Component
function TicketCard({ 
  ticket, 
  onShowQR, 
  onTransfer, 
  onDownload, 
  onShare 
}: {
  ticket: any;
  onShowQR: () => void;
  onTransfer: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'used':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'transferred':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const isEventUpcoming = () => {
    const eventDate = ticket.event?.start_date?.toDate ? 
      ticket.event.start_date.toDate() : 
      (ticket.event?.start_date ? new Date(ticket.event.start_date as any) : new Date());
    return eventDate > new Date();
  };

  return (
    <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden group hover:bg-white/10 transition-all duration-300">
      {/* Ticket Header with Event Image */}
      <div className="relative">
        <img
          src={ticket.event?.image_url || 'https://via.placeholder.com/400x200'}
          alt={ticket.event?.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
            {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1)}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg border border-white/20 shadow-lg z-10">
                <button
                  onClick={() => { onDownload(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Ticket
                </button>
                <button
                  onClick={() => { onShare(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Event
                </button>
                {ticket.status === 'active' && isEventUpcoming() && (
                  <button
                    onClick={() => { onTransfer(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Transfer Ticket
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Ticket Price */}
        {ticket.total_amount && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-sm rounded">
            ${ticket.total_amount}
          </div>
        )}
      </div>
      
      <div className="p-4">
        {/* Event Title */}
        <h3 className="font-bold text-white mb-2 line-clamp-2">
          {ticket.event?.title}
        </h3>
        
        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              {ticket.event?.start_date ? 
                new Date(ticket.event.start_date.toDate()).toLocaleDateString() : 
                'Date TBD'
              }
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{ticket.event?.location?.name || 'Location TBD'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Ticket className="w-4 h-4" />
            <span>Ticket #{ticket.id.slice(-8)}</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {ticket.status === 'active' && (
            <button
              onClick={onShowQR}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Show QR
            </button>
          )}
          
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-3 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// QR Code Modal
function QRModal({ ticket, onClose }: { ticket: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Event Ticket</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Ticket Info */}
          <div className="text-center mb-6">
            <h3 className="font-semibold text-white mb-2">{ticket.event?.title}</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {ticket.event?.start_date ? 
                    new Date(ticket.event.start_date.toDate()).toLocaleDateString() : 
                    'Date TBD'
                  }
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{ticket.event?.location?.name || 'Location TBD'}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-lg mb-6 flex items-center justify-center">
            {ticket.qr_code ? (
              <img
                src={ticket.qr_code}
                alt="Ticket QR Code"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Ticket ID */}
          <div className="text-center mb-6">
            <div className="text-xs text-gray-400 mb-1">Ticket ID</div>
            <div className="font-mono text-sm text-white bg-white/10 px-3 py-2 rounded">
              {ticket.id}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="text-blue-300 text-sm">
              <strong>Instructions:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Show this QR code at the event entrance</li>
                <li>• Keep your phone brightness high for better scanning</li>
                <li>• Take a screenshot as backup</li>
              </ul>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Transfer Modal
function TransferModal({ 
  ticket, 
  email, 
  onEmailChange, 
  onTransfer, 
  onClose, 
  isLoading 
}: {
  ticket: any;
  email: string;
  onEmailChange: (email: string) => void;
  onTransfer: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Transfer Ticket</h2>
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
              src={ticket.event?.image_url}
              alt={ticket.event?.title}
              className="w-full h-24 object-cover rounded-lg mb-3"
            />
            <h3 className="font-semibold text-white">{ticket.event?.title}</h3>
            <div className="text-sm text-gray-400">
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {ticket.event?.start_date ? 
                    new Date(ticket.event.start_date.toDate()).toLocaleDateString() : 
                    'Date TBD'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Enter recipient's email"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="text-yellow-300 text-sm">
                <strong>Important:</strong> Once transferred, you will no longer have access to this ticket. 
                The recipient will receive an email with the ticket details.
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onTransfer}
              disabled={!email || isLoading}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Transfer Ticket
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
