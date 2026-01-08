'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onUploadComplete: (url: string, fileName: string) => void;
  ticketId?: string;
  orgId?: string;
  disabled?: boolean;
}

export default function ImageUpload({ onUploadComplete, ticketId, orgId, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = ticketId ? `tickets/${ticketId}/${fileName}` : `temp/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('ticket-evidence')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        // Provide helpful error messages
        if (error.message.includes('Bucket') || error.message.includes('not found')) {
          throw new Error('Storage bucket not found. Please create a bucket named "ticket-evidence" in Supabase Storage settings.');
        }
        if (error.message.includes('row-level security') || error.message.includes('RLS')) {
          throw new Error('Storage permissions not configured. Please run the migration file: supabase/migrations/005_setup_ticket_evidence_storage.sql');
        }
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ticket-evidence')
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      onUploadComplete(urlData.publicUrl, file.name);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete, ticketId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, isUploading, handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <div>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
          ${isDragging 
            ? 'border-[#5ea0ff] bg-[rgba(94,160,255,0.1)]' 
            : 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(94,160,255,0.3)] hover:bg-[rgba(255,255,255,0.04)]'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-[#5ea0ff] animate-spin" />
            <p className="text-sm text-[#9eacc2]">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8 text-[#5ea0ff]" />
            <div>
              <p className="text-sm text-[#d6dbe5] font-medium">
                {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-[#9eacc2] mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mt-2 p-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded text-sm text-red-300">
          {uploadError}
        </div>
      )}
    </div>
  );
}
