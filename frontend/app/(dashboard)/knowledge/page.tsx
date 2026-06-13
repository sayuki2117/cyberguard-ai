'use client'

import React, { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, Link, Trash2, BookOpen, Youtube, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import type { KnowledgeSource } from '@/types'

const SOURCE_ICONS: Record<KnowledgeSource['source_type'], string> = {
  pdf: '📄',
  docx: '📝',
  txt: '📃',
  md: '📋',
  url: '🌐',
  youtube: '▶️',
}

export default function KnowledgePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isAdmin = user?.role === 'admin'

  const [fileTitle, setFileTitle] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlTitle, setUrlTitle] = useState('')

  const { data: sources = [], isLoading } = useQuery<KnowledgeSource[]>({
    queryKey: ['knowledge-sources'],
    queryFn: async () => {
      const { data } = await api.get('/knowledge/sources')
      return data
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('title', fileTitle || file.name)
      const { data } = await api.post('/knowledge/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      setFileTitle('')
      qc.invalidateQueries({ queryKey: ['knowledge-sources'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Upload failed.'),
  })

  const urlMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/knowledge/ingest-url', {
        url: urlInput,
        title: urlTitle,
      })
      return data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      setUrlInput('')
      setUrlTitle('')
      qc.invalidateQueries({ queryKey: ['knowledge-sources'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Ingestion failed.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/knowledge/sources/${id}`)
    },
    onSuccess: () => {
      toast.success('Source deleted.')
      qc.invalidateQueries({ queryKey: ['knowledge-sources'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Delete failed.'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!fileTitle) setFileTitle(file.name.replace(/\.[^.]+$/, ''))
    uploadMutation.mutate(file)
  }

  const isYouTube = urlInput.includes('youtube.com') || urlInput.includes('youtu.be')

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#1e2d4a] bg-[#0f1729] p-8">
        <div className="mb-4 flex items-center gap-3 text-2xl font-semibold text-white">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-cyan-600 text-white">
            <BookOpen className="h-6 w-6" />
          </span>
          <span>Knowledge Base</span>
        </div>

        <div className="space-y-2 text-gray-300">
          <p className="text-3xl font-bold text-white">Knowledge Base</p>
          <p className="max-w-2xl text-sm leading-7">
            Documents and URLs the AI uses to answer questions accurately via RAG.
            {!isAdmin && ' Contact an admin to add new sources.'}
          </p>
        </div>
      </div>

      {isAdmin && (
        <Card className="rounded-3xl border border-[#1e2d4a] bg-[#0a0e1a]">
          <CardContent className="space-y-6 p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Admin upload panel
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Add documents, URLs, or YouTube sources for the AI to index.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">PDF</Badge>
                <Badge variant="secondary">DOCX</Badge>
                <Badge variant="secondary">URL</Badge>
                <Badge variant="secondary">YouTube</Badge>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-3xl border border-[#1e2d4a] bg-[#07101e] p-6">
                <div className="flex items-center gap-3 text-lg font-semibold text-white">
                  <Upload className="h-5 w-5" />
                  <span>Upload Document</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="document-title">Document Title</Label>
                    <Input
                      id="document-title"
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      placeholder="e.g. Security Policy 2024"
                      className="mt-1 bg-[#0a0e1a] border-[#1e2d4a] text-white text-sm"
                    />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-sm"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : '📁 Choose File (PDF/DOCX/TXT/MD)'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-[#1e2d4a] bg-[#07101e] p-6">
                <div className="flex items-center gap-3 text-lg font-semibold text-white">
                  {isYouTube ? <Youtube className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                  <span>{isYouTube ? 'YouTube Video' : 'Website URL'}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="source-title">Title</Label>
                    <Input
                      id="source-title"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      placeholder="e.g. NIST Cybersecurity Framework"
                      className="mt-1 bg-[#0a0e1a] border-[#1e2d4a] text-white text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="source-url">URL or YouTube Link</Label>
                    <Input
                      id="source-url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://... or https://youtube.com/watch?v=..."
                      className="mt-1 bg-[#0a0e1a] border-[#1e2d4a] text-white text-sm font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => urlMutation.mutate()}
                    disabled={urlMutation.isPending || !urlInput || !urlTitle}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-sm disabled:opacity-40"
                  >
                    {urlMutation.isPending
                      ? 'Processing...'
                      : isYouTube
                      ? '▶️ Ingest YouTube Transcript'
                      : '🌐 Ingest Website'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border border-[#1e2d4a] bg-[#0a0e1a]">
        <CardContent className="space-y-6 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Source library
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Browse and manage the documents and URLs that power AI answers.
              </p>
            </div>
            <Badge className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
              {sources.length} sources
            </Badge>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              [1, 2, 3].map((index) => (
                <div key={index} className="animate-pulse rounded-3xl border border-[#1e2d4a] bg-[#07101e] p-6">
                  <div className="h-4 w-1/3 rounded-full bg-slate-700" />
                  <div className="mt-4 space-y-3">
                    <div className="h-3 w-full rounded-full bg-slate-700" />
                    <div className="h-3 w-5/6 rounded-full bg-slate-700" />
                  </div>
                </div>
              ))
            ) : sources.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#1e2d4a] bg-[#07101e] p-8 text-center text-gray-400">
                <p className="text-lg font-semibold text-white">No knowledge sources yet.</p>
                <p className="mt-2 text-sm text-gray-400">
                  {isAdmin ? 'Upload documents or add URLs above.' : 'Contact an admin to add sources.'}
                </p>
              </div>
            ) : (
              sources.map((source) => (
                <div key={source.id} className="rounded-3xl border border-[#1e2d4a] bg-[#08131f] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-2xl">
                        {SOURCE_ICONS[source.source_type] || '📄'}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{source.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <Badge className="rounded-full bg-[#111827] px-2 py-1 text-xs uppercase tracking-[0.15em] text-gray-300">
                            {source.source_type.toUpperCase()}
                          </Badge>
                          <span>{source.is_indexed ? `✓ ${source.chunk_count} chunks` : '⏳ Indexing...'}</span>
                          <span>{new Date(source.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(source.id)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {source.source_url && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-cyan-300">
                      <Link className="h-4 w-4" />
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-cyan-300 hover:text-cyan-200"
                      >
                        {source.source_url}
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
