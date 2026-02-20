package gateway

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// TripayClient handles Tripay payment gateway integration.
type TripayClient struct {
	APIKey       string
	PrivateKey   string
	MerchantCode string
	IsSandbox    bool
	HTTPClient   *http.Client
}

// NewTripayClient creates a new Tripay API client.
func NewTripayClient(apiKey, privateKey, merchantCode string, sandbox bool) *TripayClient {
	return &TripayClient{
		APIKey:       apiKey,
		PrivateKey:   privateKey,
		MerchantCode: merchantCode,
		IsSandbox:    sandbox,
		HTTPClient:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *TripayClient) baseURL() string {
	if c.IsSandbox {
		return "https://tripay.co.id/api-sandbox"
	}
	return "https://tripay.co.id/api"
}

// TripayCreateTxRequest is the Tripay API request body.
type TripayCreateTxRequest struct {
	Method        string            `json:"method"`
	MerchantRef   string            `json:"merchant_ref"`
	Amount        int64             `json:"amount"`
	CustomerName  string            `json:"customer_name"`
	CustomerEmail string            `json:"customer_email"`
	CustomerPhone string            `json:"customer_phone"`
	CallbackURL   string            `json:"callback_url"`
	ReturnURL     string            `json:"return_url"`
	ExpiredTime   int               `json:"expired_time"`
	Signature     string            `json:"signature"`
	OrderItems    []TripayOrderItem `json:"order_items"`
}

// TripayOrderItem is a line item in the Tripay transaction.
type TripayOrderItem struct {
	Name     string `json:"name"`
	Price    int64  `json:"price"`
	Quantity int    `json:"quantity"`
}

// TripayResponse is the API response wrapper.
type TripayResponse struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

// TripayTransactionData is the response data from creating a transaction.
type TripayTransactionData struct {
	Reference      string `json:"reference"`
	MerchantRef    string `json:"merchant_ref"`
	PaymentURL     string `json:"checkout_url"`
	PayCode        string `json:"pay_code"`
	QRURL          string `json:"qr_url"`
	Amount         int64  `json:"amount"`
	Fee            int64  `json:"fee_merchant"`
	TotalFee       int64  `json:"total_fee"`
	AmountReceived int64  `json:"amount_received"`
	ExpiredTime    int64  `json:"expired_time"`
	Status         string `json:"status"`
}

// CreateTransaction creates a new payment transaction via Tripay.
func (c *TripayClient) CreateTransaction(req TripayCreateTxRequest) (*TripayTransactionData, error) {
	// Generate signature: HMAC-SHA256(merchantCode + merchantRef + amount)
	sigPayload := c.MerchantCode + req.MerchantRef + fmt.Sprintf("%d", req.Amount)
	mac := hmac.New(sha256.New, []byte(c.PrivateKey))
	mac.Write([]byte(sigPayload))
	req.Signature = hex.EncodeToString(mac.Sum(nil))

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", c.baseURL()+"/transaction/create", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.APIKey)

	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("tripay request: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var tripayResp TripayResponse
	if err := json.Unmarshal(respBody, &tripayResp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	if !tripayResp.Success {
		return nil, fmt.Errorf("tripay error: %s", tripayResp.Message)
	}

	var txData TripayTransactionData
	if err := json.Unmarshal(tripayResp.Data, &txData); err != nil {
		return nil, fmt.Errorf("unmarshal tx data: %w", err)
	}

	return &txData, nil
}

// TripayCallbackPayload is the webhook payload from Tripay.
type TripayCallbackPayload struct {
	Reference         string `json:"reference"`
	MerchantRef       string `json:"merchant_ref"`
	PaymentMethod     string `json:"payment_method"`
	PaymentMethodCode string `json:"payment_method_code"`
	TotalAmount       int64  `json:"total_amount"`
	FeeMerchant       int64  `json:"fee_merchant"`
	FeeCustomer       int64  `json:"fee_customer"`
	TotalFee          int64  `json:"total_fee"`
	AmountReceived    int64  `json:"amount_received"`
	IsClosedPayment   int    `json:"is_closed_payment"`
	Status            string `json:"status"` // PAID | EXPIRED | FAILED
	PaidAt            int64  `json:"paid_at"`
}

// ValidateCallback validates the Tripay webhook signature.
func (c *TripayClient) ValidateCallback(signature string, body []byte) bool {
	mac := hmac.New(sha256.New, []byte(c.PrivateKey))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}
