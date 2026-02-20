package posts

// Policy contains authorization rules for post actions.
// These are checked in handlers before calling service methods.

// CanEdit checks if a user can edit a post.
func CanEdit(userID, authorID, role string) bool {
	if role == "OWNER" || role == "ADMIN" || role == "EDITOR" {
		return true
	}
	// Authors can only edit their own posts
	return userID == authorID
}

// CanPublish checks if a user can publish a post.
func CanPublish(role string) bool {
	return role == "OWNER" || role == "ADMIN" || role == "EDITOR"
}

// CanDelete checks if a user can delete a post.
func CanDelete(userID, authorID, role string) bool {
	if role == "OWNER" || role == "ADMIN" {
		return true
	}
	return userID == authorID
}

// CanSubmitReview checks if a user can submit a post for review.
func CanSubmitReview(userID, authorID, role string) bool {
	if role == "OWNER" || role == "ADMIN" || role == "EDITOR" {
		return true
	}
	return userID == authorID
}
