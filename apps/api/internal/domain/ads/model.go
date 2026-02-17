package ads

type AdSlot struct {
	ID       string `json:"id"`
	Name     string `json:"name"`      // e.g. "header", "in_article_1", "sidebar", "footer"
	Code     string `json:"code"`       // AdSense script/code
	IsActive bool   `json:"is_active"`
	Position string `json:"position"`   // placement position
}
