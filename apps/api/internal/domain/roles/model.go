package roles

type Role struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Permissions []Permission `json:"permissions,omitempty"`
}

type Permission struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Module string `json:"module"`
}
