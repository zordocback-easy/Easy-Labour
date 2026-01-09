"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import type { Worker } from "@/lib/database"
import { categories, cities } from "@/lib/database"
import {
  MapPin, Phone, Eye, MousePointerClick, Search,
  Calendar, AlertCircle, User, Mail, Shield,
  Trash2, Briefcase, TrendingUp, Star, MoreVertical, X
} from "lucide-react"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function WorkersOverview({ workers }: { workers: Worker[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCity, setFilterCity] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCity = filterCity === "all" || worker.city === filterCity
    const matchesCategory = filterCategory === "all" || worker.category === filterCategory
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "verified" && worker.isVerified) ||
      (filterStatus === "unverified" && !worker.isVerified)

    return matchesSearch && matchesCity && matchesCategory && matchesStatus
  })

  function isPackageExpired(worker: Worker): boolean {
    if (!worker.packageExpiry) return false
    return new Date(worker.packageExpiry) < new Date()
  }

  function getDaysUntilExpiry(worker: Worker): number {
    if (!worker.packageExpiry) return 0
    const diff = new Date(worker.packageExpiry).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getImageUrl = (path: string | undefined) => {
    if (!path) return "/placeholder.svg"
    if (path.startsWith('http')) return path
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "https://easy-labour.onrender.com"
    return path.startsWith('/') ? `${backend}${path}` : `${backend}/uploads/workers/${path}`
  }

  return (
    <div className="space-y-8">
      {/* Search & Filters Section */}
      <Card className="border-none shadow-sm bg-muted/20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-none bg-background shadow-sm rounded-xl focus-visible:ring-primary"
            />
          </div>

          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="border-none bg-background shadow-sm rounded-xl h-10">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="border-none bg-background shadow-sm rounded-xl h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
            <SelectTrigger className="border-none bg-background shadow-sm rounded-xl h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
              <SelectItem value="unverified">Unverified Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm font-medium text-muted-foreground">
          Showing <span className="text-foreground font-black">{filteredWorkers.length}</span> of {workers.length} active workers
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredWorkers.map((worker) => {
          const expired = isPackageExpired(worker)
          const daysLeft = getDaysUntilExpiry(worker)

          return (
            <Card key={worker.id} className="group border-none shadow-sm hover:shadow-lg transition-all overflow-hidden bg-background border border-muted-foreground/5">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center gap-6 p-5">
                  {/* Avatar */}
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-inner border border-primary/5">
                    <Image
                      src={getImageUrl(worker.profileImage)}
                      alt={worker.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      unoptimized
                    />
                    {worker.isVerified && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5 shadow-lg border border-white ring-2 ring-green-500/20">
                        <Shield className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h3 className="text-xl font-black uppercase tracking-tight">{worker.name}</h3>
                      <div className="flex gap-1.5 flex-wrap justify-center">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 rounded-full font-bold uppercase text-[10px] px-3">
                          {worker.category}
                        </Badge>
                        {worker.packageType && (
                          <Badge className={cn(
                            "rounded-full font-black uppercase text-[10px] px-3",
                            worker.packageType === "premium" ? "bg-amber-100 text-amber-600 border-amber-200" : "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                            {worker.packageType}
                          </Badge>
                        )}
                        {expired && (
                          <Badge variant="destructive" className="rounded-full font-bold text-[10px] px-3 animate-pulse">
                            EXPIRED
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-muted-foreground">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                        <span className="capitalize">{worker.city}</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>Joined {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <Eye className="h-3.5 w-3.5 text-green-500" />
                        <span>{worker.profileViews} Views</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <MousePointerClick className="h-3.5 w-3.5 text-orange-500" />
                        <span>{worker.contactClicks} Leads</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1 md:flex-none font-bold rounded-xl gap-2 border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                        {/* High Visibility Close Button */}
                        <div className="absolute top-4 right-4 z-[60]">
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/20 transition-all active:scale-95">
                              <X className="h-5 w-5" />
                            </Button>
                          </DialogTrigger>
                        </div>

                        {/* Detailed View logic - similar to VerificationList but focused on stats/management */}
                        <div className="max-h-[85vh] overflow-y-auto pt-0 pb-8 px-8">
                          <div className="h-32 -mx-8 bg-gradient-to-r from-slate-900 to-slate-800 relative mb-16 z-10">
                            <div className="absolute -bottom-12 left-8 transition-transform hover:scale-105 duration-500">
                              <div className="relative h-32 w-32 rounded-3xl border-4 border-background bg-background shadow-2xl overflow-hidden shadow-primary/20">
                                <Image
                                  src={getImageUrl(worker.profileImage)}
                                  alt="Profile"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                              <div className="space-y-1">
                                <h2 className="text-3xl font-black uppercase tracking-tight">{worker.name}</h2>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-primary/10 text-primary border-none">{worker.category}</Badge>
                                  {worker.isVerified && <Badge className="bg-green-100 text-green-600 border-none">Verified Provider</Badge>}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Status</p>
                                <span className={cn(
                                  "text-sm font-black",
                                  worker.isVerified ? "text-green-500" : "text-amber-500"
                                )}>{worker.isVerified ? "ACTIVATED" : "PENDING APPROVAL"}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                                <Eye className="h-5 w-5 text-primary mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Profile Views</p>
                                <p className="text-xl font-black">{worker.profileViews || 0}</p>
                              </div>
                              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-center">
                                <MousePointerClick className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Leads Generated</p>
                                <p className="text-xl font-black">{worker.contactClicks || 0}</p>
                              </div>
                              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                                <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Days Active</p>
                                <p className="text-xl font-black">{worker.createdAt ? Math.floor((Date.now() - new Date(worker.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}</p>
                              </div>
                            </div>

                            <div className="bg-muted/30 p-6 rounded-3xl space-y-4">
                              <h4 className="font-black text-sm uppercase tracking-tight">Technical Profile</h4>
                              <div className="grid grid-cols-2 gap-6 text-sm">
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground font-bold">Base City</span>
                                  <p className="font-bold flex items-center gap-1 capitalize"><MapPin className="h-3 w-3" /> {worker.city}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground font-bold">Email</span>
                                  <p className="font-bold flex items-center gap-1"><Mail className="h-3 w-3" /> {worker.email}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground font-bold">Member Since</span>
                                  <p className="font-bold flex items-center gap-1"><Calendar className="h-3 w-3" /> {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground font-bold">Subscription</span>
                                  <p className="font-bold flex items-center gap-1 capitalize"><Briefcase className="h-3 w-3" /> {worker.packageType || "Demo"}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t">
                              <a href={`/worker/${worker.id}`} className="flex-1" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-2">
                                  View Public Website Profile
                                </Button>
                              </a>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-11 w-11 rounded-xl shadow-xl shadow-red-100"
                      onClick={async () => {
                        if (confirm(`CRITICAL: Are you sure you want to PERMANENTLY delete worker ${worker.name}? This action cannot be undone.`)) {
                          try {
                            const res = await fetch(`/api/admin/workers/${worker.id}`, { method: 'DELETE' });
                            const data = await res.json();
                            if (data.success) {
                              router.refresh();
                            } else {
                              alert(data.error || 'Failed to delete user');
                            }
                          } catch (error) {
                            alert('An error occurred');
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredWorkers.length === 0 && (
        <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-3xl">
          <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold">No results found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  )
}
