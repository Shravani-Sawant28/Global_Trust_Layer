import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import WhyGTLSection from '@/components/landing/WhyGTLSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'GlobalTrust — Trust Protocol for Cross-Border Work',
  description:
    'Decentralized escrow, on-chain reputation, and AI-powered risk analysis for freelancers and clients worldwide. Built on Arbitrum.',
};

/**
 * Landing page — public, visible before wallet connection.
 * Sections: Hero → How It Works → Why GTL → Features → Footer
 */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <WhyGTLSection />
      <FeaturesSection />
      <Footer />
    </>
  );
}
