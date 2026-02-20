package settings

import "time"

type SiteSetting struct {
	ID        string    `json:"id"`
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Default setting keys
const (
	KeySiteTitle              = "site_title"
	KeySiteDescription        = "site_description"
	KeySiteLogo               = "site_logo"
	KeyDefaultOGImage         = "default_og_image"
	KeySocialTwitter          = "social_twitter"
	KeySocialGithub           = "social_github"
	KeyAdsTxt                 = "ads_txt"
	KeyPrivacyPolicy          = "privacy_policy"
	KeyTermsOfService         = "terms_of_service"
	KeyContactInfo            = "contact_info"
	KeyAffiliateHowItWorks    = "affiliate_how_it_works"
	KeySocialFacebook         = "social_facebook"
	KeySocialInstagram        = "social_instagram"
	KeySocialYoutube          = "social_youtube"
	KeySocialLinkedin         = "social_linkedin"
	KeyFooterText             = "footer_text"
	KeyAboutPage              = "about_page"
	KeyContactEmail           = "contact_email"
)
