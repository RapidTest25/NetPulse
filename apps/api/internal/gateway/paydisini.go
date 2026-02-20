package gateway

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// PaydisiniClient handles Paydisini payment gateway integration.
type PaydisiniClient struct {
	APIKey     string
	IsSandbox  bool
	HTTPClient *http.Client
}

// NewPaydisiniClient creates a new Paydisini API client.
func NewPaydisiniClient(apiKey string, sandbox bool) *PaydisiniClient {
	return &PaydisiniClient{
		APIKey:     apiKey,
		IsSandbox:  sandbox,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}

const paydisiniBaseURL = "https://paydisini.co.id/api/"

// PaydisiniCreateRequest is the request to create a Paydisini transaction.
type PaydisiniCreateRequest struct {
	UniqueCode  string `json:"unique_code"` // merchant ref / order number
	Service     string `json:"service"`     // payment method code (11=QRIS, 1=BCA, etc)
	Amount      int64  `json:"amount"`
	Note        string `json:"note"`
	ValidTime   int    `json:"valid_time"`  // seconds
	TypeFee     int    `json:"type_fee"`    // 1=buyer, 2=seller
	PaymentURL  string `json:"payment_url"` // return URL
	CallbackURL string `json:"callback_url"`
}

// PaydisiniResponse is the API response.
type PaydisiniResponse struct {
	Success bool                     `json:"success"`
	Message string                   `json:"msg"`
	Data    PaydisiniTransactionData `json:"data,omitempty"`
}

// PaydisiniTransactionData is the transaction detail.
type PaydisiniTransactionData struct {
	TransactionID  string `json:"transaction"`
	UniqueCode     string `json:"unique_code"`
	Status         string `json:"status"` // Pending | Success | Canceled | Expired
	Amount         int64  `json:"amount"`
	Fee            int64  `json:"fee"`
	Balance        int64  `json:"balance"`
	ServiceName    string `json:"service_name"`
	QRCodeURL      string `json:"qrcode_url"`
	PayCode        string `json:"pay_code"`
	VirtualAccount string `json:"virtual_account"`
	CheckoutURL    string `json:"checkout_url"`
	ExpiredTime    string `json:"expired_time"`
}

// CreateTransaction creates a new payment via Paydisini.
func (c *PaydisiniClient) CreateTransaction(req PaydisiniCreateRequest) (*PaydisiniTransactionData, error) {
	// Generate signature: md5(apiKey + uniqueCode + service + amount + validTime + "NewTransaction")
	sigInput := fmt.Sprintf("%s%s%s%d%d%s",
		c.APIKey, req.UniqueCode, req.Service, req.Amount, req.ValidTime, "NewTransaction")
	hash := md5.Sum([]byte(sigInput))
	signature := hex.EncodeToString(hash[:])

	// Build form data
	form := url.Values{}
	form.Set("key", c.APIKey)
	form.Set("request", "new")
	form.Set("unique_code", req.UniqueCode)
	form.Set("service", req.Service)
	form.Set("amount", fmt.Sprintf("%d", req.Amount))
	form.Set("note", req.Note)
	form.Set("valid_time", fmt.Sprintf("%d", req.ValidTime))
	form.Set("type_fee", fmt.Sprintf("%d", req.TypeFee))
	form.Set("payment_url", req.PaymentURL)
	form.Set("callback_url", req.CallbackURL)
	form.Set("signature", signature)

	httpReq, err := http.NewRequest("POST", paydisiniBaseURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("paydisini request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var pdResp PaydisiniResponse
	if err := json.Unmarshal(body, &pdResp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	if !pdResp.Success {
		return nil, fmt.Errorf("paydisini error: %s", pdResp.Message)
	}

	return &pdResp.Data, nil
}

// PaydisiniCallbackPayload is the webhook payload from Paydisini.
type PaydisiniCallbackPayload struct {
	Key        string `json:"key"`
	UniqueCode string `json:"unique_code"`
	Status     string `json:"status"` // Success | Canceled | Expired
	Signature  string `json:"signature"`
}

// ValidateCallback validates the Paydisini webhook signature.
func (c *PaydisiniClient) ValidateCallback(uniqueCode, status, signature string) bool {
	// md5(apiKey + uniqueCode + "CallbackStatus")
	sigInput := fmt.Sprintf("%s%s%s", c.APIKey, uniqueCode, "CallbackStatus")
	hash := md5.Sum([]byte(sigInput))
	expected := hex.EncodeToString(hash[:])
	return expected == signature
}

// MapServiceCode maps our internal payment method code to Paydisini service code.
func MapServiceCode(methodCode string) string {
	codes := map[string]string{
		"QRIS":      "11",
		"DANA":      "17",
		"GOPAY":     "12",
		"OVO":       "16",
		"SHOPEEPAY": "18",
	}
	if code, ok := codes[methodCode]; ok {
		return code
	}
	return "11" // default QRIS
}
