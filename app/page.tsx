'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Heart, 
  Activity, 
  Users, 
  Shield, 
  BarChart3, 
  Clock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const features = [
    {
      icon: Heart,
      title: 'Health Monitoring',
      description: 'Track vital signs and health metrics in real-time',
    },
    {
      icon: Users,
      title: 'Patient Management',
      description: 'Comprehensive patient records and history',
    },
    {
      icon: Activity,
      title: 'Vitals Tracking',
      description: 'Monitor blood pressure, heart rate, and more',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Visualize health trends and insights',
    },
    {
      icon: Clock,
      title: 'Appointment Scheduling',
      description: 'Easy booking and reminders system',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">HealthVitals</span>
            </div>
            <div className="flex items-center gap-4">
              {status === 'authenticated' ? (
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Your Health,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track, monitor, and manage your health vitals with our comprehensive healthcare platform.
            Secure, reliable, and always available.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Better Health
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features to help you manage your health journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            <h2 className="text-3xl font-bold mb-6">Why Choose HealthVitals?</h2>
            <div className="space-y-4">
              {[
                'Real-time health monitoring and alerts',
                'Secure cloud storage for all medical records',
                'Integration with popular health devices',
                'Comprehensive analytics and reporting',
                '24/7 support from healthcare professionals',
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Get Started Today
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-6 w-6 mr-2" />
            <span className="text-lg font-semibold">HealthVitals</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 HealthVitals. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}