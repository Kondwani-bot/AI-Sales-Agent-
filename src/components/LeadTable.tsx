import React, { useState, useMemo } from 'react';
import { Lead, LeadPriority, LeadStatus } from '../types';
import { useApp } from '../context/AppContext';
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  CheckCircle2,
  Sparkles,
  Building,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onSelectLead: (leadId: string) => void;
  showCampaignFilter?: boolean;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onSelectLead,
  showCampaignFilter = false,
}) => {
  const { updateLeadStatus, deleteLead, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered and Sorted Leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const matchesSearch =
          lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.decisionMaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.country.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPriority = priorityFilter === 'all' || lead.priorityLevel === priorityFilter;
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

        return matchesSearch && matchesPriority && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return sortOrder === 'desc' ? b.leadScore - a.leadScore : a.leadScore - b.leadScore;
        }
        if (sortBy === 'name') {
          return sortOrder === 'desc'
            ? b.companyName.localeCompare(a.companyName)
            : a.companyName.localeCompare(b.companyName);
        }
        return sortOrder === 'desc'
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [leads, searchTerm, priorityFilter, statusFilter, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = [
      'Company Name',
      'Website',
      'Industry',
      'Location',
      'Country',
      'Lead Score',
      'Priority',
      'Decision Maker Name',
      'Decision Maker Title',
      'Decision Maker Email',
      'Status',
    ];

    const rows = filteredLeads.map((l) => [
      `"${l.companyName}"`,
      `"${l.website}"`,
      `"${l.industry}"`,
      `"${l.location}"`,
      `"${l.country}"`,
      l.leadScore,
      `"${l.priorityLevel}"`,
      `"${l.decisionMaker.name}"`,
      `"${l.decisionMaker.title}"`,
      `"${l.decisionMaker.email}"`,
      `"${l.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Successful', `Exported ${filteredLeads.length} leads to CSV.`, 'success');
  };

  const getPriorityBadge = (priority: LeadPriority) => {
    if (priority === 'High') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          High
        </span>
      );
    }
    if (priority === 'Medium') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Medium
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        Low
      </span>
    );
  };

  const getStatusDropdown = (lead: Lead) => {
    const statuses: LeadStatus[] = [
      'New',
      'Contacted',
      'Interested',
      'Meeting Scheduled',
      'Proposal Sent',
      'Won',
      'Lost',
      'Archived',
    ];

    return (
      <select
        value={lead.status}
        onChange={(e) => {
          e.stopPropagation();
          updateLeadStatus(lead.id, e.target.value as LeadStatus);
        }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
      >
        {statuses.map((st) => (
          <option key={st} value={st}>
            {st}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search company, contact, industry..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Meeting Scheduled">Meeting Scheduled</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => {
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Score {sortOrder === 'desc' ? '↓' : '↑'}</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 text-slate-500 font-semibold border-b border-slate-200/80">
              <th className="py-3 px-4">Company & Website</th>
              <th className="py-3 px-4">Industry & Location</th>
              <th className="py-3 px-4 text-center">Score</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Decision Maker</th>
              <th className="py-3 px-4">Email Draft</th>
              <th className="py-3 px-4">CRM Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Building className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600 text-sm">
                      {leads.length === 0 ? 'No leads generated yet' : 'No leads match your criteria'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {leads.length === 0 ? 'Launch a campaign to start discovering targeted prospects.' : 'Try adjusting your search query or filters.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead.id)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                >
                  {/* Company & Website */}
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase shrink-0">
                        {lead.companyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {lead.companyName}
                        </p>
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 hover:underline truncate"
                        >
                          {lead.website.replace('https://', '').replace('http://', '')}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* Industry & Location */}
                  <td className="py-3.5 px-4 text-slate-600">
                    <p className="font-medium text-slate-800 truncate">{lead.industry}</p>
                    <p className="text-[11px] text-slate-400 truncate">{lead.location}</p>
                  </td>

                  {/* Lead Score Gauge */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">
                      {lead.leadScore}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">{getPriorityBadge(lead.priorityLevel)}</td>

                  {/* Decision Maker */}
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800">{lead.decisionMaker.name}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                      {lead.decisionMaker.title}
                    </p>
                  </td>

                  {/* Email Draft Badge */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>{lead.outreachEmail.isEdited ? 'Edited Draft' : 'AI Drafted'}</span>
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-4">{getStatusDropdown(lead)}</td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectLead(lead.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View Full Profile & Email"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-800">{paginatedLeads.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{filteredLeads.length}</span> leads
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
