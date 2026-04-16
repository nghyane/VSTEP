import { BentoFeaturesSection } from "./BentoFeaturesSection"
import { CtaSection } from "./CtaSection"
import { Footer } from "./Footer"
import { HeroSection } from "./HeroSection"
import { HowItWorksSection } from "./HowItWorksSection"
import { RoadmapSection } from "./RoadmapSection"
import { SocialProofSection } from "./SocialProofSection"

export function LandingPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<HeroSection />
			<BentoFeaturesSection />
			<HowItWorksSection />
			<RoadmapSection />
			<SocialProofSection />
			<CtaSection />
			<Footer />
		</div>
	)
}
