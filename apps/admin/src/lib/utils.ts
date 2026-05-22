export function cn(...inputs: (string | number | boolean | null | undefined)[]): string {
	return inputs.filter((x): x is string => typeof x === "string" && x.length > 0).join(" ")
}
