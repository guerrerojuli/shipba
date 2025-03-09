"use client"

import { useEffect } from "react"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SuccessPage() {
  useEffect(() => {
    // Guardar estado pro en localStorage
    localStorage.setItem("userSubscription", "pro")
  }, [])

  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16 md:py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Subscription Successful!</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Thank you for subscribing to Note Editor Pro. Your payment has been processed successfully.
        </p>
      </div>

      <Card className="mt-8 w-full max-w-md">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>You now have full access to all Note Editor Pro features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-medium">Your subscription details:</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Plan:</div>
              <div>Note Editor Pro Subscription</div>
              <div className="text-muted-foreground">Billing cycle:</div>
              <div>Monthly</div>
              <div className="text-muted-foreground">Next billing date:</div>
              <div>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Get started with these steps:</h3>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>Access all your documents in your dashboard</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" asChild>
            <Link href="/">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>


      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  )
}

