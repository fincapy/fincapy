import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm mb-0 sm:mb-24">
        <div className="flex h-20 items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icons/android-chrome-192x192.png"
              alt="Fincapy Logo"
              width={60}
              height={60}
              className="h-[60px] w-[60px] ml-[9px]"
              priority
            />
          </Link>
          <div className="flex items-center gap-3 px-7">
            <Link href="/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-amber-600 text-white hover:bg-amber-700">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-8 w-full mb-48">
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
            <h1 className="text-6xl sm:text-6xl font-bold tracking-tighter md:text-6xl lg:text-6xl xl:text-6xl text-center">
              Your Money
              <span className="text-amber-600"> Simplified</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground md:text-xl text-center">
              Instant insights, zero hassle, capybara approved. A customizable
              and automated budgeting solution that just works.
            </p>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-[200px] mt-4 bg-amber-600 text-white hover:bg-amber-700 font-bold text-md"
              >
                Join the waitlist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-12 md:py-24 lg:py-32">
        <div className="px-4 md:px-6">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Why Choose Fincapy?
            </h2>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Our app is packed with features designed to make budgeting simple
              and effective.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Customizable Categories"
              description="Create your own spending categories that match your unique lifestyle and financial goals."
              icon="📊"
            />
            <FeatureCard
              title="AI Transaction Sorting"
              description="Our AI automatically categorizes your transactions, saving you time and reducing manual work."
              icon="🤖"
            />
            <FeatureCard
              title="Full Control"
              description="Manage your finances your way with complete control over your budgeting approach."
              icon="🎛️"
            />
            <FeatureCard
              title="Bank Connection"
              description="Securely connect your bank accounts for automatic transaction importing."
              icon="🏦"
            />
            <FeatureCard
              title="Insights & Analytics"
              description="Get powerful insights into your spending habits."
              icon="📈"
            />
            <FeatureCard
              title="Mobile Friendly"
              description="Access your budget anytime, anywhere with our responsive mobile design."
              icon="📱"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="md:w-1/2">
              {/* <Image
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070"
                alt="Founder"
                width={500}
                height={500}
                className="mx-auto h-auto w-full max-w-[400px] rounded-lg object-cover"
              /> */}
            </div>
            <div className="space-y-4 md:w-1/2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Our Vision
              </h2>
              <p className="text-muted-foreground">
                At Fincapy, we believe that financial management should be
                accessible, customizable, and even fun. Our journey began when I
                noticed how rigid most budgeting apps were, forcing users into
                predefined categories that didn&apos;t reflect their actual
                spending habits.
              </p>
              <p className="text-muted-foreground">
                That&apos;s why we created Fincapy,a budgeting app that puts you
                in control. With our cute capybara mascot leading the way,
                we&apos;re making finance management less intimidating and more
                approachable for tech-savvy millennials.
              </p>
              <p className="text-muted-foreground">
                Our mission is to empower users with the tools they need to
                understand their finances better and make informed decisions
                about their spending and saving habits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-muted/50 py-12 md:py-24 lg:py-32">
        <div className="px-4 md:px-6">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Choose the plan that works best for your financial journey.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            <Card className="flex flex-col p-6">
              <div className="mb-4 text-center">
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="text-muted-foreground">Check it out</p>
              </div>
              <div className="mb-4 text-center">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mb-6 space-y-2">
                <PricingFeature text="Customizable categories" included />
                <PricingFeature text="Manual transaction entry" included />
                <PricingFeature text="Bank account linking" included={false} />
                <PricingFeature
                  text="AI transaction categorization"
                  included={false}
                />
              </ul>
              <Link href="/signup" className="mt-auto">
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </Link>
            </Card>

            <Card className="flex flex-col border-amber-600 p-6">
              <div className="mb-4 text-center">
                <div className="mb-2 inline-block rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                  RECOMMENDED
                </div>
                <h3 className="text-2xl font-bold">Premium</h3>
                <p className="text-muted-foreground">Automate everything</p>
              </div>
              <div className="mb-4 text-center">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mb-6 space-y-2">
                <PricingFeature text="Everything in Free" included />
                <PricingFeature text="Bank account linking" included />
                <PricingFeature text="Automatic transaction imports" included />
                <PricingFeature text="AI transaction categorization" included />
              </ul>
              <Link href="/signup?plan=premium" className="mt-auto">
                <Button className="w-full bg-amber-600 text-white hover:bg-amber-700">
                  Get Premium
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section id="testimonials" className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              What Our Users Say
            </h2>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Don't just take our word for it. Here's what people are saying
              about Fincapy.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              quote="Fincapy changed how I think about budgeting. The customizable categories are perfect for my unique spending habits."
              author="Alex P."
              role="Software Developer"
            />
            <TestimonialCard
              quote="The AI categorization is surprisingly accurate! It saves me hours every month that I used to spend manually sorting transactions."
              author="Morgan T."
              role="Marketing Specialist"
            />
            <TestimonialCard
              quote="I've tried many budgeting apps, but Fincapy is the first one that actually fits my lifestyle. The capybara is cute too!"
              author="Jamie K."
              role="Freelance Designer"
            />
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="bg-amber-600 py-12 md:py-24">
        <div className="px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
              Ready to Take Control of Your Finances?
            </h2>
            <p className="max-w-[700px] text-lg text-white/80">
              Join thousands of users who are managing their money smarter with
              Fincapy.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="mt-4 bg-white text-amber-600 hover:bg-gray-100"
              >
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/capybara.png"
                  alt="Fincapy Logo"
                  width={30}
                  height={30}
                  className="h-8 w-8"
                />
                <span className="text-lg font-bold">Fincapy</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Making finance management simple and customizable for everyone.
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/blog"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guides"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Budgeting Guides
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/trust"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Why Trust Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Fincapy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper components
function FeatureCard({ title, description, icon }) {
  return (
    <Card className="flex flex-col items-center p-6 text-center">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}

function TestimonialCard({ quote, author, role }) {
  return (
    <Card className="flex flex-col p-6">
      <div className="mb-4 text-4xl">&quot;</div>
      <p className="mb-4 flex-grow text-muted-foreground">{quote}</p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </Card>
  );
}

function PricingFeature({ text, included }) {
  return (
    <li className="flex items-center">
      <span
        className={`mr-2 text-lg ${included ? 'text-green-500' : 'text-muted-foreground'}`}
      >
        {included ? '✓' : '✕'}
      </span>
      <span className={included ? '' : 'text-muted-foreground'}>{text}</span>
    </li>
  );
}
