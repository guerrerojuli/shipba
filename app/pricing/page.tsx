"use client"

import { Check } from "lucide-react"
import Link from "next/link"
import { loadStripe } from '@stripe/stripe-js';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Continue using Note Editor</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Your trial period has ended. Subscribe now to continue using all features of our Note Editor.
        </p>
      </div>

      <div className="mt-12">
        <Tabs defaultValue="monthly" className="mx-auto max-w-md">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly" className="mt-8">
            <PricingCard
              price="$12"
              description="Full access to all MarkdownPro features"
              features={[
                "Unlimited documents",
              ]}
              buttonText="Subscribe Now"
              buttonVariant="default"
            />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  )
}

interface PricingCardProps {
  price: string
  period?: string
  description: string
  features: string[]
  buttonText: string
  buttonVariant: "default" | "outline"
}

function PricingCard({ price, period = "month", description, features, buttonText, buttonVariant }: PricingCardProps) {
  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const { sessionId } = await response.json();
      
      // Redirigir a Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error al iniciar el checkout:', error);
    }
  };

  return (
    <Card className="border-primary shadow-lg ring-2 ring-primary">
      <CardHeader>
        <CardTitle className="text-2xl">MarkdownPro Subscription</CardTitle>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-bold">{price}</span>
          <span className="ml-1 text-sm text-muted-foreground">/{period}</span>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="mr-2 h-5 w-5 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          variant={buttonVariant} 
          className="w-full"
          onClick={handleSubscribe}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  )
}

interface FaqCardProps {
  question: string
  answer: string
}

function FaqCard({ question, answer }: FaqCardProps) {
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-medium">{question}</h3>
      <p className="mt-2 text-muted-foreground">{answer}</p>
    </div>
  )
}

