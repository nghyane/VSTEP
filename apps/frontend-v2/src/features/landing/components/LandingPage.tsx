import { useState } from "react"
import { AuthDialog } from "#/features/auth"
import { Footer } from "./Footer"
import { HeroHeader, HeroSection } from "./HeroSection"
import { HowItWorksSection } from "./HowItWorksSection"
import { MascotSection } from "./MascotSection"
import { RoadmapSection } from "./RoadmapSection"
import { SkillsSection } from "./SkillsSection"
import { TestimonialsSection } from "./TestimonialsSection"

export function LandingPage() {
	const [isAuthOpen, setIsAuthOpen] = useState(false)
	const openAuth = () => setIsAuthOpen(true)

	return (
		<div className="min-h-screen bg-background text-foreground">
			<HeroHeader onOpenAuth={openAuth} />
			<HeroSection onOpenAuth={openAuth} />
			<SkillsSection />
			<HowItWorksSection />
			<RoadmapSection />
			<TestimonialsSection />
			<MascotSection onOpenAuth={openAuth} />
			<Footer />
			<AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
		</div>
	)
}
