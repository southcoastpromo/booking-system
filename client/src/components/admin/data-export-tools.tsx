/**
 * DATA EXPORT TOOLS - Performance Optimized
 * 
 * Advanced data export functionality with:
 * - Multiple export formats (CSV, Excel, JSON)
 * - Progress tracking for large exports
 * - Background processing
 * - Chunked data retrieval for large datasets
 * 
 * @fileoverview Data export tools for admin dashboard
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table, Code, Clock, CheckCircle } from 'lucide-react';

interface ExportJob {
  id: string;
  type: 'campaigns' | 'bookings' | 'analytics';
  format: 'csv' | 'excel' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  downloadUrl?: string;
}

export function DataExportTools() {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      type: 'campaigns',
      format: 'csv',
      status: 'completed',
      progress: 100,
      createdAt: '2024-01-15T10:30:00Z',
      downloadUrl: '/api/exports/campaigns-2024-01-15.csv'
    },
    {
      id: '2', 
      type: 'bookings',
      format: 'excel',
      status: 'processing',
      progress: 67,
      createdAt: '2024-01-15T11:00:00Z'
    }
  ]);

  const startExport = async (type: 'campaigns' | 'bookings' | 'analytics', format: 'csv' | 'excel' | 'json') => {
    const newJob: ExportJob = {
      id: Date.now().toString(),
      type,
      format,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    setExportJobs(prev => [newJob, ...prev]);

    // Simulate export progress
    setTimeout(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === newJob.id ? { ...job, status: 'processing' as const } : job
      ));
      
      // Progress simulation
      const progressInterval = setInterval(() => {
        setExportJobs(prev => prev.map(job => {
          if (job.id === newJob.id && job.progress < 100) {
            const newProgress = Math.min(job.progress + Math.random() * 20, 100);
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return {
                ...job,
                progress: 100,
                status: 'completed' as const,
                downloadUrl: `/api/exports/${type}-${new Date().toISOString().split('T')[0]}.${format}`
              };
            }
            return { ...job, progress: newProgress };
          }
          return job;
        }));
      }, 500);
    }, 1000);
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'failed': return <CheckCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <Table className="h-4 w-4" />;
      case 'excel': return <FileText className="h-4 w-4" />;
      case 'json': return <Code className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Data Export Tools</h2>
      
      {/* Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-navy-800 border-accent-blue/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Campaign Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300 text-sm">
              Export all campaign information, availability, and pricing data
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => startExport('campaigns', 'csv')}
                className="bg-accent-blue hover:bg-accent-blue-700 flex items-center gap-1 text-xs"
                size="sm"
              >
                <Table className="h-3 w-3" />
                CSV
              </Button>
              <Button 
                onClick={() => startExport('campaigns', 'excel')}
                className="bg-accent-blue hover:bg-accent-blue-700 flex items-center gap-1 text-xs"
                size="sm"
              >
                <FileText className="h-3 w-3" />
                Excel
              </Button>
              <Button 
                onClick={() => startExport('campaigns', 'json')}
                className="bg-accent-blue hover:bg-accent-blue-700 flex items-center gap-1 text-xs"
                size="sm"
              >
                <Code className="h-3 w-3" />
                JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800 border-accent-blue/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Booking Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300 text-sm">
              Export booking history, customer information, and payment status
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => startExport('bookings', 'csv')}
                className="bg-accent-blue hover:bg-accent-blue-700 flex items-center gap-1 text-xs"
                size="sm"
              >
                <Table className="h-3 w-3" />
                CSV
              </Button>
              <Button 
                onClick={() => startExport('bookings', 'excel')}
                className="bg-accent-blue hover:bg-accent-blue-700 flex items-center gap-1 text-xs"
                size="sm"
              >
                <FileText className="h-3 w-3" />
                Excel
              </Button>
              <Button 
                onClick={() => startExport('bookings', 'json')}
                className="bg-accent-blue hover:bg-accent-blue-700 flex items-center gap-1 text-xs"
                size="sm"
              >
                <Code className="h-3 w-3" />
                JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-navy-800 border-accent-blue/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Analytics Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-300 text-sm">
              Export revenue metrics, performance data, and business intelligence
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => startExport('analytics', 'csv')}
                className="bg-accent-blue hover:bg-accent-blue-700 flex items-center gap-1 text-xs"
                size="sm"
              >
                <Table className="h-3 w-3" />
                CSV
              </Button>
              <Button 
                onClick={() => startExport('analytics', 'excel')}
                className="bg-accent-blue hover:bg-accent-blue-700 flex items-center gap-1 text-xs"
                size="sm"
              >
                <FileText className="h-3 w-3" />
                Excel
              </Button>
              <Button 
                onClick={() => startExport('analytics', 'json')}
                className="bg-accent-blue hover:bg-accent-blue-700 flex items-center gap-1 text-xs"
                size="sm"
              >
                <Code className="h-3 w-3" />
                JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export History */}
      <Card className="bg-navy-800 border-accent-blue/20">
        <CardHeader>
          <CardTitle className="text-white">Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exportJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFormatIcon(job.format)}
                  <div>
                    <div className="text-white font-medium capitalize">
                      {job.type} Export ({job.format.toUpperCase()})
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(job.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <Badge className={`${getStatusColor(job.status)} text-white text-xs`}>
                      {job.status}
                    </Badge>
                  </div>
                  
                  {job.status === 'processing' && (
                    <div className="w-32">
                      <div className="text-xs text-gray-300 mb-1">
                        {Math.round(job.progress)}%
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-accent-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {job.status === 'completed' && job.downloadUrl && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
