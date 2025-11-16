'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket,
  Search, 
  Filter,
  Download,
  Share2,
  Eye,
  CheckCircle,
  AlertCircle,
  Send,
  Copy,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc
} from "lucide-react";
import Layout from "@/components/Layout";
import { firebase } from "@/lib/firebaseService";
import { TicketService } from "@/lib/ticketService";
import { useAuth } from "@/contexts/AuthContext";

export default function TicketManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "purchased" | "received" | "used" | "active">("all");
  const [sortBy, setSortBy] = useState<"date" | "event_name" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  // Modal states
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Transfer ticket mutation
  const transferTicketMutation = useMutation({
    mutationFn: async ({ ticketId, toEmail }: { ticketId: string; toEmail: string }) => {
      if (!user) throw new Error('User not authenticated');
      await TicketService.transferTicket(ticketId, user.uid, toEmail);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-tickets'] });
      setShowTransferModal(false);
      setTransferEmail("");
      setSelectedTicket(null);
      alert('Ticket transferred successfully! The recipient will receive an email confirmation.');
    },
    onError: (error: any) => {
      alert(`Transfer failed: ${error.message}`);
    },
  });

  // Resend email mutation
  const resendEmailMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      await TicketService.resendTicketEmail(ticketId);
    },
    onSuccess: () => {
      alert('Email sent successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to send email: ${error.message}`);
    },
  });

  // Load all user's tickets (purchased and received)
  const { data: allTickets, isLoading } = useQuery({
    queryKey: ['all-user-tickets', user?.uid, filterType, sortBy, sortOrder],
    queryFn: async () => {
      if (!user) return [];
      
      // Get tickets purchased by user
      const purchasedTickets = await firebase.entities.Ticket.filter({ 
        buyer_id: user.uid 
      });
      
      // Get tickets transferred to user
      const receivedTickets = await firebase.entities.Ticket.filter({ 
        transferred_to: user.uid 
      });
      
      // Combine and mark ticket origin
      const allTickets = [
        ...purchasedTickets.map(ticket => ({ ...ticket, origin: 'purchased' as const })),
        ...receivedTickets.map(ticket => ({ ...ticket, origin: 'received' as const }))
      ];
      
      // Apply filters
      let filteredTickets = allTickets;
      
      switch (filterType) {
        case 'purchased':
          filteredTickets = allTickets.filter(t => t.origin === 'purchased');
          break;
        case 'received':
          filteredTickets = allTickets.filter(t => t.origin === 'received');
          break;
        case 'used':
          filteredTickets = allTickets.filter(t => t.status === 'used');
          break;
        case 'active':
          filteredTickets = allTickets.filter(t => t.status === 'active');
          break;
      }
      
      // Apply search filter
      if (searchQuery) {
        filteredTickets = filteredTickets.filter(ticket => 
          ticket.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.event_location.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply sorting
      filteredTickets.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'date':
            comparison = a.event_date.seconds - b.event_date.seconds;
            break;
          case 'event_name':
            comparison = a.event_title.localeCompare(b.event_title);
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      
      return filteredTickets;
    },
    enabled: !!user,
    initialData: []
  });

  const formatDate = (timestamp: any) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'used': return 'text-gray-600 bg-gray-50';
      case 'transferred': return 'text-blue-600 bg-blue-50';
      case 'refunded': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOriginBadge = (origin: string) => {
    return origin === 'purchased' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-orange-100 text-orange-800';
  };

  const handleViewQR = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  const handleTransferTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowTransferModal(true);
  };

  const handleResendEmail = (ticketId: string) => {
    resendEmailMutation.mutate(ticketId);
  };

  const handleDownloadTicket = (ticket: any) => {
    // Create a downloadable ticket as PDF or image
    const ticketData = `
Event: ${ticket.event_title}
Date: ${formatDate(ticket.event_date)}
Location: ${ticket.event_location}
Ticket Code: ${ticket.ticket_code}
Quantity: ${ticket.quantity}
Total: $${ticket.total_price}
    `.trim();

    const blob = new Blob([ticketData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${ticket.ticket_code}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitTransfer = () => {
    if (!selectedTicket || !transferEmail.trim()) return;
    
    setIsTransferring(true);
    transferTicketMutation.mutate(
      { ticketId: selectedTicket.id, toEmail: transferEmail.trim() },
      {
        onSettled: () => setIsTransferring(false)
      }
    );
  };

  const TicketCard = ({ ticket }: { ticket: any }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOriginBadge(ticket.origin)}`}>
              {ticket.origin === 'purchased' ? 'Purchased' : 'Received'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
          </div>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {ticket.event_title}
          </h3>
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(ticket.event_date)}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            {ticket.event_location}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">
            Qty: {ticket.quantity}
          </div>
          <div className="font-semibold text-lg">
            ${ticket.total_price}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Code: {ticket.ticket_code}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => handleViewQR(ticket)}
            title="View QR Code"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Eye className="h-4 w-4" />
          </button>
          {ticket.status === 'active' && (
            <button 
              onClick={() => handleTransferTicket(ticket)}
              title="Transfer Ticket"
              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
          <button 
            onClick={() => handleResendEmail(ticket.id)}
            title="Resend Email"
            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleDownloadTicket(ticket)}
            title="Download Ticket"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const TicketListItem = ({ ticket }: { ticket: any }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-2 h-16 rounded-full bg-gradient-to-b from-purple-500 to-purple-600"></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOriginBadge(ticket.origin)}`}>
                {ticket.origin === 'purchased' ? 'Purchased' : 'Received'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{ticket.event_title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(ticket.event_date)}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {ticket.event_location}
              </div>
              <div className="flex items-center">
                <Ticket className="h-3 w-3 mr-1" />
                Qty: {ticket.quantity}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-semibold text-lg">${ticket.total_price}</div>
            <div className="text-xs text-gray-500">{ticket.ticket_code}</div>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => handleViewQR(ticket)}
              title="View QR Code"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Eye className="h-4 w-4" />
            </button>
            {ticket.status === 'active' && (
              <button 
                onClick={() => handleTransferTicket(ticket)}
                title="Transfer Ticket"
                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
            <button 
              onClick={() => handleResendEmail(ticket.id)}
              title="Resend Email"
              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleDownloadTicket(ticket)}
              title="Download Ticket"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Please sign in to view your tickets</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
            <p className="text-gray-600 mt-1">Manage all your purchased and received tickets</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by event name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Tickets</option>
              <option value="purchased">Purchased by Me</option>
              <option value="received">Received from Others</option>
              <option value="active">Active Only</option>
              <option value="used">Used Tickets</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort as any);
                setSortOrder(order as any);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="event_name-asc">Event Name (A-Z)</option>
              <option value="event_name-desc">Event Name (Z-A)</option>
              <option value="status-asc">Status (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">
              {allTickets?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Total Tickets</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">
              {allTickets?.filter(t => t.origin === 'purchased').length || 0}
            </div>
            <div className="text-sm text-gray-600">Purchased</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-orange-600">
              {allTickets?.filter(t => t.origin === 'received').length || 0}
            </div>
            <div className="text-sm text-gray-600">Received</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">
              {allTickets?.filter(t => t.status === 'active').length || 0}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>

        {/* Tickets Display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
          </div>
        ) : allTickets?.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Purchase your first event ticket to get started'
              }
            </p>
            <button
              onClick={() => router.push('/events')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {allTickets.map((ticket) => (
              <div key={ticket.id}>
                {viewMode === 'grid' ? (
                  <TicketCard ticket={ticket} />
                ) : (
                  <TicketListItem ticket={ticket} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ticket QR Code</h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">{selectedTicket.event_title}</h3>
              <p className="text-gray-600 mb-4">{formatDate(selectedTicket.event_date)}</p>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                {selectedTicket.qr_code ? (
                  <img 
                    src={selectedTicket.qr_code} 
                    alt="Ticket QR Code" 
                    className="w-48 h-48 mx-auto border border-gray-200 rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">QR Code not available</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Ticket Code:</strong>
                </p>
                <p className="font-mono text-lg font-bold text-blue-900">
                  {selectedTicket.ticket_code}
                </p>
              </div>

              <p className="text-xs text-gray-500 mb-6">
                Present this QR code or ticket code at the event entrance
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTicket.ticket_code);
                    alert('Ticket code copied to clipboard!');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy Code
                </button>
                <button
                  onClick={() => handleDownloadTicket(selectedTicket)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ticket Modal */}
      {showTransferModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Transfer Ticket</h2>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferEmail("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">{selectedTicket.event_title}</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Date:</span>
                  <span>{formatDate(selectedTicket.event_date)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Quantity:</span>
                  <span>{selectedTicket.quantity} ticket{selectedTicket.quantity > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Code:</span>
                  <span className="font-mono">{selectedTicket.ticket_code}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email Address
              </label>
              <input
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isTransferring}
              />
              <p className="text-xs text-gray-500 mt-1">
                The recipient will receive an email with the ticket details and QR code
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Transfer Warning</p>
                  <p>Once transferred, you will no longer have access to this ticket. The transfer cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferEmail("");
                }}
                disabled={isTransferring}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitTransfer}
                disabled={!transferEmail.trim() || isTransferring}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransferring ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Transfer Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
