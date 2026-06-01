export interface AppConfig {
	wallet: {
		onboarding_initial_coins: number
	}
	profile: {
		max_profiles_per_account: number
	}
	pricing: {
		exam: {
			full_test_cost_coins: number
			custom_per_skill_coins: number
			max_cost_coins: number
		}
		practice: {
			feedback_cost_coins: number
		}
	}
}
