'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Activity,
  Download,
  Filter,
  Plus,
  Search,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react';
import Link from 'next/link';
import { useVitals } from '@/hooks/useVitals';
import { exportToCSV, formatVitalsForExport } from '@/lib/export-utils';
import { toast } from 'sonner';

export default function VitalsPage() {
  const { fetchAllVitals } = useVitals();
  const [vitals, setVitals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('recordedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedVitals, setSelectedVitals] = useState<string[]>([]);

  useEffect(() => {
    loadVitals();
  }, [currentPage]);

  const loadVitals = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAllVitals(currentPage, 10);
      setVitals(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading vitals:', error);
      toast.error('Failed to load vitals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectVital = (id: string) => {
    setSelectedVitals(prev => 
      prev.includes(id) 
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVitals.length === vitals.length) {
      setSelectedVitals([]);
    } else {
      setSelectedVitals(vitals.map(v => v.id));
    }
  };

  const handleExport = () => {
    const dataToExport = selectedVitals.length > 0
      ? vitals.filter(v => selectedVitals.includes(v.id))
      : vitals;
    
    const formattedData = formatVitalsForExport(dataToExport);
    exportToCSV(formattedData, `health-vitals-${new Date().toISOString().split('T')[0]}`);
    toast.success('Data exported successfully!');
  };

  const handleDelete = async (id: string) => {
    // This would call a delete API endpoint
    toast.info('Delete functionality would be implemented here');
  };

  const filteredVitals = vitals.filter(vital => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      vital.notes?.toLowerCase().includes(searchLower) ||
      vital.symptoms?.toLowerCase().includes(searchLower) ||
      new Date(vital.recordedAt).toLocaleDateString().includes(searchTerm)
    );
  });

  const sortedVitals = [...filteredVitals].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (isLoading && vitals.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vitals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Health Vitals</h1>
          <p className="text-muted-foreground mt-1">View and manage all your health records</p>
        </div>
        <Link href="/dashboard/scan">
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="h-4 w-4" />
            New Scan
          </Button>
        </Link>
      </div>

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by date, notes, or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExport}
              disabled={vitals.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {selectedVitals.length > 0 && (
          <div className="mt-4 flex items-center gap-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <span className="text-sm font-medium">
              {selectedVitals.length} item{selectedVitals.length > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVitals([])}
            >
              Clear selection
            </Button>
          </div>
        )}
      </Card>

      {/* Vitals Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedVitals.length === vitals.length && vitals.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th 
                  className="p-4 text-left font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => handleSort('recordedAt')}
                >
                  <div className="flex items-center gap-2">
                    Date/Time
                    {sortField === 'recordedAt' && (
                      sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-left font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => handleSort('bloodPressureSystolic')}
                >
                  <div className="flex items-center gap-2">
                    Blood Pressure
                    {sortField === 'bloodPressureSystolic' && (
                      sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-left font-medium cursor-pointer hover:bg-muted/80"
                  onClick={() => handleSort('heartRate')}
                >
                  <div className="flex items-center gap-2">
                    Heart Rate
                    {sortField === 'heartRate' && (
                      sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-left font-medium">Temperature</th>
                <th className="p-4 text-left font-medium">O2 Saturation</th>
                <th className="p-4 text-left font-medium">Notes</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedVitals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No vitals recorded yet. Start by adding your first scan.
                  </td>
                </tr>
              ) : (
                sortedVitals.map((vital) => (
                  <tr key={vital.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedVitals.includes(vital.id)}
                        onChange={() => handleSelectVital(vital.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">
                          {new Date(vital.recordedAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(vital.recordedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {vital.bloodPressureSystolic && vital.bloodPressureDiastolic ? (
                        <span className="font-medium">
                          {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                          <span className="text-xs text-muted-foreground ml-1">mmHg</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {vital.heartRate ? (
                        <span className="font-medium">
                          {vital.heartRate}
                          <span className="text-xs text-muted-foreground ml-1">bpm</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {vital.temperature ? (
                        <span className="font-medium">
                          {vital.temperature}
                          <span className="text-xs text-muted-foreground ml-1">°C</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {vital.oxygenSaturation ? (
                        <span className="font-medium">
                          {vital.oxygenSaturation}
                          <span className="text-xs text-muted-foreground ml-1">%</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {vital.notes || vital.symptoms ? (
                        <p className="text-sm truncate max-w-xs" title={vital.notes || vital.symptoms}>
                          {vital.notes || vital.symptoms}
                        </p>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(vital.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}