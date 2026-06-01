import { useState } from "react"
import { AuthDialog } from "#/features/auth/components/AuthDialog"
import { BentoFeaturesSection } from "./BentoFeaturesSection"
import { CtaSection } from "./CtaSection"
import { Footer } from "./Footer"
import { HeroSection } from "./HeroSection"
import { HowItWorksSection } from "./HowItWorksSection"
import { RoadmapSection } from "./RoadmapSection"
import { SocialProofSection } from "./SocialProofSection"

export function LandingPage() {
	const [isAuthOpen, setIsAuthOpen] = useState(false)

	return (
		<div className="min-h-screen bg-background text-foreground">
			<HeroSection onOpenAuth={() => setIsAuthOpen(true)} />
			<BentoFeaturesSection />
			<HowItWorksSection />
			<RoadmapSection />
			<SocialProofSection />
			<CtaSection onOpenAuth={() => setIsAuthOpen(true)} />
			<Footer />
			<AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
		</div>
	)
}
