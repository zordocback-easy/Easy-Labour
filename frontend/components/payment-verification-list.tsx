"use client"

import { useState } from "react"
import type { Worker } from "@/lib/database"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye, Phone, Mail, MapPin, Calendar, CheckCircle2, XCircle, Loader2, CreditCard, Banknote, Smartphone, Camera } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface PaymentVerificationListProps {
  workers: Worker[]
}

export function PaymentVerificationList({ workers }: PaymentVerificationListProps) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const handleVerifyPayment = async (workerId: string, approved: boolean) => {
    setProcessing(workerId)
    try {
      const response = await fetch("/api/admin/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, approved }),
        credentials: "include",
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to verify payment" }))
        alert(error.error || "Failed to verify payment")
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setProcessing(null)
    }
  }

  const getImageUrl = (path: string | undefined, type: 'profile' | 'payment') => {
    if (!path) return "/placeholder.svg"
    if (path.startsWith('http')) return path
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "https://easy-labour.onrender.com"
    const folder = type === 'profile' ? 'workers' : 'payments'
    return path.startsWith('/') ? `${backend}${path}` : `${backend}/uploads/${folder}/${path}`
  }

  if (workers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border-2 border-dashed rounded-3xl">
        <div className="p-4 bg-blue-50 rounded-full mb-4">
          <CreditCard className="h-10 w-10 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold">No payments pending</h3>
        <p className="text-muted-foreground mt-2">All worker subscription payments have been processed.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6">
        {workers.map((worker) => (
          <Card key={worker.id} className="group border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-background">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row items-center gap-6 p-6">
                {/* Worker Summary */}
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border border-primary/10">
                    <Image
                      src={getImageUrl(worker.profileImage, 'profile')}
                      alt={worker.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-lg truncate uppercase">{worker.name}</h3>
                      <Badge className={cn(
                        "text-[10px] font-bold uppercase",
                        worker.packageType === "premium" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {worker.packageType}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1 capitalize"><MapPin className="h-3 w-3" /> {worker.city}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {worker.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Details info */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 w-full lg:w-48 p-4 bg-muted/30 rounded-2xl lg:bg-transparent lg:p-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Amount Paid</span>
                    <span className="text-xl font-black text-primary">
                      Rs {(worker as any).paymentMeta?.amount?.toLocaleString() || (worker.packageType === 'premium' ? '7,000' : worker.packageType === 'standard' ? '3,000' : '2,000')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Method</span>
                    <div className="flex items-center gap-1 font-bold text-sm">
                      {worker.paymentMethod === 'bank' ? <Banknote className="h-4 w-4 text-blue-500" /> : <Smartphone className="h-4 w-4 text-green-500" />}
                      <span className="capitalize">{worker.paymentMethod || 'Manual'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 lg:flex-none font-bold rounded-xl border-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300 gap-2 px-6"
                    onClick={() => setSelectedWorker(worker)}
                  >
                    <Eye className="h-4 w-4" />
                    Proof
                  </Button>
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100 flex-1 lg:flex-none"
                    onClick={() => handleVerifyPayment(worker.id, true)}
                    disabled={!!processing}
                  >
                    {processing === worker.id ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="font-bold rounded-xl shadow-lg shadow-red-100 flex-1 lg:flex-none"
                    onClick={() => handleVerifyPayment(worker.id, false)}
                    disabled={!!processing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedWorker} onOpenChange={() => setSelectedWorker(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          {/* High Visibility Close Button */}
          <div className="absolute top-4 right-4 z-[60]">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/20 transition-all active:scale-95"
              onClick={() => setSelectedWorker(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <DialogHeader className="p-6 bg-slate-900 text-white">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Payment Verification</DialogTitle>
                <DialogDescription className="text-slate-400">Review the transaction details provided by {selectedWorker?.name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selected Plan</span>
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="font-black text-primary capitalize">{selectedWorker?.packageType} Package</p>
                  <p className="text-xs font-bold text-muted-foreground">30 Days Validity</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transfer Details</span>
                <div className="p-4 bg-muted/30 rounded-2xl border border-muted-foreground/10">
                  <p className="font-black capitalize">{selectedWorker?.paymentMethod || 'Manual'}</p>
                  <p className="text-xs font-bold text-muted-foreground">Via {selectedWorker?.paymentMethod === 'bank' ? 'Bank Transfer' : 'Mobile Wallet'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account/Phone</span>
                <div className="p-4 bg-muted/30 rounded-2xl border border-muted-foreground/10">
                  <p className="font-black">{selectedWorker?.phoneNumber || selectedWorker?.accountNumber || 'N/A'}</p>
                  <p className="text-xs font-bold text-muted-foreground">Sender Representative</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                <h4 className="font-black text-sm uppercase tracking-wider">Transaction Proof (Screenshot)</h4>
              </div>
              {selectedWorker?.paymentProof ? (
                <div className="group border-2 border-dashed rounded-3xl p-3 bg-muted/10 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-zoom-in overflow-hidden shadow-inner">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border bg-background shadow-2xl">
                    <Image
                      src={getImageUrl(selectedWorker.paymentProof, 'payment')}
                      alt="Payment Proof"
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-700"
                      unoptimized
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-red-500/20 text-red-500">
                  <Camera className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="font-bold">No receipt image found</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/30 border-t gap-4">
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleVerifyPayment(selectedWorker!.id, false)}
              disabled={!!processing}
              className="flex-1 h-14 rounded-2xl border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold transition-all"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject Payment
            </Button>
            <Button
              size="lg"
              onClick={() => handleVerifyPayment(selectedWorker!.id, true)}
              disabled={!!processing}
              className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-xl shadow-green-100"
            >
              {processing === selectedWorker?.id ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
              Approve & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
