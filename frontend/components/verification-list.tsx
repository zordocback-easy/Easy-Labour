"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Worker } from "@/lib/database"
import {
  MapPin, Phone, Mail, CheckCircle, XCircle, Eye,
  TrendingUp, Shield, FileText, Camera, User,
  Calendar, Briefcase, Globe, Info, Search, X, Loader2
} from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function VerificationList({ workers }: { workers: Worker[] }) {
  const [localWorkers, setLocalWorkers] = useState(workers)
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)

  const handleVerify = async (workerId: string, approved: boolean) => {
    setLoading(workerId)

    try {
      const response = await fetch("/api/admin/verify-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, approved }),
        credentials: "include",
      })

      if (response.ok) {
        setLocalWorkers((prev) => prev.filter((w) => w.id !== workerId))
        setSelectedWorker(null)
        // Refresh to update dashboard states
      } else {
        alert("Failed to verify worker. Please try again.")
      }
    } catch (error) {
      console.error("Verification error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  const getImageUrl = (path: string | undefined) => {
    if (!path) return "/placeholder.svg"
    if (path.startsWith('http')) return path
    if (path.startsWith('data:')) return path
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "https://easy-labour.onrender.com"
    return path.startsWith('/') ? `${backend}${path}` : `${backend}/uploads/workers/${path}`
  }

  if (localWorkers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
        <div className="p-4 bg-green-50 rounded-full mb-4">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h3 className="text-xl font-bold">All caught up!</h3>
        <p className="text-muted-foreground mt-2">No pending worker verifications at the moment.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {localWorkers.map((worker) => (
        <Card key={worker.id} className="group border-none shadow-sm hover:shadow-md transition-all overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4">
              <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-primary/5 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-inner border border-primary/10">
                <Image
                  src={getImageUrl(worker.profileImage)}
                  alt={worker.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-black tracking-tight uppercase group-hover:text-primary transition-colors">{worker.name}</h3>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-0.5 rounded-full capitalize">
                    {worker.category}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-500" />
                    <span>{worker.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                    <span className="capitalize">{worker.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-amber-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{worker.experience} yrs EXP</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto font-bold rounded-xl border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300 gap-2"
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <Eye className="h-4 w-4" />
                      Review Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    {/* High Visibility Close Button */}
                    <div className="absolute top-4 right-4 z-[60]">
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/20 transition-all active:scale-95">
                          <X className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                    </div>

                    <div className="max-h-[85vh] overflow-y-auto scrollbar-hide">
                      {/* Header / Banner */}
                      <div className="h-32 bg-gradient-to-r from-primary/90 to-primary relative z-10 mb-12">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] shadow-inner" />
                        <div className="absolute -bottom-12 left-8 transition-transform hover:scale-105 duration-500">
                          <div className="relative h-32 w-32 rounded-3xl border-4 border-background bg-background shadow-2xl overflow-hidden ring-4 ring-white/20">
                            <Image
                              src={getImageUrl(selectedWorker?.profileImage)}
                              alt="Profile"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 px-8 pb-8 space-y-8">
                        {/* Name & Basic Info */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                          <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tight">{selectedWorker?.name}</h2>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1 text-xs font-bold uppercase tracking-wider">{selectedWorker?.category}</Badge>
                              <span className="text-sm font-medium flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-red-500" />
                                <span className="capitalize">{Array.isArray(selectedWorker?.locality) ? selectedWorker?.locality.join(", ") : selectedWorker?.locality}, {selectedWorker?.city}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Contact info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-muted/30 p-6 rounded-3xl border border-muted-foreground/10">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone</span>
                            <div className="flex items-center gap-2 font-bold text-sm">
                              <Phone className="h-4 w-4 text-primary" />
                              {selectedWorker?.phone}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</span>
                            <div className="flex items-center gap-2 font-bold text-sm truncate">
                              <Mail className="h-4 w-4 text-primary" />
                              {selectedWorker?.email}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Experience</span>
                            <div className="flex items-center gap-2 font-bold text-sm">
                              <Briefcase className="h-4 w-4 text-primary" />
                              {selectedWorker?.experience} Years
                            </div>
                          </div>
                        </div>

                        {/* About Section */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                            <h4 className="font-black text-sm uppercase tracking-wider">About & Bio</h4>
                          </div>
                          <div className="bg-background border rounded-2xl p-5 text-sm text-balance leading-relaxed text-muted-foreground italic">
                            "{selectedWorker?.about}"
                          </div>
                        </div>

                        {/* Skills Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                            <h4 className="font-black text-sm uppercase tracking-wider">Specialized Skills</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(selectedWorker?.skills) ? (
                              selectedWorker?.skills.map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-tighter shadow-sm border-none bg-primary/5 text-primary">
                                  {skill}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No specific skills listed.</span>
                            )}
                          </div>
                        </div>

                        {/* Verification Documents */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                          {/* CNIC Documents */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                CNIC Documents
                              </h4>
                              <Badge variant="outline" className="font-mono text-[10px] tracking-widest">{selectedWorker?.cnicNumber}</Badge>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              {selectedWorker?.cnicImages?.map((img, idx) => (
                                <div key={idx} className="group/doc border-2 border-dashed rounded-2xl p-2 bg-muted/10 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-zoom-in">
                                  <div className="relative aspect-video rounded-xl overflow-hidden border bg-background shadow-inner">
                                    <Image src={getImageUrl(img)} alt={`CNIC ${idx}`} fill className="object-contain" unoptimized />
                                  </div>
                                  <p className="text-[10px] text-center mt-2 font-bold text-muted-foreground uppercase">{idx === 0 ? "Front View" : "Back View"}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Live Verification */}
                          <div className="space-y-4">
                            <h4 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                              <Camera className="h-4 w-4 text-primary" />
                              Live Verification
                            </h4>
                            {selectedWorker?.selfieImage ? (
                              <div className="group/selfie border-2 border-dashed rounded-3xl p-3 bg-muted/10 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-zoom-in overflow-hidden">
                                <div className="relative aspect-[3/4] max-w-[280px] mx-auto rounded-2xl overflow-hidden border shadow-2xl ring-4 ring-white/50">
                                  <Image
                                    src={getImageUrl(selectedWorker?.selfieImage)}
                                    alt="Live Selfie"
                                    fill
                                    className="object-cover group-hover/selfie:scale-110 transition-transform duration-700"
                                    unoptimized
                                  />
                                </div>
                                <p className="text-[10px] text-center mt-4 font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  Live Biometric Capture
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-3xl border-2 border-dashed border-red-500/20 text-red-500">
                                <User className="h-10 w-10 mb-2 opacity-50" />
                                <span className="text-sm font-bold">No selfie available</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="sticky bottom-0 bg-background border-t p-6 gap-4 mt-0 z-50">
                      <Button
                        onClick={() => handleVerify(selectedWorker!.id, false)}
                        disabled={loading === selectedWorker?.id}
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold transition-all shadow-lg active:scale-95"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Reject Profile
                      </Button>
                      <Button
                        onClick={() => handleVerify(selectedWorker!.id, true)}
                        disabled={loading === selectedWorker?.id}
                        className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-xl shadow-green-200 active:scale-95"
                      >
                        {loading === selectedWorker?.id ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        )}
                        Approve Access
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="default"
                    size="icon"
                    className="bg-green-600 hover:bg-green-700 text-white h-11 w-11 rounded-xl shadow-lg shadow-green-200"
                    onClick={() => handleVerify(worker.id, true)}
                    disabled={loading === worker.id}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-11 w-11 rounded-xl shadow-lg shadow-red-200"
                    onClick={() => handleVerify(worker.id, false)}
                    disabled={loading === worker.id}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

